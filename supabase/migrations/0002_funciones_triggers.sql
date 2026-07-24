-- ============================================================
--  JM FACTURACIÓN — Tanda 3
--  0002 · Funciones y triggers
-- ------------------------------------------------------------
--  Toda función lleva SET search_path = '' y referencia objetos
--  totalmente calificados (Estándar Fort Knox #9, evita el aviso
--  "function_search_path_mutable" del Security Advisor).
-- ============================================================

-- ---------- updated_at automático ----------
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','empresa_config','clientes','suplidores','catalogo_items',
    'categorias_gasto','documento_secuencias','cotizaciones','facturas',
    'cotizacion_lineas','factura_lineas','compras','pagos','gastos'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.tg_set_updated_at()', t);
  end loop;
end $$;

-- ---------- Numeración interna con bloqueo (SECURITY DEFINER) ----------
create or replace function public.siguiente_numero_documento(p_tipo public.tipo_documento)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := auth.uid();
  v_anio integer := extract(year from current_date)::int;
  v_prefijo text;
  v_inicial integer;
  v_numero integer;
begin
  if v_owner is null then
    raise exception 'No autenticado';
  end if;

  select
    case when p_tipo = 'cotizacion' then coalesce(prefijo_cotizacion, 'COT')
         else coalesce(prefijo_factura, 'FAC') end,
    case when p_tipo = 'cotizacion' then coalesce(numero_inicial_cotizacion, 1)
         else coalesce(numero_inicial_factura, 1) end
  into v_prefijo, v_inicial
  from public.empresa_config
  where owner_id = v_owner;

  if v_prefijo is null then
    v_prefijo := case when p_tipo = 'cotizacion' then 'COT' else 'FAC' end;
    v_inicial := 1;
  end if;

  -- Crea la secuencia del año si no existe, arrancando en (inicial - 1).
  insert into public.documento_secuencias (owner_id, tipo, anio, ultimo_numero)
  values (v_owner, p_tipo, v_anio, greatest(v_inicial - 1, 0))
  on conflict (owner_id, tipo, anio) do nothing;

  -- UPDATE ... RETURNING toma un lock de fila: seguro ante concurrencia.
  update public.documento_secuencias
     set ultimo_numero = ultimo_numero + 1,
         updated_at = now()
   where owner_id = v_owner and tipo = p_tipo and anio = v_anio
  returning ultimo_numero into v_numero;

  return v_prefijo || '-' || v_anio::text || '-' || lpad(v_numero::text, 4, '0');
end $$;

revoke all on function public.siguiente_numero_documento(public.tipo_documento) from public, anon;
grant execute on function public.siguiente_numero_documento(public.tipo_documento) to authenticated;

-- ---------- Cálculo por línea (BEFORE) ----------
create or replace function public.tg_cotizacion_linea_calc()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.subtotal_linea = round(coalesce(new.cantidad,0) * coalesce(new.precio_unitario,0), 2);
  return new;
end $$;

create or replace function public.tg_factura_linea_calc()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.subtotal_linea = round(coalesce(new.cantidad,0) * coalesce(new.precio_unitario,0), 2);
  new.utilidad_linea = round(
    (coalesce(new.precio_unitario,0) - coalesce(new.costo_unitario,0)) * coalesce(new.cantidad,0), 2);
  return new;
end $$;

drop trigger if exists calc_linea on public.cotizacion_lineas;
create trigger calc_linea before insert or update on public.cotizacion_lineas
  for each row execute function public.tg_cotizacion_linea_calc();

drop trigger if exists calc_linea on public.factura_lineas;
create trigger calc_linea before insert or update on public.factura_lineas
  for each row execute function public.tg_factura_linea_calc();

-- ---------- Recalcular totales de la COTIZACIÓN (BEFORE en el padre) ----------
create or replace function public.tg_cotizacion_recalc()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_sub numeric(14,2);
  v_base_itbis numeric(14,2);
begin
  select
    coalesce(sum(subtotal_linea), 0),
    coalesce(sum(case when itbis_aplicable then subtotal_linea else 0 end), 0)
  into v_sub, v_base_itbis
  from public.cotizacion_lineas
  where cotizacion_id = new.id;

  new.subtotal = v_sub;
  new.itbis = case when new.itbis_activo
                   then round(v_base_itbis * coalesce(new.itbis_tasa,0) / 100.0, 2)
                   else 0 end;
  new.total = new.subtotal + new.itbis;

  -- Vencimiento calculado.
  if new.fecha is not null then
    new.fecha_validez = new.fecha + (coalesce(new.validez_dias,0) || ' days')::interval;
  end if;

  return new;
end $$;

drop trigger if exists recalc on public.cotizaciones;
create trigger recalc before insert or update on public.cotizaciones
  for each row execute function public.tg_cotizacion_recalc();

-- ---------- Recalcular totales de la FACTURA (BEFORE en el padre) ----------
create or replace function public.tg_factura_recalc()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_sub numeric(14,2);
  v_base_itbis numeric(14,2);
  v_costo numeric(14,2);
  v_cobrado numeric(14,2);
  v_base numeric(14,2);
