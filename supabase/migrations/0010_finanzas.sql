-- ============================================================
--  JM FACTURACIÓN — Módulo Finanzas (Parte B)
--  0010 · Funciones de cálculo en el servidor (SECURITY DEFINER).
--  Todas filtran por auth.uid(), usan COALESCE y protegen las
--  divisiones con NULLIF. Distinción clave: FACTURADO ≠ COBRADO.
-- ============================================================

-- ---------- 1) FLUJO DEL MES ----------
-- ENTRÓ (cobros) → SALIÓ (mercancía + gastos) → QUEDÓ, con comparación
-- contra el periodo inmediatamente anterior de igual longitud.
create or replace function public.fin_flujo(p_desde date, p_hasta date)
returns json
language sql
security definer
set search_path = ''
stable
as $$
  with uid as (select auth.uid() as id),
  dur as (select (p_hasta - p_desde) as dias),
  prev as (
    select (p_desde - (select dias from dur))::date as pdesde, p_desde as phasta
  ),
  cobros as (
    select coalesce(sum(monto), 0) as v
    from public.pagos, uid
    where owner_id = uid.id and fecha >= p_desde and fecha < p_hasta
  ),
  cobros_prev as (
    select coalesce(sum(monto), 0) as v
    from public.pagos, uid, prev
    where owner_id = uid.id and fecha >= prev.pdesde and fecha < prev.phasta
  ),
  mercancia as (
    select coalesce(sum(monto), 0) as v
    from public.compras, uid
    where owner_id = uid.id and fecha >= p_desde and fecha < p_hasta
  ),
  mercancia_prev as (
    select coalesce(sum(monto), 0) as v
    from public.compras, uid, prev
    where owner_id = uid.id and fecha >= prev.pdesde and fecha < prev.phasta
  ),
  gastos_t as (
    select coalesce(sum(monto), 0) as v
    from public.gastos, uid
    where owner_id = uid.id and fecha >= p_desde and fecha < p_hasta
  ),
  gastos_prev as (
    select coalesce(sum(monto), 0) as v
    from public.gastos, uid, prev
    where owner_id = uid.id and fecha >= prev.pdesde and fecha < prev.phasta
  ),
  facturado as (
    select coalesce(sum(total), 0) as v
    from public.facturas, uid
    where owner_id = uid.id and estado <> 'anulada'
      and fecha >= p_desde and fecha < p_hasta
  )
  select json_build_object(
    'entro', (select v from cobros),
    'salio_mercancia', (select v from mercancia),
    'salio_gastos', (select v from gastos_t),
    'salio', (select v from mercancia) + (select v from gastos_t),
    'quedo', (select v from cobros) - (select v from mercancia) - (select v from gastos_t),
    'facturado', (select v from facturado),
    'prev', json_build_object(
      'entro', (select v from cobros_prev),
      'salio_mercancia', (select v from mercancia_prev),
      'salio_gastos', (select v from gastos_prev),
      'salio', (select v from mercancia_prev) + (select v from gastos_prev),
      'quedo', (select v from cobros_prev) - (select v from mercancia_prev) - (select v from gastos_prev)
    )
  );
$$;

