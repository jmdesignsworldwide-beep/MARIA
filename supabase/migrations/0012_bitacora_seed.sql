-- ============================================================
--  JM FACTURACIÓN — Semilla de Bitácora (últimos 30 días)
--  0012 · Historial realista y coherente con las facturas,
--  clientes y gastos ya sembrados. Incluye al menos un ejemplo
--  de cada tipo de acción (crear, editar, eliminar, anular,
--  emitir, pago, sesión) y ediciones con antes/después visibles.
--  Idempotente: se limpia y regenera para el demo.
-- ============================================================

do $$
declare
  v_owner uuid;
  v_email text;
  v_nombre text;
  v_ua text := 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36';
  v_ip text := '190.166.24.10';
  f record;
  g record;
  c record;
begin
  select id, email, coalesce(nombre_completo, email) into v_owner, v_email, v_nombre
    from public.profiles order by created_at asc limit 1;
  if v_owner is null then return; end if;

  -- Limpieza para regenerar historial de demo (postgres es dueño de la tabla).
  delete from public.bitacora where owner_id = v_owner;

  -- Helper local para insertar un evento con fecha relativa.
  -- (usamos un procedimiento en línea vía inserts directos)

  -- === Sesiones ===
  insert into public.bitacora (owner_id, usuario_email, accion, entidad, entidad_id, descripcion, ip, user_agent, created_at) values
    (v_owner, v_email, 'sesion_fallida', 'sesion', null,
     'Intento fallido de inicio de sesión con el correo ' || v_email,
     '201.229.88.4', v_ua, now() - interval '29 days' + interval '8 hours'),
    (v_owner, v_email, 'sesion_inicio', 'sesion', null,
     v_nombre || ' inició sesión', v_ip, v_ua, now() - interval '29 days' + interval '8 hours 2 minutes'),
    (v_owner, v_email, 'sesion_cierre', 'sesion', null,
     v_nombre || ' cerró sesión', v_ip, v_ua, now() - interval '29 days' + interval '17 hours'),
    (v_owner, v_email, 'sesion_inicio', 'sesion', null,
     v_nombre || ' inició sesión', v_ip, v_ua, now() - interval '2 days' + interval '9 hours');

  -- === Clientes ===
  select id, nombre from public.clientes where owner_id = v_owner order by created_at asc limit 1 into c;
  if c.id is not null then
    insert into public.bitacora (owner_id, usuario_email, accion, entidad, entidad_id, descripcion, datos_despues, ip, user_agent, created_at) values
      (v_owner, v_email, 'crear', 'cliente', c.id,
       v_nombre || ' creó el cliente ' || c.nombre,
       jsonb_build_object('nombre', c.nombre, 'tipo', 'empresa', 'limite_credito', 50000),
       v_ip, v_ua, now() - interval '27 days');
    -- Edición con antes/después visibles (límite de crédito y teléfono).
    insert into public.bitacora (owner_id, usuario_email, accion, entidad, entidad_id, descripcion, datos_antes, datos_despues, ip, user_agent, created_at) values
      (v_owner, v_email, 'editar', 'cliente', c.id,
       v_nombre || ' editó el cliente ' || c.nombre,
       jsonb_build_object('nombre', c.nombre, 'telefono', '809-555-1000', 'limite_credito', 50000, 'activo', true),
       jsonb_build_object('nombre', c.nombre, 'telefono', '809-555-2048', 'limite_credito', 120000, 'activo', true),
       v_ip, v_ua, now() - interval '20 days');
  end if;

  -- === Facturas: crear, emitir, pago, anular ===
  for f in
    select id, numero, total, cliente_id from public.facturas
    where owner_id = v_owner order by created_at desc limit 3
  loop
    select nombre into v_nombre from public.clientes where id = f.cliente_id;
    v_nombre := coalesce(v_nombre, 'un cliente');
    insert into public.bitacora (owner_id, usuario_email, accion, entidad, entidad_id, descripcion, datos_despues, ip, user_agent, created_at) values
      (v_owner, v_email, 'crear', 'factura', f.id,
       (select coalesce(nombre_completo, email) from public.profiles where id = v_owner)
         || ' creó la factura ' || f.numero || ' (' || public.fmt_rd(f.total) || ')',
       jsonb_build_object('numero', f.numero, 'total', f.total, 'estado', 'borrador'),
       v_ip, v_ua, now() - interval '18 days');
    insert into public.bitacora (owner_id, usuario_email, accion, entidad, entidad_id, descripcion, datos_antes, datos_despues, ip, user_agent, created_at) values
      (v_owner, v_email, 'emitir', 'factura', f.id,
       (select coalesce(nombre_completo, email) from public.profiles where id = v_owner)
         || ' emitió la factura ' || f.numero || ' por ' || public.fmt_rd(f.total) || ' a ' || v_nombre,
       jsonb_build_object('estado', 'borrador'), jsonb_build_object('estado', 'emitida'),
       v_ip, v_ua, now() - interval '18 days' + interval '5 minutes');
    insert into public.bitacora (owner_id, usuario_email, accion, entidad, entidad_id, descripcion, ip, user_agent, created_at) values
      (v_owner, v_email, 'pago', 'factura', f.id,
       (select coalesce(nombre_completo, email) from public.profiles where id = v_owner)
         || ' registró un pago de ' || public.fmt_rd(round(f.total * 0.5, 2)) || ' en la factura ' || f.numero,
       v_ip, v_ua, now() - interval '12 days');
  end loop;

  -- Anulación con motivo sobre la factura más reciente.
  select id, numero from public.facturas where owner_id = v_owner order by created_at desc limit 1 into f;
  if f.id is not null then
    insert into public.bitacora (owner_id, usuario_email, accion, entidad, entidad_id, descripcion, datos_antes, datos_despues, ip, user_agent, created_at) values
      (v_owner, v_email, 'anular', 'factura', f.id,
       (select coalesce(nombre_completo, email) from public.profiles where id = v_owner)
         || ' anuló la factura ' || f.numero || ' (motivo: error en el precio acordado con el cliente)',
       jsonb_build_object('estado', 'emitida'),
       jsonb_build_object('estado', 'anulada', 'motivo_anulacion', 'error en el precio acordado con el cliente'),
       v_ip, v_ua, now() - interval '5 days');
  end if;

  -- === Cotización ===
  insert into public.bitacora (owner_id, usuario_email, accion, entidad, entidad_id, descripcion, ip, user_agent, created_at) values
    (v_owner, v_email, 'crear', 'cotización', gen_random_uuid(),
     (select coalesce(nombre_completo, email) from public.profiles where id = v_owner) || ' creó la cotización COT-2026-0007',
     v_ip, v_ua, now() - interval '15 days');

  -- === Gastos: crear + editar con antes/después ===
  for g in
    select id, descripcion, monto from public.gastos where owner_id = v_owner order by created_at desc limit 2
  loop
    insert into public.bitacora (owner_id, usuario_email, accion, entidad, entidad_id, descripcion, datos_despues, ip, user_agent, created_at) values
      (v_owner, v_email, 'crear', 'gasto', g.id,
       (select coalesce(nombre_completo, email) from public.profiles where id = v_owner)
         || ' registró el gasto ' || g.descripcion || ' (' || public.fmt_rd(g.monto) || ')',
       jsonb_build_object('descripcion', g.descripcion, 'monto', g.monto),
       v_ip, v_ua, now() - interval '10 days');
  end loop;
  select id, descripcion, monto from public.gastos where owner_id = v_owner order by created_at desc limit 1 into g;
  if g.id is not null then
    insert into public.bitacora (owner_id, usuario_email, accion, entidad, entidad_id, descripcion, datos_antes, datos_despues, ip, user_agent, created_at) values
      (v_owner, v_email, 'editar', 'gasto', g.id,
       (select coalesce(nombre_completo, email) from public.profiles where id = v_owner)
         || ' editó el gasto ' || g.descripcion,
       jsonb_build_object('descripcion', g.descripcion, 'monto', g.monto, 'metodo_pago', 'efectivo'),
       jsonb_build_object('descripcion', g.descripcion, 'monto', round(g.monto * 1.1, 2), 'metodo_pago', 'transferencia'),
       v_ip, v_ua, now() - interval '7 days');
  end if;

  -- === Compra ===
  insert into public.bitacora (owner_id, usuario_email, accion, entidad, entidad_id, descripcion, ip, user_agent, created_at) values
    (v_owner, v_email, 'crear', 'compra', gen_random_uuid(),
     (select coalesce(nombre_completo, email) from public.profiles where id = v_owner)
       || ' registró una compra de ' || public.fmt_rd(28500),
     v_ip, v_ua, now() - interval '9 days');

  -- === Catálogo: crear + cambio de precio ===
  insert into public.bitacora (owner_id, usuario_email, accion, entidad, entidad_id, descripcion, datos_antes, datos_despues, ip, user_agent, created_at) values
    (v_owner, v_email, 'editar', 'catalogo', gen_random_uuid(),
     (select coalesce(nombre_completo, email) from public.profiles where id = v_owner)
       || ' cambió el precio de Servicio de instalación de ' || public.fmt_rd(38000) || ' a ' || public.fmt_rd(42000),
     jsonb_build_object('descripcion', 'Servicio de instalación', 'precio_sugerido', 38000),
     jsonb_build_object('descripcion', 'Servicio de instalación', 'precio_sugerido', 42000),
     v_ip, v_ua, now() - interval '6 days');

  -- === Ajustes ===
  insert into public.bitacora (owner_id, usuario_email, accion, entidad, entidad_id, descripcion, datos_antes, datos_despues, ip, user_agent, created_at) values
    (v_owner, v_email, 'editar', 'ajustes', v_owner,
     (select coalesce(nombre_completo, email) from public.profiles where id = v_owner)
       || ' actualizó la configuración de la empresa',
     jsonb_build_object('itbis_tasa', 18.00, 'prefijo_factura', 'FAC'),
     jsonb_build_object('itbis_tasa', 18.00, 'prefijo_factura', 'FACT'),
     v_ip, v_ua, now() - interval '3 days');

  -- === Eliminación (para tener el color rojo de "eliminó") ===
  insert into public.bitacora (owner_id, usuario_email, accion, entidad, entidad_id, descripcion, datos_antes, ip, user_agent, created_at) values
    (v_owner, v_email, 'eliminar', 'gasto', gen_random_uuid(),
     (select coalesce(nombre_completo, email) from public.profiles where id = v_owner)
       || ' eliminó el gasto Compra duplicada de material (' || public.fmt_rd(4200) || ')',
     jsonb_build_object('descripcion', 'Compra duplicada de material', 'monto', 4200),
     v_ip, v_ua, now() - interval '1 day');
end $$;