begin
  select
    coalesce(sum(subtotal_linea), 0),
    coalesce(sum(case when itbis_aplicable then subtotal_linea else 0 end), 0),
    coalesce(sum(round(coalesce(costo_unitario,0) * coalesce(cantidad,0), 2)), 0)
  into v_sub, v_base_itbis, v_costo
  from public.factura_lineas
  where factura_id = new.id;

  select coalesce(sum(monto), 0) into v_cobrado
  from public.pagos where factura_id = new.id;

  new.subtotal = v_sub;
  new.costo_total = v_costo;
  new.itbis = case when new.itbis_activo
                   then round(v_base_itbis * coalesce(new.itbis_tasa,0) / 100.0, 2)
                   else 0 end;

  v_base = new.subtotal - coalesce(new.descuento, 0);
  new.total = round(v_base + new.itbis, 2);
  new.utilidad = round(v_base - v_costo, 2);
  new.margen_pct = case when v_base > 0 then round(new.utilidad / v_base * 100.0, 2) else 0 end;

  new.monto_cobrado = v_cobrado;
  new.saldo = round(new.total - v_cobrado, 2);

  -- Estado derivado (no toca borrador ni anulada).
  if new.estado not in ('borrador', 'anulada') then
    if new.total > 0 and v_cobrado >= new.total then
      new.estado = 'cobrada';
    elsif v_cobrado > 0 then
      new.estado = 'cobrada_parcial';
    elsif new.fecha_vencimiento is not null and new.fecha_vencimiento < current_date then
      new.estado = 'vencida';
    else
      new.estado = 'emitida';
    end if;
  end if;

  return new;
end $$;

drop trigger if exists recalc on public.facturas;
create trigger recalc before insert or update on public.facturas
  for each row execute function public.tg_factura_recalc();

-- ---------- "Tocar" el documento padre cuando cambian líneas/pagos ----------
create or replace function public.tg_tocar_cotizacion()
returns trigger language plpgsql set search_path = '' as $$
declare v_id uuid;
begin
  v_id = coalesce(new.cotizacion_id, old.cotizacion_id);
  update public.cotizaciones set updated_at = now() where id = v_id;
  if tg_op = 'DELETE' then return old; else return new; end if;
end $$;

create or replace function public.tg_tocar_factura()
returns trigger language plpgsql set search_path = '' as $$
declare v_id uuid;
begin
  v_id = coalesce(new.factura_id, old.factura_id);
  if v_id is not null then
    update public.facturas set updated_at = now() where id = v_id;
  end if;
  if tg_op = 'DELETE' then return old; else return new; end if;
end $$;

drop trigger if exists tocar_padre on public.cotizacion_lineas;
create trigger tocar_padre after insert or update or delete on public.cotizacion_lineas
  for each row execute function public.tg_tocar_cotizacion();

drop trigger if exists tocar_padre on public.factura_lineas;
create trigger tocar_padre after insert or update or delete on public.factura_lineas
  for each row execute function public.tg_tocar_factura();

drop trigger if exists tocar_factura on public.pagos;
create trigger tocar_factura after insert or update or delete on public.pagos
  for each row execute function public.tg_tocar_factura();

-- ---------- Auditoría inviolable (bitácora) ----------
create or replace function public.tg_auditoria()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
  v_email text;
  v_entidad_id uuid;
  v_antes jsonb;
  v_despues jsonb;
  v_ip text;
begin
  if tg_op = 'DELETE' then
    v_owner = old.owner_id; v_entidad_id = old.id;
    v_antes = to_jsonb(old); v_despues = null;
  elsif tg_op = 'UPDATE' then
    v_owner = new.owner_id; v_entidad_id = new.id;
    v_antes = to_jsonb(old); v_despues = to_jsonb(new);
  else
    v_owner = new.owner_id; v_entidad_id = new.id;
    v_antes = null; v_despues = to_jsonb(new);
  end if;

  select email into v_email from public.profiles where id = v_owner;

  begin
    v_ip = nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-forwarded-for';
  exception when others then
    v_ip = null;
  end;

  insert into public.bitacora (
    owner_id, usuario_email, accion, entidad, entidad_id,
    datos_antes, datos_despues, ip)
  values (
    v_owner, v_email, tg_op, tg_table_name, v_entidad_id,
    v_antes, v_despues, v_ip);

  if tg_op = 'DELETE' then return old; else return new; end if;
end $$;

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

-- ---------- Alta de usuario nuevo (perfil + config + categorías) ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, nombre_completo, rol)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nombre_completo', split_part(new.email, '@', 1)),
    'usuario')
  on conflict (id) do nothing;

  insert into public.empresa_config (owner_id, nombre, email)
  values (new.id, 'Mi Empresa', new.email)
  on conflict (owner_id) do nothing;

  insert into public.categorias_gasto (owner_id, nombre)
  select new.id, x
  from unnest(array['Combustible','Alquiler','Publicidad','Transporte','Herramientas','Otros']) as x
  on conflict (owner_id, nombre) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