-- ---------- 2) LIBRO DE MOVIMIENTOS ----------
-- Un solo listado cronológico (cobros + compras + gastos) con saldo
-- acumulado calculado en el servidor sobre TODO el conjunto filtrado.
-- Paginación por p_limit/p_offset. p_tipo: 'todos'|'cobro'|'compra'|'gasto'.
create or replace function public.fin_libro(
  p_desde date,
  p_hasta date,
  p_tipo text default 'todos',
  p_busqueda text default '',
  p_limit int default 50,
  p_offset int default 0
)
returns json
language sql
security definer
set search_path = ''
stable
as $$
  with uid as (select auth.uid() as id),
  movs as (
    -- Cobros (entradas)
    select p.fecha, p.created_at, 'cobro'::text as tipo,
           coalesce(f.numero, 'Cobro') as referencia,
           coalesce('Cobro factura ' || f.numero, 'Cobro') as descripcion,
           p.monto as entrada, 0::numeric as salida,
           p.metodo_pago::text as metodo, f.id::text as doc_id, 'factura'::text as doc_tipo
    from public.pagos p
    join uid on p.owner_id = uid.id
    left join public.facturas f on f.id = p.factura_id
    where p.fecha >= p_desde and p.fecha < p_hasta
      and (p_tipo = 'todos' or p_tipo = 'cobro')
    union all
    -- Compras de mercancía (salidas)
    select c.fecha, c.created_at, 'compra'::text,
           coalesce(s.nombre, 'Compra'),
           coalesce(c.descripcion, 'Compra de mercancía'),
           0::numeric, c.monto,
           c.metodo_pago::text, c.id::text, 'compra'::text
    from public.compras c
    join uid on c.owner_id = uid.id
    left join public.suplidores s on s.id = c.suplidor_id
    where c.fecha >= p_desde and c.fecha < p_hasta
      and (p_tipo = 'todos' or p_tipo = 'compra')
    union all
    -- Gastos operativos (salidas)
    select g.fecha, g.created_at, 'gasto'::text,
           coalesce(cat.nombre, 'Gasto'),
           g.descripcion,
           0::numeric, g.monto,
           g.metodo_pago::text, g.id::text, 'gasto'::text
    from public.gastos g
    join uid on g.owner_id = uid.id
    left join public.categorias_gasto cat on cat.id = g.categoria_id
    where g.fecha >= p_desde and g.fecha < p_hasta
      and (p_tipo = 'todos' or p_tipo = 'gasto')
  ),
  filtrados as (
    select * from movs
    where p_busqueda = '' or descripcion ilike '%' || p_busqueda || '%'
       or referencia ilike '%' || p_busqueda || '%'
  ),
  ordenados as (
    select *,
           sum(entrada - salida) over (
             order by fecha asc, created_at asc
             rows between unbounded preceding and current row
           ) as saldo_acumulado,
           row_number() over (order by fecha desc, created_at desc) as rn
    from filtrados
  ),
  pagina as (
    select * from ordenados
    order by fecha desc, created_at desc
    limit greatest(p_limit, 1) offset greatest(p_offset, 0)
  )
  select json_build_object(
    'total_count', (select count(*) from filtrados),
    'total_entradas', (select coalesce(sum(entrada), 0) from filtrados),
    'total_salidas', (select coalesce(sum(salida), 0) from filtrados),
    'saldo_neto', (select coalesce(sum(entrada - salida), 0) from filtrados),
    'rows', coalesce((
      select json_agg(json_build_object(
        'fecha', fecha,
        'tipo', tipo,
        'referencia', referencia,
        'descripcion', descripcion,
        'entrada', entrada,
        'salida', salida,
        'metodo', metodo,
        'saldo', saldo_acumulado,
        'doc_id', doc_id,
        'doc_tipo', doc_tipo
      ) order by fecha desc, created_at desc)
      from pagina
    ), '[]'::json)
  );
$$;

