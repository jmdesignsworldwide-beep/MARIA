-- ============================================================
--  JM FACTURACIÓN — Módulo Bitácora (auditoría inviolable)
--  0011 · Columnas nuevas, disparador con descripción en español,
--  registro de sesión e inviolabilidad a nivel de Postgres.
-- ============================================================

-- ---------- 1) Columnas nuevas ----------
alter table public.bitacora add column if not exists descripcion text;
alter table public.bitacora add column if not exists user_agent text;

create index if not exists idx_bitacora_owner_fecha
  on public.bitacora (owner_id, created_at desc);
create index if not exists idx_bitacora_entidad
  on public.bitacora (owner_id, entidad);
create index if not exists idx_bitacora_accion
  on public.bitacora (owner_id, accion);

-- ---------- 2) Helpers ----------
-- Formato de dinero dominicano: 45000 -> "RD$ 45,000.00".
create or replace function public.fmt_rd(v numeric)
returns text language sql immutable set search_path = '' as $$
  select 'RD$ ' || to_char(coalesce(v, 0), 'FM999,999,999,990.00');
$$;

-- Nombre singular y legible de una entidad (tabla -> palabra).
create or replace function public.etiqueta_entidad(t text)
returns text language sql immutable set search_path = '' as $$
  select case t
    when 'facturas' then 'factura'
    when 'cotizaciones' then 'cotización'
    when 'clientes' then 'cliente'
    when 'suplidores' then 'suplidor'
    when 'catalogo_items' then 'catalogo'
    when 'compras' then 'compra'
    when 'pagos' then 'pago'
    when 'gastos' then 'gasto'
    when 'empresa_config' then 'ajustes'
    else t
  end;
$$;

-- ---------- 3) Disparador de auditoría (reescrito) ----------
create or replace function public.tg_auditoria()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
  v_actor uuid;
  v_actor_nombre text;
  v_entidad text;
  v_entidad_id uuid;
  v_accion text;
  v_desc text;
  v_antes jsonb;
  v_despues jsonb;
  v_ip text;
  v_ua text;
  v_cli text;
  v_num text;
  v_total numeric;
  v_monto numeric;
