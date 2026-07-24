-- ============================================================
--  JM FACTURACIÓN — Tanda 3
--  0001 · Esquema: tipos, tablas e índices
-- ------------------------------------------------------------
--  Todas las tablas de negocio llevan id uuid, created_at,
--  updated_at y owner_id (auth.users). RLS + FORCE y políticas
--  se aplican en 0003. Idempotente: se puede re-aplicar.
-- ============================================================

-- ---------- Tipos enumerados ----------
do $$ begin create type public.rol_usuario as enum ('admin','usuario','demo'); exception when duplicate_object then null; end $$;
do $$ begin create type public.tipo_cliente as enum ('persona','empresa'); exception when duplicate_object then null; end $$;
do $$ begin create type public.tipo_item as enum ('producto','servicio'); exception when duplicate_object then null; end $$;
do $$ begin create type public.tipo_documento as enum ('cotizacion','factura'); exception when duplicate_object then null; end $$;
do $$ begin create type public.estado_cotizacion as enum ('borrador','enviada','aprobada','rechazada','vencida','convertida'); exception when duplicate_object then null; end $$;
do $$ begin create type public.estado_factura as enum ('borrador','emitida','cobrada_parcial','cobrada','vencida','anulada'); exception when duplicate_object then null; end $$;
do $$ begin create type public.metodo_pago as enum ('efectivo','transferencia','tarjeta','cheque'); exception when duplicate_object then null; end $$;

-- ---------- profiles (perfil del usuario) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nombre_completo text,
  rol public.rol_usuario not null default 'usuario',
  is_active boolean not null default true,
  access_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- empresa_config (datos de la empresa de la dueña) ----------
create table if not exists public.empresa_config (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null default 'Mi Empresa',
  rnc text,
  direccion text,
  telefono text,
  email text,
  logo_path text,
  firma_path text,
  prefijo_cotizacion text not null default 'COT',
  prefijo_factura text not null default 'FAC',
  numero_inicial_cotizacion integer not null default 1,
  numero_inicial_factura integer not null default 1,
  itbis_tasa numeric(6,2) not null default 18.00,
  itbis_activo boolean not null default true,
  terminos_cotizacion text,
  terminos_factura text,
  cuentas_bancarias jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id)
);

-- ---------- clientes ----------
create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  tipo public.tipo_cliente not null default 'empresa',
  rnc_cedula text,
  telefono text,
  email text,
  direccion text,
  limite_credito numeric(14,2) not null default 0,
  notas text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- suplidores ----------
create table if not exists public.suplidores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  contacto text,
  telefono text,
  notas text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- catalogo_items (productos y servicios recurrentes) ----------
create table if not exists public.catalogo_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  descripcion text not null,
  tipo public.tipo_item not null default 'producto',
  precio_sugerido numeric(14,2) not null default 0,
  costo_referencial numeric(14,2) not null default 0,
  unidad text not null default 'unidad',
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- categorias_gasto ----------
create table if not exists public.categorias_gasto (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, nombre)
);

-- ---------- documento_secuencias (numeración interna con bloqueo) ----------
create table if not exists public.documento_secuencias (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  tipo public.tipo_documento not null,
  anio integer not null,
  ultimo_numero integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, tipo, anio)
);

-- ---------- cotizaciones ----------
create table if not exists public.cotizaciones (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  numero text not null,
  cliente_id uuid references public.clientes(id) on delete restrict,
  fecha date not null default current_date,
  validez_dias integer not null default 15,
  fecha_validez date,
  estado public.estado_cotizacion not null default 'borrador',
  itbis_tasa numeric(6,2) not null default 18.00,
  itbis_activo boolean not null default true,
  subtotal numeric(14,2) not null default 0,
  itbis numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  notas text,
  condiciones text,
  factura_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, numero)
);

-- ---------- facturas ----------
create table if not exists public.facturas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  numero text not null,
  cliente_id uuid references public.clientes(id) on delete restrict,
  cotizacion_id uuid references public.cotizaciones(id) on delete set null,
  fecha date not null default current_date,
  fecha_vencimiento date,
  estado public.estado_factura not null default 'borrador',
  itbis_tasa numeric(6,2) not null default 18.00,
  itbis_activo boolean not null default true,
  descuento numeric(14,2) not null default 0,
  subtotal numeric(14,2) not null default 0,
  itbis numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  costo_total numeric(14,2) not null default 0,
  utilidad numeric(14,2) not null default 0,
  margen_pct numeric(6,2) not null default 0,
  monto_cobrado numeric(14,2) not null default 0,
  saldo numeric(14,2) not null default 0,
  notas text,
  motivo_anulacion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, numero)
);