-- ---------- 3) ESTADO DE RESULTADOS ----------
-- Facturado, costo de mercancía, utilidad bruta, gastos, utilidad neta,
-- márgenes con protección de división y comparación de periodo anterior.
create or replace function public.fin_estado_resultados(p_desde date, p_hasta date)
returns json
language sql
security definer
set search_path = ''
stable
as $$
  with uid as (select auth.uid() as id),
  dur as (select (p_hasta - p_desde) as dias),
  prev as (select (p_desde - (select dias from dur))::date as pdesde, p_desde as phasta),
  fact as (
    select coalesce(sum(total), 0) as facturado,
           coalesce(sum(costo_total), 0) as costo,
           coalesce(sum(monto_cobrado), 0) as cobrado
    from public.facturas, uid
    where owner_id = uid.id and estado <> 'anulada'
      and fecha >= p_desde and fecha < p_hasta
  ),
  fact_prev as (
    select coalesce(sum(total), 0) as facturado,
           coalesce(sum(costo_total), 0) as costo
    from public.facturas, uid, prev
    where owner_id = uid.id and estado <> 'anulada'
      and fecha >= prev.pdesde and fecha < prev.phasta
  ),
  gas as (
    select coalesce(sum(monto), 0) as v
    from public.gastos, uid
    where owner_id = uid.id and fecha >= p_desde and fecha < p_hasta
  ),
  gas_prev as (
    select coalesce(sum(monto), 0) as v
    from public.gastos, uid, prev
    where owner_id = uid.id and fecha >= prev.pdesde and fecha < prev.phasta
  ),
  cat_gastos as (
    select coalesce(cat.nombre, 'Sin categoría') as nombre, coalesce(sum(g.monto), 0) as total
    from public.gastos g
    join uid on g.owner_id = uid.id
    left join public.categorias_gasto cat on cat.id = g.categoria_id
    where g.fecha >= p_desde and g.fecha < p_hasta
    group by 1 order by 2 desc
  )
  select json_build_object(
    'facturado', (select facturado from fact),
    'cobrado', (select cobrado from fact),
    'costo_mercancia', (select costo from fact),
    'utilidad_bruta', (select facturado - costo from fact),
    'margen_bruto_pct', round(
      100 * (select facturado - costo from fact) / nullif((select facturado from fact), 0), 2),
    'gastos', (select v from gas),
    'utilidad_neta', (select facturado - costo from fact) - (select v from gas),
    'margen_neto_pct', round(
      100 * ((select facturado - costo from fact) - (select v from gas))
        / nullif((select facturado from fact), 0), 2),
    'gastos_categoria', coalesce((select json_agg(json_build_object('nombre', nombre, 'total', total)) from cat_gastos), '[]'::json),
    'prev', json_build_object(
      'facturado', (select facturado from fact_prev),
      'utilidad_neta', (select facturado - costo from fact_prev) - (select v from gas_prev)
    )
  );
$$;

-- ---------- 4) PROYECCIÓN DE CAJA ----------
-- Izquierda: LO QUE ME DEBEN (aging de saldos). Derecha: LO QUE TENGO QUE
-- PAGAR (gastos recurrentes estimados del mes). Abajo: EL VEREDICTO.
create or replace function public.fin_proyeccion()
returns json
language sql
security definer
set search_path = ''
stable
as $$
  with uid as (select auth.uid() as id),
  ctes as (
    select f.saldo,
           coalesce(cl.nombre, 'Sin cliente') as cliente,
           (current_date - coalesce(f.fecha_vencimiento, f.fecha)) as dias_vencido
    from public.facturas f
    join uid on f.owner_id = uid.id
    left join public.clientes cl on cl.id = f.cliente_id
    where f.estado <> 'anulada' and f.saldo > 0
  ),
  aging as (
    select
      coalesce(sum(saldo) filter (where dias_vencido <= 0), 0) as por_vencer,
      coalesce(sum(saldo) filter (where dias_vencido between 1 and 30), 0) as d1_30,
      coalesce(sum(saldo) filter (where dias_vencido between 31 and 60), 0) as d31_60,
      coalesce(sum(saldo) filter (where dias_vencido > 60), 0) as d60_mas,
      coalesce(sum(saldo), 0) as total
    from ctes
  ),
  top_deudores as (
    select cliente, coalesce(sum(saldo), 0) as saldo,
           max(dias_vencido) as dias
    from ctes group by cliente order by 2 desc limit 8
  ),
  recurrentes as (
    -- Última ocurrencia de cada gasto recurrente (estimación del mes).
    select distinct on (lower(trim(descripcion))) descripcion, monto
    from public.gastos g
    join uid on g.owner_id = uid.id
    where g.es_recurrente = true
    order by lower(trim(descripcion)), fecha desc
  ),
  por_pagar as (select coalesce(sum(monto), 0) as v from recurrentes)
  select json_build_object(
    'me_deben', (select total from aging),
    'aging', (select json_build_object(
        'por_vencer', por_vencer, 'd1_30', d1_30, 'd31_60', d31_60, 'd60_mas', d60_mas
      ) from aging),
    'top_deudores', coalesce((select json_agg(json_build_object(
        'cliente', cliente, 'saldo', saldo, 'dias', dias)) from top_deudores), '[]'::json),
    'tengo_que_pagar', (select v from por_pagar),
    'recurrentes', coalesce((select json_agg(json_build_object(
        'descripcion', descripcion, 'monto', monto)) from recurrentes), '[]'::json),
    'veredicto', (select total from aging) - (select v from por_pagar)
  );