begin
  if tg_op = 'DELETE' then
    v_owner := old.owner_id; v_entidad_id := old.id;
    v_antes := to_jsonb(old); v_despues := null;
  elsif tg_op = 'UPDATE' then
    v_owner := new.owner_id; v_entidad_id := new.id;
    v_antes := to_jsonb(old); v_despues := to_jsonb(new);
  else
    v_owner := new.owner_id; v_entidad_id := new.id;
    v_antes := null; v_despues := to_jsonb(new);
  end if;

  v_entidad := public.etiqueta_entidad(tg_table_name);
  v_actor := coalesce(auth.uid(), v_owner);
  select coalesce(nombre_completo, email, 'Alguien') into v_actor_nombre
    from public.profiles where id = v_actor;
  v_actor_nombre := coalesce(v_actor_nombre, 'Alguien');

  -- Cabeceras de la petición (IP y navegador), si existen.
  begin
    v_ip := nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-forwarded-for';
    v_ua := nullif(current_setting('request.headers', true), '')::jsonb ->> 'user-agent';
  exception when others then
    v_ip := null; v_ua := null;
  end;

  -- Acción base según operación.
  v_accion := case tg_op when 'INSERT' then 'crear' when 'UPDATE' then 'editar' else 'eliminar' end;

  -- ---- Descripción legible por entidad ----
  if tg_table_name = 'facturas' then
    v_num := coalesce((v_despues ->> 'numero'), (v_antes ->> 'numero'));
    v_total := coalesce((v_despues ->> 'total'), (v_antes ->> 'total'))::numeric;
    select nombre into v_cli from public.clientes
      where id = coalesce((v_despues ->> 'cliente_id'), (v_antes ->> 'cliente_id'))::uuid;
    if tg_op = 'UPDATE'
       and (v_antes ->> 'estado') is distinct from (v_despues ->> 'estado') then
      if (v_despues ->> 'estado') = 'anulada' then
        v_accion := 'anular';
        v_desc := v_actor_nombre || ' anuló la factura ' || v_num
          || coalesce(' (motivo: ' || (v_despues ->> 'motivo_anulacion') || ')', '');
      elsif (v_despues ->> 'estado') = 'emitida' then
        v_accion := 'emitir';
        v_desc := v_actor_nombre || ' emitió la factura ' || v_num
          || ' por ' || public.fmt_rd(v_total)
          || coalesce(' a ' || v_cli, '');
      end if;
    end if;
    if v_desc is null then
      v_desc := v_actor_nombre || ' ' ||
        case v_accion when 'crear' then 'creó' when 'eliminar' then 'eliminó' else 'editó' end
        || ' la factura ' || v_num || ' (' || public.fmt_rd(v_total) || ')'
        || coalesce(' — ' || v_cli, '');
    end if;

  elsif tg_table_name = 'pagos' then
    v_monto := coalesce((v_despues ->> 'monto'), (v_antes ->> 'monto'))::numeric;
    select numero into v_num from public.facturas
      where id = coalesce((v_despues ->> 'factura_id'), (v_antes ->> 'factura_id'))::uuid;
    v_accion := case tg_op when 'DELETE' then 'eliminar' else 'pago' end;
    v_entidad := 'factura';
    v_entidad_id := coalesce((v_despues ->> 'factura_id'), (v_antes ->> 'factura_id'))::uuid;
    v_desc := v_actor_nombre || ' ' ||
      case tg_op when 'DELETE' then 'revirtió un pago de ' else 'registró un pago de ' end
      || public.fmt_rd(v_monto) || coalesce(' en la factura ' || v_num, '');

  elsif tg_table_name = 'cotizaciones' then
    v_num := coalesce((v_despues ->> 'numero'), (v_antes ->> 'numero'));
    v_desc := v_actor_nombre || ' ' ||
      case v_accion when 'crear' then 'creó' when 'eliminar' then 'eliminó' else 'editó' end
      || ' la cotización ' || v_num;

  elsif tg_table_name = 'clientes' then
    if tg_op = 'UPDATE' and (v_antes ->> 'activo') = 'true' and (v_despues ->> 'activo') = 'false' then
      v_desc := v_actor_nombre || ' desactivó el cliente ' || (v_despues ->> 'nombre');
    else
      v_desc := v_actor_nombre || ' ' ||
        case v_accion when 'crear' then 'creó' when 'eliminar' then 'eliminó' else 'editó' end
        || ' el cliente ' || coalesce((v_despues ->> 'nombre'), (v_antes ->> 'nombre'));
    end if;

  elsif tg_table_name = 'suplidores' then
    v_desc := v_actor_nombre || ' ' ||
      case v_accion when 'crear' then 'creó' when 'eliminar' then 'eliminó' else 'editó' end
      || ' el suplidor ' || coalesce((v_despues ->> 'nombre'), (v_antes ->> 'nombre'));

  elsif tg_table_name = 'catalogo_items' then
    if tg_op = 'UPDATE'
       and (v_antes ->> 'precio_sugerido') is distinct from (v_despues ->> 'precio_sugerido') then
      v_desc := v_actor_nombre || ' cambió el precio de ' || (v_despues ->> 'descripcion')
        || ' de ' || public.fmt_rd((v_antes ->> 'precio_sugerido')::numeric)
        || ' a ' || public.fmt_rd((v_despues ->> 'precio_sugerido')::numeric);
    else
      v_desc := v_actor_nombre || ' ' ||
        case v_accion when 'crear' then 'creó' when 'eliminar' then 'eliminó' else 'editó' end
        || ' el artículo ' || coalesce((v_despues ->> 'descripcion'), (v_antes ->> 'descripcion'));
    end if;

  elsif tg_table_name = 'compras' then
    v_monto := coalesce((v_despues ->> 'monto'), (v_antes ->> 'monto'))::numeric;
    v_desc := v_actor_nombre || ' ' ||
      case v_accion when 'crear' then 'registró' when 'eliminar' then 'eliminó' else 'editó' end
      || ' una compra de ' || public.fmt_rd(v_monto);

  elsif tg_table_name = 'gastos' then
    v_monto := coalesce((v_despues ->> 'monto'), (v_antes ->> 'monto'))::numeric;
    v_desc := v_actor_nombre || ' ' ||
      case v_accion when 'crear' then 'registró' when 'eliminar' then 'eliminó' else 'editó' end
      || ' el gasto ' || coalesce((v_despues ->> 'descripcion'), (v_antes ->> 'descripcion'))
      || ' (' || public.fmt_rd(v_monto) || ')';

  elsif tg_table_name = 'empresa_config' then
    v_desc := v_actor_nombre || ' actualizó la configuración de la empresa';

  else
    v_desc := v_actor_nombre || ' ' ||
      case v_accion when 'crear' then 'creó' when 'eliminar' then 'eliminó' else 'editó' end
      || ' un registro de ' || v_entidad;
  end if;

  insert into public.bitacora (
    owner_id, usuario_email, accion, entidad, entidad_id,
    descripcion, datos_antes, datos_despues, ip, user_agent)
  values (
    v_owner,
    (select email from public.profiles where id = v_actor),
    v_accion, v_entidad, v_entidad_id,
    v_desc, v_antes, v_despues, v_ip, v_ua);

  if tg_op = 'DELETE' then return old; else return new; end if;
