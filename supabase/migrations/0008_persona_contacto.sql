-- ============================================================
--  JM FACTURACIÓN — Correcciones A5
--  0008 · Persona de contacto en clientes (solo empresas)
-- ============================================================

alter table public.clientes
  add column if not exists persona_contacto text;
