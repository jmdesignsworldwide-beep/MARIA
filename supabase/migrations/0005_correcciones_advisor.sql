-- ============================================================
--  JM FACTURACIÓN — Tanda 3
--  0005 · Correcciones para dejar el Security Advisor limpio
-- ------------------------------------------------------------
--  1) Las funciones de trigger definer no deben ser invocables.
--  2) La numeración pasa de RPC a trigger automático (evita el aviso
--     "definer ejecutable por authenticated").
--  3) Se eliminan las políticas "always true".
-- ============================================================

-- ---------- 1) Revocar EXECUTE en funciones de trigger definer ----------
-- (Los triggers se disparan igual; Postgres no exige EXECUTE para eso.)
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.tg_auditoria() from public, anon, authenticated;

-- ---------- 2) Numeración automática por trigger ----------
drop function if exists public.siguiente_numero_documento(public.tipo_documento);

create or replace function public._generar_numero_documento(
  p_owner uuid, p_tipo public.tipo_documento)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_anio integer := extract(year from current_date)::int;
  v_prefijo text;
  v_inicial integer;
  v_numero integer;
begin
  select
    case when p_tipo = 'cotizacion' then coalesce(prefijo_cotizacion, 'COT')
         else coalesce(prefijo_factura, 'FAC') end,
    case when p_tipo = 'cotizacion' then coalesce(numero_inicial_cotizacion, 1)
         else coalesce(numero_inicial_factura, 1) end
  into v_prefijo, v_inicial
  from public.empresa_config
  where owner_id = p_owner;

  if v_prefijo is null then
    v_prefijo := case when p_tipo = 'cotizacion' then 'COT' else 'FAC' end;
    v_inicial := 1;
  end if;

  insert into public.documento_secuencias (owner_id, tipo, anio, ultimo_numero)
  values (p_owner, p_tipo, v_anio, greatest(v_inicial - 1, 0))
  on conflict (owner_id, tipo, anio) do nothing;

  update public.documento_secuencias
     set ultimo_numero = ultimo_numero + 1, updated_at = now()
   where owner_id = p_owner and tipo = p_tipo and anio = v_anio
  returning ultimo_numero into v_numero;

  return v_prefijo || '-' || v_anio::text || '-' || lpad(v_numero::text, 4, '0');
end $$;
revoke all on function public._generar_numero_documento(uuid, public.tipo_documento)
  from public, anon, authenticated;

create or replace function public.tg_asignar_numero()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_tipo public.tipo_documento;
begin
  if new.numero is null or new.numero = '' then
    v_tipo := case tg_table_name
                when 'cotizaciones' then 'cotizacion'
                else 'factura' end::public.tipo_documento;
    new.numero := public._generar_numero_documento(new.owner_id, v_tipo);
  end if;
  return new;
end $$;
revoke all on function public.tg_asignar_numero() from public, anon, authenticated;

drop trigger if exists asignar_numero on public.cotizaciones;
create trigger asignar_numero before insert on public.cotizaciones
  for each row execute function public.tg_asignar_numero();

drop trigger if exists asignar_numero on public.facturas;
create trigger asignar_numero before insert on public.facturas
  for each row execute function public.tg_asignar_numero();

-- ---------- 3) Reemplazar políticas "always true" por alcance por dueño ----------
drop policy if exists bitacora_insert on public.bitacora;
create policy bitacora_insert on public.bitacora for insert
  with check (owner_id = (select auth.uid()) or (select auth.uid()) is null);

drop policy if exists secuencias_insert on public.documento_secuencias;
create policy secuencias_insert on public.documento_secuencias for insert
  with check (owner_id = (select auth.uid()) or (select auth.uid()) is null);

drop policy if exists secuencias_update on public.documento_secuencias;
create policy secuencias_update on public.documento_secuencias for update
  using (owner_id = (select auth.uid()) or (select auth.uid()) is null)
  with check (owner_id = (select auth.uid()) or (select auth.uid()) is null);