end $$;

-- Re-crear los disparadores (incluye todas las entidades auditadas).
do $$
declare t text;
begin
  foreach t in array array[
    'clientes','suplidores','catalogo_items','cotizaciones','facturas',
    'compras','pagos','gastos','empresa_config'
  ] loop
    execute format('drop trigger if exists auditoria on public.%I', t);
    execute format(
      'create trigger auditoria after insert or update or delete on public.%I
         for each row execute function public.tg_auditoria()', t);
  end loop;
end $$;

-- ---------- 4) Registro de sesión ----------
-- Inicio / cierre / intento fallido. SECURITY DEFINER: la app la invoca por
-- RPC; nunca inserta directo en la tabla.
create or replace function public.fn_registrar_sesion(
  p_tipo text,        -- 'sesion_inicio' | 'sesion_cierre' | 'sesion_fallida'
  p_email text default null
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_email text;
  v_nombre text;
  v_ip text;
  v_ua text;
  v_desc text;
begin
  if p_tipo not in ('sesion_inicio','sesion_cierre','sesion_fallida') then
    return;
  end if;

  -- Determinar a quién se atribuye el evento.
  if v_uid is not null then
    v_owner := v_uid;
    select email, coalesce(nombre_completo, email) into v_email, v_nombre
      from public.profiles where id = v_uid;
  else
    select id, email, coalesce(nombre_completo, email) into v_owner, v_email, v_nombre
      from public.profiles where lower(email) = lower(coalesce(p_email, '')) limit 1;
  end if;

  -- Sin dueño identificable (correo desconocido en intento fallido) no se registra.
  if v_owner is null then return; end if;
  v_email := coalesce(v_email, p_email);
  v_nombre := coalesce(v_nombre, p_email, 'Usuario');

  begin
    v_ip := nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-forwarded-for';
    v_ua := nullif(current_setting('request.headers', true), '')::jsonb ->> 'user-agent';
  exception when others then
    v_ip := null; v_ua := null;
  end;

  v_desc := case p_tipo
    when 'sesion_inicio' then v_nombre || ' inició sesión'
    when 'sesion_cierre' then v_nombre || ' cerró sesión'
    else 'Intento fallido de inicio de sesión con el correo ' || coalesce(p_email, '—')
  end;

  insert into public.bitacora (
    owner_id, usuario_email, accion, entidad, entidad_id,
    descripcion, ip, user_agent)
  values (v_owner, v_email, p_tipo, 'sesion', null, v_desc, v_ip, v_ua);
end $$;

-- ---------- 5) Inviolabilidad a nivel de base de datos ----------
alter table public.bitacora enable row level security;
alter table public.bitacora force row level security;

-- Nadie (ni admin, ni service_role) puede modificar, borrar ni vaciar el historial.
revoke update, delete, truncate on public.bitacora from authenticated, anon, service_role;

-- Bloqueo explícito por RLS también (defensa en profundidad).
drop policy if exists bitacora_no_update on public.bitacora;
create policy bitacora_no_update on public.bitacora for update using (false) with check (false);
drop policy if exists bitacora_no_delete on public.bitacora;
create policy bitacora_no_delete on public.bitacora for delete using (false);

-- Lectura: cada quien ve su propio historial; el admin ve todo.
drop policy if exists bitacora_select on public.bitacora;
create policy bitacora_select on public.bitacora for select using (
  owner_id = (select auth.uid())
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  )
);

-- Permisos de ejecución.
grant execute on function public.fn_registrar_sesion(text, text) to authenticated, anon;
grant execute on function public.fmt_rd(numeric) to authenticated;
grant execute on function public.etiqueta_entidad(text) to authenticated;
revoke execute on function public.fmt_rd(numeric) from anon;
revoke execute on function public.etiqueta_entidad(text) from anon;
