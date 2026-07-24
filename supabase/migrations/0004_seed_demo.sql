-- ============================================================
--  JM FACTURACIÓN — Tanda 3
--  0004 · Datos semilla dominicanos (función)
-- ------------------------------------------------------------
--  public.seed_demo_data(target uuid) llena la cuenta indicada con
--  datos realistas para que el demo se vea vivo. Idempotente: si la
--  cuenta ya tiene clientes, no hace nada.
--
--  Fija request.jwt.claims.sub = target para que las políticas RLS
--  (owner_id = auth.uid()) acepten las inserciones bajo FORCE, sin
--  depender de BYPASSRLS.
-- ============================================================

create or replace function public.seed_demo_data(target uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_anio integer := extract(year from current_date)::int;
  -- suplidores
  s_plaza uuid; s_jumbo uuid; s_sirena uuid; s_ochoa uuid;
  -- clientes
  c_almonte uuid; c_rosa uuid; c_colmado uuid; c_este uuid;
  -- catálogo
  k_tv uuid; k_aire uuid; k_nevera uuid; k_inst uuid; k_cable uuid; k_estufa uuid;
  -- categorías de gasto
  g_comb uuid; g_alq uuid; g_transp uuid; g_pub uuid;
  -- documentos
  f1 uuid; f2 uuid; f3 uuid; ct1 uuid; ct2 uuid;
begin
  if target is null then
    raise exception 'target no puede ser null';
  end if;

  -- Evita duplicar si ya se sembró.
  if exists (select 1 from public.clientes where owner_id = target) then
    return;
  end if;

  -- Habilita que auth.uid() = target para pasar las políticas RLS.
  perform set_config('request.jwt.claims', json_build_object('sub', target::text)::text, true);

  -- ---------- Datos de la empresa ----------
  update public.empresa_config set
    nombre = 'Suministros del Caribe, SRL',
    rnc = '1-31-45678-9',
    direccion = 'Av. 27 de Febrero #145, Santo Domingo, D.N.',
    telefono = '(809) 555-0142',
    email = 'ventas@suministrosdelcaribe.do',
    terminos_cotizacion = 'Cotización válida por 15 días. Precios sujetos a disponibilidad. Los productos se entregan una vez confirmado el pago.',
    terminos_factura = 'Gracias por su compra. Pago a la entrega salvo acuerdo previo. Los reclamos se reciben dentro de los 3 días siguientes a la entrega.',
    cuentas_bancarias = '[{"banco":"Banco Popular","tipo":"Cuenta Corriente","numero":"799-12345-6","titular":"Suministros del Caribe, SRL"},{"banco":"Banreservas","tipo":"Cuenta de Ahorros","numero":"960-987654-3","titular":"Suministros del Caribe, SRL"}]'::jsonb
  where owner_id = target;

  -- ---------- Suplidores ----------
  insert into public.suplidores (owner_id, nombre, contacto, telefono, notas) values
    (target, 'Plaza Lama', 'Depto. Empresarial', '(809) 508-1111', 'Electrodomésticos y línea blanca.'),
    (target, 'Jumbo', 'Ventas Corporativas', '(809) 544-2222', 'Variado, buenos precios por volumen.'),
    (target, 'Multicentro La Sirena', 'Caja Empresarial', '(809) 200-3333', 'Hogar y ferretería ligera.'),
    (target, 'Ferretería Ochoa', 'Mostrador', '(809) 565-4444', 'Materiales eléctricos y de construcción.');
  select id into s_plaza from public.suplidores where owner_id = target and nombre = 'Plaza Lama';
  select id into s_jumbo from public.suplidores where owner_id = target and nombre = 'Jumbo';
  select id into s_sirena from public.suplidores where owner_id = target and nombre = 'Multicentro La Sirena';
  select id into s_ochoa from public.suplidores where owner_id = target and nombre = 'Ferretería Ochoa';

  -- ---------- Clientes ----------
  insert into public.clientes (owner_id, nombre, tipo, rnc_cedula, telefono, email, direccion, limite_credito, notas) values
    (target, 'Ferretería Almonte, SRL', 'empresa', '1-30-11223-4', '(809) 555-7788', 'compras@ferreteriaalmonte.do', 'Los Alcarrizos, Santo Domingo Oeste', 150000, 'Cliente frecuente, paga puntual.'),
    (target, 'Rosa Elena Peña', 'persona', '001-1234567-8', '(829) 444-1200', 'rosa.pena@gmail.com', 'Gazcue, Santo Domingo, D.N.', 0, 'Compras para el hogar.'),
    (target, 'Colmado La Bendición', 'empresa', '1-31-99887-6', '(809) 333-9090', NULL, 'Villa Mella, Santo Domingo Norte', 50000, 'Pide a crédito ocasionalmente.'),
    (target, 'Constructora del Este, SRL', 'empresa', '1-30-55667-1', '(809) 222-6161', 'admin@constructoradeleste.do', 'San Pedro de Macorís', 300000, 'Proyectos grandes, requiere factura con detalle.');
  select id into c_almonte from public.clientes where owner_id = target and nombre = 'Ferretería Almonte, SRL';
  select id into c_rosa from public.clientes where owner_id = target and nombre = 'Rosa Elena Peña';
  select id into c_colmado from public.clientes where owner_id = target and nombre = 'Colmado La Bendición';
  select id into c_este from public.clientes where owner_id = target and nombre = 'Constructora del Este, SRL';

  -- ---------- Catálogo ----------
  insert into public.catalogo_items (owner_id, descripcion, tipo, precio_sugerido, costo_referencial, unidad) values
    (target, 'Smart TV Samsung 55" 4K', 'producto', 42000, 33500, 'unidad'),
    (target, 'Aire Acondicionado Inverter 12,000 BTU', 'producto', 28500, 22000, 'unidad'),
    (target, 'Nevera Whirlpool 18 pies', 'producto', 46000, 37000, 'unidad'),
    (target, 'Instalación eléctrica — mano de obra', 'servicio', 8500, 3000, 'servicio'),
    (target, 'Cable eléctrico #12 (rollo 100m)', 'producto', 4200, 2800, 'rollo'),
    (target, 'Estufa de gas 4 hornillas', 'producto', 19500, 14500, 'unidad');
  select id into k_tv from public.catalogo_items where owner_id = target and descripcion = 'Smart TV Samsung 55" 4K';
  select id into k_aire from public.catalogo_items where owner_id = target and descripcion = 'Aire Acondicionado Inverter 12,000 BTU';
  select id into k_nevera from public.catalogo_items where owner_id = target and descripcion = 'Nevera Whirlpool 18 pies';
  select id into k_inst from public.catalogo_items where owner_id = target and descripcion = 'Instalación eléctrica — mano de obra';
  select id into k_cable from public.catalogo_items where owner_id = target and descripcion = 'Cable eléctrico #12 (rollo 100m)';
  select id into k_estufa from public.catalogo_items where owner_id = target and descripcion = 'Estufa de gas 4 hornillas';

  -- categorías (creadas por handle_new_user)
  select id into g_comb from public.categorias_gasto where owner_id = target and nombre = 'Combustible';
  select id into g_alq from public.categorias_gasto where owner_id = target and nombre = 'Alquiler';
  select id into g_transp from public.categorias_gasto where owner_id = target and nombre = 'Transporte';
  select id into g_pub from public.categorias_gasto where owner_id = target and nombre = 'Publicidad';

  -- ---------- Factura 1: cobrada (Ferretería Almonte) ----------
  insert into public.facturas (owner_id, numero, cliente_id, fecha, fecha_vencimiento, estado, itbis_activo)
  values (target, 'FAC-' || v_anio || '-0001', c_almonte, current_date - 20, current_date - 5, 'emitida', true)
  returning id into f1;
  insert into public.factura_lineas (owner_id, factura_id, catalogo_item_id, suplidor_id, descripcion, cantidad, precio_unitario, costo_unitario, itbis_aplicable, orden) values
    (target, f1, k_tv, s_plaza, 'Smart TV Samsung 55" 4K', 2, 42000, 33500, true, 1),
    (target, f1, k_aire, s_plaza, 'Aire Acondicionado Inverter 12,000 BTU', 1, 28500, 22000, true, 2);
  insert into public.compras (owner_id, factura_id, suplidor_id, descripcion, monto, fecha, metodo_pago, numero_comprobante)
  values (target, f1, s_plaza, 'Compra TV y aire para pedido Almonte', 89000, current_date - 19, 'transferencia', 'B1500001234');
  insert into public.pagos (owner_id, factura_id, monto, fecha, metodo_pago, referencia)
  values (target, f1, 130980, current_date - 4, 'transferencia', 'TRF-889001');

  -- ---------- Factura 2: cobrada parcial (Constructora del Este) ----------
  insert into public.facturas (owner_id, numero, cliente_id, fecha, fecha_vencimiento, estado, itbis_activo)
  values (target, 'FAC-' || v_anio || '-0002', c_este, current_date - 10, current_date + 5, 'emitida', true)
  returning id into f2;
  insert into public.factura_lineas (owner_id, factura_id, catalogo_item_id, suplidor_id, descripcion, cantidad, precio_unitario, costo_unitario, itbis_aplicable, orden) values
    (target, f2, k_cable, s_ochoa, 'Cable eléctrico #12 (rollo 100m)', 10, 4200, 2800, true, 1),
    (target, f2, k_inst, NULL, 'Instalación eléctrica — mano de obra', 1, 8500, 3000, false, 2);
  insert into public.compras (owner_id, factura_id, suplidor_id, descripcion, monto, fecha, metodo_pago, numero_comprobante)
  values (target, f2, s_ochoa, 'Cables para obra Constructora del Este', 28000, current_date - 9, 'efectivo', 'B1500005678');
  insert into public.pagos (owner_id, factura_id, monto, fecha, metodo_pago, referencia)
  values (target, f2, 25000, current_date - 8, 'transferencia', 'TRF-889145');

  -- ---------- Factura 3: sin ITBIS, pendiente (Rosa Elena) ----------
  insert into public.facturas (owner_id, numero, cliente_id, fecha, fecha_vencimiento, estado, itbis_activo)
  values (target, 'FAC-' || v_anio || '-0003', c_rosa, current_date - 3, current_date + 12, 'emitida', false)
  returning id into f3;
  insert into public.factura_lineas (owner_id, factura_id, catalogo_item_id, suplidor_id, descripcion, cantidad, precio_unitario, costo_unitario, itbis_aplicable, orden) values
    (target, f3, k_estufa, s_sirena, 'Estufa de gas 4 hornillas', 1, 19500, 14500, false, 1);
  -- (Sin compra registrada: alimenta la alerta "factura sin costo" en su módulo.)

  -- ---------- Cotización 1: enviada (Colmado La Bendición) ----------
  insert into public.cotizaciones (owner_id, numero, cliente_id, fecha, validez_dias, estado, itbis_activo, notas)
  values (target, 'COT-' || v_anio || '-0001', c_colmado, current_date - 2, 15, 'enviada', true, 'Pendiente de aprobación del cliente.')
  returning id into ct1;
  insert into public.cotizacion_lineas (owner_id, cotizacion_id, catalogo_item_id, descripcion, cantidad, precio_unitario, itbis_aplicable, orden) values
    (target, ct1, k_nevera, 'Nevera Whirlpool 18 pies', 1, 46000, true, 1),
    (target, ct1, k_estufa, 'Estufa de gas 4 hornillas', 1, 19500, true, 2);

  -- ---------- Cotización 2: aprobada (Constructora del Este) ----------
  insert into public.cotizaciones (owner_id, numero, cliente_id, fecha, validez_dias, estado, itbis_activo, notas)
  values (target, 'COT-' || v_anio || '-0002', c_este, current_date - 6, 15, 'aprobada', true, 'Aprobada por el cliente, lista para facturar.')
  returning id into ct2;
  insert into public.cotizacion_lineas (owner_id, cotizacion_id, catalogo_item_id, descripcion, cantidad, precio_unitario, itbis_aplicable, orden) values
    (target, ct2, k_tv, 'Smart TV Samsung 55" 4K', 3, 42000, true, 1);

  -- ---------- Gastos operativos ----------
  insert into public.gastos (owner_id, categoria_id, descripcion, monto, fecha, metodo_pago, es_recurrente) values
    (target, g_alq, 'Alquiler del local — mes actual', 35000, date_trunc('month', current_date)::date + 1, 'transferencia', true),
    (target, g_comb, 'Combustible camioneta de entregas', 4800, current_date - 7, 'efectivo', false),
    (target, g_transp, 'Flete de entrega a San Pedro', 6500, current_date - 5, 'efectivo', false),
    (target, g_pub, 'Publicidad en redes sociales', 3200, current_date - 12, 'tarjeta', false);

  -- ---------- Alinea la numeración para que continúe tras el semillero ----------
  insert into public.documento_secuencias (owner_id, tipo, anio, ultimo_numero)
  values (target, 'factura', v_anio, 3)
  on conflict (owner_id, tipo, anio) do update set ultimo_numero = greatest(public.documento_secuencias.ultimo_numero, 3);
  insert into public.documento_secuencias (owner_id, tipo, anio, ultimo_numero)
  values (target, 'cotizacion', v_anio, 2)
  on conflict (owner_id, tipo, anio) do update set ultimo_numero = greatest(public.documento_secuencias.ultimo_numero, 2);
end $$;

revoke all on function public.seed_demo_data(uuid) from public, anon, authenticated;
