-- ============================================================
--  JM FACTURACIÓN — Datos semilla históricos (6 meses)
--  0009 · Facturas, cobros, compras y gastos de los últimos 6
--  meses, con un mes de utilidad NETA negativa (para ver cómo
--  el sistema lo muestra). Idempotente.
-- ============================================================

do $$
declare
  target uuid;
  v_cli uuid[];
  v_sup uuid[];
  v_gasto_cat uuid;
  m int;
  i int;
  n int := 0;
  f_id uuid;
  v_fecha date;
  v_venc date;
  v_precio numeric(14,2);
  v_costo numeric(14,2);
  v_cant numeric(12,2);
  cli uuid;
  sup uuid;
begin
  select id into target from auth.users order by created_at asc limit 1;
  select array_agg(id) into v_cli from public.clientes where owner_id = target;
  select array_agg(id) into v_sup from public.suplidores where owner_id = target;
  select id into v_gasto_cat from public.categorias_gasto where owner_id = target limit 1;

  if target is null or v_cli is null or array_length(v_cli, 1) is null then
    return;
  end if;

  -- No duplicar si ya se corrió.
  if exists (select 1 from public.facturas where owner_id = target and numero like 'FAC-2026-01%') then
    return;
  end if;

  for m in 1..6 loop
    v_fecha := (date_trunc('month', current_date) - (m || ' month')::interval)::date + 5;
    v_venc := v_fecha + 30;

    for i in 1..2 loop
      n := n + 1;
      cli := v_cli[1 + (n % array_length(v_cli, 1))];
      sup := coalesce(v_sup[1 + (n % greatest(array_length(v_sup, 1), 1))], null);
      v_cant := 1 + (n % 3);
      v_precio := 15000 + (n % 5) * 8000;
      -- El mes 3 tiene margen muy bajo (costo alto).
      v_costo := case when m = 3 then round(v_precio * 0.92, 2) else round(v_precio * 0.68, 2) end;

      insert into public.facturas (owner_id, numero, cliente_id, fecha, fecha_vencimiento, estado, itbis_activo)
      values (target, 'FAC-2026-' || lpad((100 + n)::text, 4, '0'), cli, v_fecha, v_venc, 'emitida', true)
      returning id into f_id;

      insert into public.factura_lineas (owner_id, factura_id, suplidor_id, descripcion, cantidad, precio_unitario, costo_unitario, itbis_aplicable, orden)
      values (target, f_id, sup, 'Venta de mercancía bajo pedido', v_cant, v_precio, v_costo, true, 1);

      insert into public.compras (owner_id, factura_id, suplidor_id, descripcion, monto, fecha, metodo_pago)
      values (target, f_id, sup, 'Compra para el pedido', round(v_costo * v_cant, 2), v_fecha - 1, 'transferencia');

      -- Cobros: meses viejos pagados completos; recientes parciales/pendientes.
      if m >= 3 then
        insert into public.pagos (owner_id, factura_id, monto, fecha, metodo_pago)
        values (target, f_id, round(v_precio * v_cant * 1.18, 2), v_fecha + 7, 'transferencia');
      elsif i = 1 then
        insert into public.pagos (owner_id, factura_id, monto, fecha, metodo_pago)
        values (target, f_id, round(v_precio * v_cant * 1.18 * 0.5, 2), v_fecha + 3, 'transferencia');
      end if;
    end loop;

    -- Gastos operativos del mes.
    insert into public.gastos (owner_id, categoria_id, descripcion, monto, fecha, metodo_pago, es_recurrente) values
      (target, v_gasto_cat, 'Alquiler del local', 35000, v_fecha, 'transferencia', true),
      (target, v_gasto_cat, 'Combustible y transporte', 6000 + (m * 400), v_fecha + 2, 'efectivo', false);

    -- Mes 3: gasto grande extra → utilidad neta negativa.
    if m = 3 then
      insert into public.gastos (owner_id, categoria_id, descripcion, monto, fecha, metodo_pago, es_recurrente)
      values (target, v_gasto_cat, 'Reparación mayor de equipo', 85000, v_fecha + 4, 'tarjeta', false);
    end if;
  end loop;
end $$;
