"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  LogIn,
  ChevronDown,
  ExternalLink,
  Search,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
  Activity,
  CalendarDays,
  Users,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { obtenerBitacora, exportarBitacora } from "@/lib/actions/bitacora";
import {
  type BitacoraEntrada,
  type BitacoraFiltros,
  type GrupoAccion,
  grupoDeAccion,
  calcularCambios,
  enlaceDocumento,
} from "@/lib/bitacora/tipos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const ICONO: Record<GrupoAccion, typeof Plus> = {
  crear: Plus,
  editar: Pencil,
  eliminar: Trash2,
  sesion: LogIn,
};
const COLOR: Record<GrupoAccion, { punto: string; chip: string }> = {
  crear: { punto: "bg-success text-white", chip: "text-success" },
  editar: { punto: "bg-accent text-accent-contrast", chip: "text-accent" },
  eliminar: { punto: "bg-danger text-white", chip: "text-danger" },
  sesion: { punto: "bg-info text-white", chip: "text-info" },
};

type Preset = "hoy" | "7" | "mes" | "custom";

function inicioHoy(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function rangoPreset(p: Preset): { desde?: string; hasta?: string } {
  const hoy = inicioHoy();
  if (p === "hoy") return { desde: hoy.toISOString() };
  if (p === "7") {
    const d = new Date(hoy);
    d.setDate(d.getDate() - 6);
    return { desde: d.toISOString() };
  }
  if (p === "mes") {
    const d = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    return { desde: d.toISOString() };
  }
  return {};
}

function claveDia(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function fechaLarga(iso: string): string {
  const t = new Intl.DateTimeFormat("es-DO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function horaExacta(iso: string): string {
  return new Intl.DateTimeFormat("es-DO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function tiempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "hace instantes";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} hora${h === 1 ? "" : "s"}`;
  const d = Math.round(h / 24);
  if (d < 30) return `hace ${d} día${d === 1 ? "" : "s"}`;
  const meses = Math.round(d / 30);
  return `hace ${meses} mes${meses === 1 ? "" : "es"}`;
}

function iniciales(email: string | null): string {
  if (!email) return "?";
  const base = email.split("@")[0] ?? email;
  const partes = base.split(/[.\-_]/).filter(Boolean);
  const ini = (partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "");
  return (ini || base.slice(0, 2)).toUpperCase();
}

const ACCIONES = [
  { v: "", t: "Todas las acciones" },
  { v: "crear", t: "Creó" },
  { v: "editar", t: "Editó" },
  { v: "eliminar", t: "Eliminó" },
  { v: "anular", t: "Anuló" },
  { v: "sesion", t: "Inició sesión" },
];
const ENTIDADES = [
  { v: "", t: "Todas las entidades" },
  { v: "factura", t: "Facturas" },
  { v: "cotización", t: "Cotizaciones" },
  { v: "cliente", t: "Clientes" },
  { v: "gasto", t: "Gastos" },
  { v: "compra", t: "Compras" },
  { v: "catalogo", t: "Catálogo" },
  { v: "ajustes", t: "Ajustes" },
  { v: "sesion", t: "Sesión" },
];

export function BitacoraVista({
  kpis,
  inicial,
  hasMoreInicial,
  totalInicial,
  usuarios,
}: {
  kpis: { hoy: number; semana: number; usuariosActivos: number };
  inicial: BitacoraEntrada[];
  hasMoreInicial: boolean;
  totalInicial: number;
  usuarios: string[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<BitacoraEntrada[]>(inicial);
  const [hasMore, setHasMore] = useState(hasMoreInicial);
  const [total, setTotal] = useState(totalInicial);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [pending, startTransition] = useTransition();
  const [exportando, setExportando] = useState(false);
  const [expandida, setExpandida] = useState<string | null>(null);

  // Filtros
  const [preset, setPreset] = useState<Preset>("mes");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [usuario, setUsuario] = useState("");
  const [accion, setAccion] = useState("");
  const [entidad, setEntidad] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const filtros: BitacoraFiltros = useMemo(() => {
    const base = preset === "custom" ? {} : rangoPreset(preset);
    const f: BitacoraFiltros = { ...base, usuario, accion, entidad, busqueda };
    if (preset === "custom") {
      if (desde) f.desde = new Date(desde).toISOString();
      if (hasta) {
        const h = new Date(hasta);
        h.setDate(h.getDate() + 1);
        f.hasta = h.toISOString();
      }
    }
    return f;
  }, [preset, desde, hasta, usuario, accion, entidad, busqueda]);

  function recargar(f: BitacoraFiltros) {
    startTransition(async () => {
      const res = await obtenerBitacora(f, 0);
      if (!res.ok) {
        toast.error("No se pudo cargar el historial.");
        return;
      }
      setRows(res.rows);
      setHasMore(res.hasMore);
      setTotal(res.total);
      setExpandida(null);
    });
  }

  // Cada cambio de filtro dispara recarga (con los valores nuevos).
  function cambiar(fn: () => BitacoraFiltros) {
    recargar(fn());
  }

  async function cargarMas() {
    setCargandoMas(true);
    const res = await obtenerBitacora(filtros, rows.length);
    setCargandoMas(false);
    if (!res.ok) return toast.error("No se pudo cargar más.");
    setRows((prev) => [...prev, ...res.rows]);
    setHasMore(res.hasMore);
  }

  async function exportar(formato: "excel" | "pdf") {
    setExportando(true);
    const res = await exportarBitacora(filtros);
    setExportando(false);
    if (!res.ok || res.rows.length === 0) {
      toast.info("No hay registros para exportar con estos filtros.");
      return;
    }
    if (formato === "excel") descargarCSV(res.rows);
    else imprimirPDF(res.rows);
  }

  const grupos = useMemo(() => {
    const map = new Map<string, BitacoraEntrada[]>();
    for (const r of rows) {
      const k = claveDia(r.created_at);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    }
    return Array.from(map.values());
  }, [rows]);

  const filtrosActivos = !!usuario || !!accion || !!entidad || !!busqueda.trim() || preset !== "mes";

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Bitácora</h1>
        <p className="text-sm text-muted">
          Registro inviolable de cada acción realizada en el sistema.
        </p>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiSimple icon={Activity} label="Acciones hoy" valor={kpis.hoy} />
        <KpiSimple icon={CalendarDays} label="Acciones esta semana" valor={kpis.semana} />
        <KpiSimple icon={Users} label="Usuarios activos (7 días)" valor={kpis.usuariosActivos} />
      </div>

      {/* Filtros */}
      <div className="mb-6 rounded-card border border-line bg-surface p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-muted">
            Periodo
            <Select
              value={preset}
              onChange={(e) => {
                const p = e.target.value as Preset;
                setPreset(p);
                if (p !== "custom") {
                  const base = rangoPreset(p);
                  recargar({ ...base, usuario, accion, entidad, busqueda });
                }
              }}
              className="h-9 w-40 text-sm"
            >
              <option value="hoy">Hoy</option>
              <option value="7">Últimos 7 días</option>
              <option value="mes">Este mes</option>
              <option value="custom">Personalizado</option>
            </Select>
          </label>

          {preset === "custom" && (
            <>
              <label className="flex flex-col gap-1 text-xs text-muted">
                Desde
                <Input
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  onBlur={() => cambiar(() => filtros)}
                  className="h-9 w-40 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted">
                Hasta
                <Input
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  onBlur={() => cambiar(() => filtros)}
                  className="h-9 w-40 text-sm"
                />
              </label>
            </>
          )}

          <label className="flex flex-col gap-1 text-xs text-muted">
            Usuario
            <Select
              value={usuario}
              onChange={(e) => {
                setUsuario(e.target.value);
                cambiar(() => ({ ...filtros, usuario: e.target.value }));
              }}
              className="h-9 w-44 text-sm"
            >
              <option value="">Todos</option>
              {usuarios.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </Select>
          </label>

          <label className="flex flex-col gap-1 text-xs text-muted">
            Acción
            <Select
              value={accion}
              onChange={(e) => {
                setAccion(e.target.value);
                cambiar(() => ({ ...filtros, accion: e.target.value }));
              }}
              className="h-9 w-40 text-sm"
            >
              {ACCIONES.map((a) => (
                <option key={a.v} value={a.v}>{a.t}</option>
              ))}
            </Select>
          </label>

          <label className="flex flex-col gap-1 text-xs text-muted">
            Entidad
            <Select
              value={entidad}
              onChange={(e) => {
                setEntidad(e.target.value);
                cambiar(() => ({ ...filtros, entidad: e.target.value }));
              }}
              className="h-9 w-40 text-sm"
            >
              {ENTIDADES.map((a) => (
                <option key={a.v} value={a.v}>{a.t}</option>
              ))}
            </Select>
          </label>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              cambiar(() => filtros);
            }}
            className="relative min-w-[180px] flex-1"
          >
            <label className="flex flex-col gap-1 text-xs text-muted">
              Buscar
              <span className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Ej.: FAC-2026-0012, cliente…"
                  className="h-9 pl-9 text-sm"
                />
              </span>
            </label>
          </form>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-line-soft pt-3">
          <span className="text-xs text-muted">
            {total} registro{total === 1 ? "" : "s"}
            {filtrosActivos ? " con los filtros actuales" : ""}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => exportar("excel")} loading={exportando}>
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
            <Button variant="secondary" size="sm" onClick={() => exportar("pdf")} loading={exportando}>
              <FileText className="h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {pending && rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">Cargando…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-card border border-dashed border-line bg-surface/50 px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-elevated">
            <Inbox className="h-6 w-6 text-muted" />
          </div>
          <h2 className="font-display text-lg font-semibold">Sin registros</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            No hay acciones que coincidan con los filtros. Prueba con otro periodo o límpialos.
          </p>
        </div>
      ) : (
        <div className={`space-y-7 ${pending ? "opacity-60" : ""}`}>
          {grupos.map((grupo) => (
            <div key={claveDia(grupo[0]!.created_at)}>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-fg">
                <CalendarDays className="h-4 w-4 text-muted" />
                {fechaLarga(grupo[0]!.created_at)}
              </h3>
              <ol className="relative space-y-2 border-l border-line pl-0">
                {grupo.map((e) => (
                  <EntradaItem
                    key={e.id}
                    entrada={e}
                    expandida={expandida === e.id}
                    onToggle={() =>
                      setExpandida((prev) => (prev === e.id ? null : e.id))
                    }
                    onIr={(href) => router.push(href)}
                  />
                ))}
              </ol>
            </div>
          ))}

          {hasMore && (
            <div className="pt-2 text-center">
              <Button variant="secondary" onClick={cargarMas} loading={cargandoMas}>
                Cargar más
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Aviso de inviolabilidad */}
      <p className="mt-10 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
        <ShieldCheck className="h-3.5 w-3.5" />
        Este registro no puede ser modificado ni eliminado por ningún usuario, incluido el administrador.
      </p>
    </div>
  );
}

function EntradaItem({
  entrada,
  expandida,
  onToggle,
  onIr,
}: {
  entrada: BitacoraEntrada;
  expandida: boolean;
  onToggle: () => void;
  onIr: (href: string) => void;
}) {
  const grupo = grupoDeAccion(entrada.accion);
  const Icono = ICONO[grupo];
  const color = COLOR[grupo];
  const cambios = useMemo(
    () => calcularCambios(entrada.datos_antes, entrada.datos_despues),
    [entrada.datos_antes, entrada.datos_despues],
  );
  const esEdicion = grupo === "editar" && cambios.length > 0;
  const href = enlaceDocumento(entrada);

  return (
    <li className="ml-4">
      <div className="relative rounded-card border border-line bg-surface p-3.5">
        <span
          className={`absolute -left-[26px] top-4 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-base ${color.punto}`}
        >
          <Icono className="h-3.5 w-3.5" />
        </span>

        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-elevated text-[10px] font-semibold text-muted">
            {iniciales(entrada.usuario_email)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm">{entrada.descripcion ?? "Acción registrada"}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              <span title={tiempoRelativo(entrada.created_at)} className="tabular-nums">
                {horaExacta(entrada.created_at)}
              </span>
              {entrada.ip && <span className="tabular-nums">IP {entrada.ip}</span>}
              {href && (
                <button
                  type="button"
                  onClick={() => onIr(href)}
                  className="inline-flex items-center gap-1 text-accent transition-colors hover:underline"
                >
                  Ver documento
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}
              {esEdicion && (
                <button
                  type="button"
                  onClick={onToggle}
                  className="inline-flex items-center gap-1 transition-colors hover:text-fg"
                  aria-expanded={expandida}
                >
                  Ver cambios
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${expandida ? "rotate-180" : ""}`}
                  />
                </button>
              )}
            </div>

            <AnimatePresence initial={false}>
              {esEdicion && expandida && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-1.5 rounded-field border border-line-soft bg-elevated/40 p-3">
                    {cambios.map((c) => (
                      <div
                        key={c.campo}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-xs"
                      >
                        <span className="text-muted">{c.campo}</span>
                        <span className="flex items-center gap-2 tabular-nums">
                          <span className="text-muted line-through">{c.antes}</span>
                          <span className="text-muted">→</span>
                          <span className="font-medium text-fg">{c.despues}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </li>
  );
}

function KpiSimple({
  icon: Icon,
  label,
  valor,
}: {
  icon: typeof Activity;
  label: string;
  valor: number;
}) {
  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-fg">{valor}</p>
    </div>
  );
}

function descargarCSV(rows: BitacoraEntrada[]) {
  const enc = ["Fecha y hora", "Usuario", "Acción", "Entidad", "Descripción", "IP"];
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("es-DO", { dateStyle: "short", timeStyle: "short" }).format(
      new Date(iso),
    );
  const lineas = rows.map((r) =>
    [fmt(r.created_at), r.usuario_email ?? "", r.accion, r.entidad, r.descripcion ?? "", r.ip ?? ""]
      .map((c) => `"${String(c).replace(/"/g, '""')}"`)
      .join(","),
  );
  const csv = "﻿" + [enc.join(","), ...lineas].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bitacora.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function imprimirPDF(rows: BitacoraEntrada[]) {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("es-DO", { dateStyle: "short", timeStyle: "short" }).format(
      new Date(iso),
    );
  const filas = rows
    .map(
      (r) => `<tr>
        <td>${fmt(r.created_at)}</td>
        <td>${esc(r.usuario_email ?? "")}</td>
        <td>${esc(r.descripcion ?? "")}</td>
      </tr>`,
    )
    .join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Bitácora</title>
    <style>
      body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#111;background:#fff;padding:24px}
      h1{font-size:18px;margin:0 0 2px}
      p{color:#555;font-size:12px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}
      th,td{padding:6px 8px;border-bottom:1px solid #e5e5e5;text-align:left;vertical-align:top}
      th{color:#666;text-transform:uppercase;font-size:10px}
    </style></head><body>
    <h1>Bitácora de auditoría</h1>
    <p>JM Nexus Designs · ${rows.length} registro(s)</p>
    <table><thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th></tr></thead>
    <tbody>${filas}</tbody></table>
    <script>window.onload=function(){window.print()}</script>
    </body></html>`;
  const w = window.open("", "_blank");
  if (!w) {
    toast.error("Permite las ventanas emergentes para exportar a PDF.");
    return;
  }
  w.document.write(html);
  w.document.close();
}
