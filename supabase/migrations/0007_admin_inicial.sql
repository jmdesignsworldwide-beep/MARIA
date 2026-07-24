-- ============================================================
--  JM FACTURACIÓN — Tanda 13
--  0007 · Promueve al primer usuario (la dueña) a administrador
-- ------------------------------------------------------------
--  El admin es quien gestiona los accesos demo. Solo hay una
--  cuenta dueña; se promueve la más antigua. Idempotente.
-- ============================================================

update public.profiles
set rol = 'admin'
where id = (
  select id from auth.users order by created_at asc limit 1
)
and rol <> 'admin';