-- Enlace inverso cotización → factura (se agrega tras crear facturas).
do $$ begin
  alter table public.cotizaciones
    add constraint cotizaciones_factura_id_fkey
    foreign key (factura_id) references public.facturas(id) on delete set null;
exception when duplicate_object then null; end $$;

-- ---------- cotizacion_lineas ----------
create table if not exists public.cotizacion_lineas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  cotizacion_id uuid not null references public.cotizaciones(id) on delete cascade,
  catalogo_item_id uuid references public.catalogo_items(id) on delete set null,
  descripcion text not null,
  cantidad numeric(12,2) not null default 1,
  precio_unitario numeric(14,2) not null default 0,
  itbis_aplicable boolean not null default true,
  subtotal_linea numeric(14,2) not null default 0,
  orden integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- factura_lineas ----------
create table if not exists public.factura_lineas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  factura_id uuid not null references public.facturas(id) on delete cascade,
  catalogo_item_id uuid references public.catalogo_items(id) on delete set null,
  suplidor_id uuid references public.suplidores(id) on delete set null,
  descripcion text not null,
  cantidad numeric(12,2) not null default 1,
  precio_unitario numeric(14,2) not null default 0,
  costo_unitario numeric(14,2) not null default 0,
  itbis_aplicable boolean not null default true,
  subtotal_linea numeric(14,2) not null default 0,
  utilidad_linea numeric(14,2) not null default 0,
  orden integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- compras (costo a suplidor asociado a una factura) ----------
create table if not exists public.compras (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  factura_id uuid references public.facturas(id) on delete set null,
  suplidor_id uuid references public.suplidores(id) on delete restrict,
  descripcion text,
  monto numeric(14,2) not null default 0,
  fecha date not null default current_date,
  metodo_pago public.metodo_pago not null default 'efectivo',
  numero_comprobante text,
  recibo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- pagos (cobros recibidos, con abonos parciales) ----------
create table if not exists public.pagos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  factura_id uuid not null references public.facturas(id) on delete cascade,
  monto numeric(14,2) not null default 0,
  fecha date not null default current_date,
  metodo_pago public.metodo_pago not null default 'efectivo',
  referencia text,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- gastos ----------
create table if not exists public.gastos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  categoria_id uuid references public.categorias_gasto(id) on delete set null,
  descripcion text not null,
  monto numeric(14,2) not null default 0,
  fecha date not null default current_date,
  metodo_pago public.metodo_pago not null default 'efectivo',
  comprobante_path text,
  es_recurrente boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- bitacora (auditoría inviolable) ----------
create table if not exists public.bitacora (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  usuario_email text,
  accion text not null,
  entidad text not null,
  entidad_id uuid,
  datos_antes jsonb,
  datos_despues jsonb,
  ip text,
  created_at timestamptz not null default now()
);

-- ---------- Índices ----------
create index if not exists idx_empresa_config_owner on public.empresa_config(owner_id);
create index if not exists idx_clientes_owner on public.clientes(owner_id);
create index if not exists idx_suplidores_owner on public.suplidores(owner_id);
create index if not exists idx_catalogo_owner on public.catalogo_items(owner_id);
create index if not exists idx_categorias_gasto_owner on public.categorias_gasto(owner_id);
create index if not exists idx_secuencias_owner on public.documento_secuencias(owner_id);
create index if not exists idx_cotizaciones_owner on public.cotizaciones(owner_id);
create index if not exists idx_cotizaciones_cliente on public.cotizaciones(cliente_id);
create index if not exists idx_cotizaciones_estado on public.cotizaciones(owner_id, estado);
create index if not exists idx_facturas_owner on public.facturas(owner_id);
create index if not exists idx_facturas_cliente on public.facturas(cliente_id);
create index if not exists idx_facturas_estado on public.facturas(owner_id, estado);
create index if not exists idx_cotizacion_lineas_cot on public.cotizacion_lineas(cotizacion_id);
create index if not exists idx_cotizacion_lineas_owner on public.cotizacion_lineas(owner_id);
create index if not exists idx_factura_lineas_fac on public.factura_lineas(factura_id);
create index if not exists idx_factura_lineas_owner on public.factura_lineas(owner_id);
create index if not exists idx_compras_owner on public.compras(owner_id);
create index if not exists idx_compras_factura on public.compras(factura_id);
create index if not exists idx_compras_suplidor on public.compras(suplidor_id);
create index if not exists idx_pagos_owner on public.pagos(owner_id);
create index if not exists idx_pagos_factura on public.pagos(factura_id);
create index if not exists idx_gastos_owner on public.gastos(owner_id);
create index if not exists idx_gastos_categoria on public.gastos(categoria_id);
create index if not exists idx_bitacora_owner on public.bitacora(owner_id, created_at desc);
create index if not exists idx_bitacora_entidad on public.bitacora(owner_id, entidad, entidad_id);
