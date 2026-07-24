-- ============================================================
--  JM FACTURACIÓN — Tanda 8
--  0006 · Almacenamiento privado de recibos y comprobantes
-- ------------------------------------------------------------
--  Bucket privado 'recibos'. Cada usuario solo accede a los
--  archivos bajo su propia carpeta {auth.uid()}/... mediante
--  URLs firmadas de corta duración (Estándar Fort Knox #11).
-- ============================================================

insert into storage.buckets (id, name, public)
values ('recibos', 'recibos', false)
on conflict (id) do nothing;

-- Políticas sobre storage.objects, acotadas a la carpeta del dueño.
drop policy if exists recibos_select_propio on storage.objects;
create policy recibos_select_propio on storage.objects
  for select to authenticated
  using (
    bucket_id = 'recibos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists recibos_insert_propio on storage.objects;
create policy recibos_insert_propio on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'recibos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists recibos_update_propio on storage.objects;
create policy recibos_update_propio on storage.objects
  for update to authenticated
  using (
    bucket_id = 'recibos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists recibos_delete_propio on storage.objects;
create policy recibos_delete_propio on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'recibos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