$$;

-- ---------- 5) RENTABILIDAD ----------
-- Ranking de clientes por UTILIDAD, de productos por margen, alerta de
-- facturas sin costo y evolución del margen en 6 meses.
create or replace function public.fin_rentabilidad(p_desde date, p_hasta date)
returns json
language sql
security definer
set search_path = ''
stable
as $$
  with uid as (select auth.uid() as id),
  clientes_rk as (
    select coalesce(cl.nombre, 'Sin cliente') as cliente,
           coalesce(sum(f.total), 0) as facturado,
           coalesce(sum(f.utilidad), 0) as utilidad
    from public.facturas f
    join uid on f.owner_id = uid.id
    left join public.clientes cl on cl.id = f.cliente_id
    where f.estado <> 'anulada' and f.fecha >= p_desde and f.fecha < p_hasta
    group by 1 order by 3 desc limit 10
  ),
  productos_rk as (
    select fl.descripcion,
           coalesce(sum(fl.subtotal_linea), 0) as venta,
           coalesce(sum(fl.utilidad_linea), 0) as utilidad,
           round(100 * coalesce(sum(fl.utilidad_linea), 0)
             / nullif(coalesce(sum(fl.subtotal_linea), 0), 0), 2) as margen_pct
    from public.factura_lineas fl
    join uid on fl.owner_id = uid.id
    join public.facturas f on f.id = fl.factura_id
    where f.estado <> 'anulada' and f.fecha >= p_desde and f.fecha < p_hasta
    group by 1 order by 3 desc limit 10
  ),
  sin_costo as (
    select f.numero, f.total, f.fecha
    from public.facturas f
    join uid on f.owner_id = uid.id
    where f.estado <> 'anulada' and f.fecha >= p_desde and f.fecha < p_hasta
      and coalesce(f.costo_total, 0) = 0 and f.total > 0
    order by f.fecha desc limit 20
  ),
  evolucion as (
    select to_char(date_trunc('month', f.fecha), 'YYYY-MM') as mes,
           round(100 * coalesce(sum(f.utilidad), 0)
             / nullif(coalesce(sum(f.total), 0), 0), 2) as margen_pct
    from public.facturas f
    join uid on f.owner_id = uid.id
    where f.estado <> 'anulada'
      and f.fecha >= (date_trunc('month', current_date) - interval '5 month')::date
    group by 1 order by 1
  )
  select json_build_object(
    'clientes', coalesce((select json_agg(json_build_object(
        'cliente', cliente, 'facturado', facturado, 'utilidad', utilidad)) from clientes_rk), '[]'::json),
    'productos', coalesce((select json_agg(json_build_object(
        'descripcion', descripcion, 'venta', venta, 'utilidad', utilidad, 'margen_pct', coalesce(margen_pct, 0))) from productos_rk), '[]'::json),
    'sin_costo', coalesce((select json_agg(json_build_object(
        'numero', numero, 'total', total, 'fecha', fecha)) from sin_costo), '[]'::json),
    'evolucion', coalesce((select json_agg(json_build_object(
        'mes', mes, 'margen_pct', coalesce(margen_pct, 0))) from evolucion), '[]'::json)
  );
$$;

-- Permisos: solo usuarios autenticados; cada función ya filtra por auth.uid().
grant execute on function public.fin_flujo(date, date) to authenticated;
grant execute on function public.fin_libro(date, date, text, text, int, int) to authenticated;
grant execute on function public.fin_estado_resultados(date, date) to authenticated;
grant execute on function public.fin_proyeccion() to authenticated;
grant execute on function public.fin_rentabilidad(date, date) to authenticated;

revoke execute on function public.fin_flujo(date, date) from anon;
revoke execute on function public.fin_libro(date, date, text, text, int, int) from anon;
revoke execute on function public.fin_estado_resultados(date, date) from anon;
revoke execute on function public.fin_proyeccion() from anon;
revoke execute on function public.fin_rentabilidad(date, date) from anon;
