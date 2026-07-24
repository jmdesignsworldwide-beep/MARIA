-- ============================================================
--  JM FACTURACIÓN — Tanda 3
--  0003 · Seguridad: RLS + FORCE, políticas y permisos
-- ------------------------------------------------------------
--  Aislamiento hermético por owner_id (Estándar Fort Knox #2).
--  El rol `anon` no toca ninguna tabla; todo pasa por
--  `authenticated` + RLS, o por funciones SECURITY DEFINER.
-- ============================================================

-- El rol anónimo (llave pública) no tiene acceso a datos de negocio.
revoke all on all tables in schema public from anon;

-- ---------- Tablas estándar (CRUD del dueño) ----------
do $$
declare
  t text;
  tablas text[] := array[
    'clientes','suplidores','catalogo_items','cotizaciones','facturas',
    'cotizacion_lineas','factura_lineas','compras','pagos','gastos'
  ];
begin
  foreach t in array tablas loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('drop policy if exists %I on public.%I', t || '_propio', t);
    execute format(
      'create policy %I on public.%I for all
         using (owner_id = (select auth.uid()))
         with check (owner_id = (select auth.uid()))',
      t || '_propio', t);
  end loop;
end $$;

-- ---------- empresa_config y categorias_gasto ----------
-- CRUD del dueño + inserción de arranque desde handle_new_user (donde
-- auth.uid() es null por ejecutarse como definer/servicio).
do $$
declare
  t text;
  tablas text[] := array['empresa_config','categorias_gasto'];
begin
  foreach t in array tablas loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('drop policy if exists %I on public.%I', t || '_sel', t);
    execute format('drop policy if exists %I on public.%I', t || '_ins', t);
    execute format('drop policy if exists %I on public.%I', t || '_upd', t);
    execute format('drop policy if exists %I on public.%I', t || '_del', t);
    execute format(
      'create policy %I on public.%I for select using (owner_id = (select auth.uid()))',
      t || '_sel', t);
    execute format(
      'create policy %I on public.%I for insert
         with check (owner_id = (select auth.uid()) or (select auth.uid()) is null)',
      t || '_ins', t);
    execute format(
      'create policy %I on public.%I for update
         using (owner_id = (select auth.uid()))
         with check (owner_id = (select auth.uid()))',
      t || '_upd', t);
    execute format(
      'create policy %I on public.%I for delete using (owner_id = (select auth.uid()))',
      t || '_del', t);
  end loop;
end $$;

-- ---------- profiles ----------
alter table public.profiles enable row level security;
alter table public.profiles force row level security;

-- El usuario solo puede cambiar su nombre y correo, jamás su rol,
-- estado o vencimiento (Estándar Fort Knox #3: sin auto-escalada).
revoke all on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (nombre_completo, email) on public.profiles to authenticated;

drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_update on public.profiles;
create policy profiles_select on public.profiles
  for select using (id = (select auth.uid()));
create policy profiles_insert on public.profiles
  for insert with check ((select auth.uid()) is null);
create policy profiles_update on public.profiles
  for update using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- ---------- documento_secuencias (solo definer escribe) ----------
alter table public.documento_secuencias enable row level security;
alter table public.documento_secuencias force row level security;
revoke all on public.documento_secuencias from authenticated;
grant select on public.documento_secuencias to authenticated;

drop policy if exists secuencias_select on public.documento_secuencias;
drop policy if exists secuencias_insert on public.documento_secuencias;
drop policy if exists secuencias_update on public.documento_secuencias;
create policy secuencias_select on public.documento_secuencias
  for select using (owner_id = (select auth.uid()));
create policy secuencias_insert on public.documento_secuencias
  for insert with check (true);
create policy secuencias_update on public.documento_secuencias
  for update using (true) with check (true);

-- ---------- bitacora (auditoría inviolable) ----------
-- INSERT solo vía el trigger definer; SELECT solo propio; UPDATE y
-- DELETE imposibles a nivel de base de datos (Estándar Fort Knox #12).
alter table public.bitacora enable row level security;
alter table public.bitacora force row level security;
revoke all on public.bitacora from authenticated;
grant select on public.bitacora to authenticated;

drop policy if exists bitacora_select on public.bitacora;
drop policy if exists bitacora_insert on public.bitacora;
create policy bitacora_select on public.bitacora
  for select using (owner_id = (select auth.uid()));
create policy bitacora_insert on public.bitacora
  for insert with check (true);
-- Sin políticas de UPDATE ni DELETE: nadie puede alterarla ni borrarla.
