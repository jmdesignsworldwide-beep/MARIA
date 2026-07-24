"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Tag,
  Wallet,
  TrendingUp,
  TrendingDown,
  Paperclip,
  Copy,
  Pencil,
  Trash2,
  Repeat,
  ExternalLink,
  Search,
  X,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import type { CategoriaGasto, MetodoPago } from "@/lib/database.types";
import { formatearRD, formatearFecha } from "@/lib/format";
import {
  eliminarGasto,
  duplicarGasto,
  generarRecurrentesDelMes,
  urlFirmadaComprobante,
} from "@/lib/actions/gastos";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { GastoForm } from "@/components/gastos/gasto-form";
import { CategoriasManager } from "@/components/gastos/categorias-manager";
import { BarrasTendenciaGastos } from "@/components/dashboard/graficos";

export type GastoRow = {
  id: string;
  categoria_id: string | null;
  descripcion: string;
  categoria_nombre: string | null;
  monto: number;
  fecha: string;
  metodo_pago: MetodoPago;
  es_recurrente: boolean;
  comprobante_path: string | null;
};

type Preset = "mes" | "mes_ant" | "30" | "90" | "6m" | "custom";

const METODOS: { valor: MetodoPago | ""; etiqueta: string }[] = [
  { valor: "", etiqueta: "Todos los métodos" },
  { valor: "efectivo", etiqueta: "Efectivo" },
  { valor: "transferencia", etiqueta: "Transferencia" },
  { valor: "tarjeta", etiqueta: "Tarjeta" },
  { valor: "cheque", etiqueta: "Cheque" },
];

function isoDesde(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
}

export function GastosVista({
  ownerId,
  categorias,
  gastos,
  totalMes,
  totalMesAnterior,
  tendencia,
  nombreMes,
  inicioMesIso,
  finMesIso,
}: {
  ownerId: string;
  categorias: CategoriaGasto[];
  gastos: GastoRow[];
  totalMes: number;
  totalMesAnterior: number;
  tendencia: { mes: string; total: number }[];
  nombreMes: string;
  inicioMesIso: string;
  finMesIso: string;
}) {
  const router = useRouter();
  const [gastoOpen, setGastoOpen] = useState(false);
  const [editando, setEditando] = useState<GastoRow | null>(null);
  const [catOpen, setCatOpen] = useState(false);
  const [aEliminar, setAEliminar] = useState<GastoRow | null>(null);
  const [generando, setGenerando] = useState(false);

  // Filtros
  const [preset, setPreset] = useState<Preset>("mes");
  const [desde, setDesde] = useState(inicioMesIso);
  const [hasta, setHasta] = useState(finMesIso);
  const [catFiltro, setCatFiltro] = useState<string>("");
  const [metodoFiltro, setMetodoFiltro] = useState<MetodoPago | "">("");
  const [busqueda, setBusqueda] = useState("");

  function aplicarPreset(p: Preset) {
    setPreset(p);
    const finExcl = new Date();
    finExcl.setDate(finExcl.getDate() + 1);
    const finIso = finExcl.toISOString().slice(0, 10);
    if (p === "mes") {
      setDesde(inicioMesIso);
      setHasta(finMesIso);
    } else if (p === "mes_ant") {
      const d = new Date(inicioMesIso);
      const ant = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      setDesde(ant.toISOString().slice(0, 10));
      setHasta(inicioMesIso);
    } else if (p === "30") {
      setDesde(isoDesde(30));
      setHasta(finIso);
    } else if (p === "90") {
      setDesde(isoDesde(90));
      setHasta(finIso);
    } else if (p === "6m") {
      const d = new Date();
      const seis = new Date(d.getFullYear(), d.getMonth() - 5, 1);
      setDesde(seis.toISOString().slice(0, 10));
      setHasta(finIso);
    }
  }

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return gastos.filter((g) => {
      if (g.fecha < desde || g.fecha >= hasta) return false;
      if (catFiltro && (g.categoria_id ?? "sin") !== catFiltro) return false;
      if (metodoFiltro && g.metodo_pago !== metodoFiltro) return false;
      if (q && !g.descripcion.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [gastos, desde, hasta, catFiltro, metodoFiltro, busqueda]);

  const totalFiltro = filtrados.reduce((a, g) => a + g.monto, 0);
  const delta =
    totalMesAnterior > 0 ? ((totalMes - totalMesAnterior) / totalMesAnterior) * 100 : null;

  const filtrosActivos =
    preset !== "mes" || !!catFiltro || !!metodoFiltro || !!busqueda.trim();

  function limpiarFiltros() {
    aplicarPreset("mes");
    setCatFiltro("");
    setMetodoFiltro("");
    setBusqueda("");
  }

  async function verComprobante(path: string) {
    const url = await urlFirmadaComprobante(path);
    if (!url) return toast.error("No se pudo abrir el comprobante.");
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function duplicar(id: string) {
    const res = await duplicarGasto(id);
    if (!res.ok) return toast.error(res.error ?? "No se pudo duplicar.");
    toast.success("Gasto duplicado a hoy.");
    router.refresh();
  }

  async function generarRecurrentes() {
    setGenerando(true);
    const res = await generarRecurrentesDelMes();
    setGenerando(false);
    if (!res.ok) return toast.error(res.error ?? "No se pudo generar.");
    if ((res.creados ?? 0) === 0) {
      toast.info("Los gastos recurrentes de este mes ya están registrados.");
    } else {
      toast.success(`Se generaron ${res.creados} gasto(s) recurrente(s) de este mes.`);
    }
    router.refresh();
  }

  async function eliminar() {
    if (!aEliminar) return;
    const res = await eliminarGasto(aEliminar.id);
    if (!res.ok) {
      toast.error(res.error ?? "No se pudo eliminar.");
      setAEliminar(null);
      return;
    }
    toast.success("Gasto eliminado.");
    setAEliminar(null);
    router.refresh();
  }

  const catOptions = categorias.map((c) => ({ id: c.id, nombre: c.nombre }));

  return (
    <>
      <PageHeader
        title="Gastos del negocio"
        description="Registra los gastos operativos y compáralos mes a mes."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={generarRecurrentes} loading={generando}>
              <RefreshCw className="h-4 w-4" />
              Generar recurrentes
            </Button>
            <Button variant="secondary" onClick={() => setCatOpen(true)}>
              <Tag className="h-4 w-4" />
              Categorías
            </Button>
            <Button
              onClick={() => {
                setEditando(null);
                setGastoOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Nuevo gasto
            </Button>
          </div>
        }
      />

      {/* KPI del mes + tendencia 6 meses */}
      <div className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-card border border-line bg-surface p-5">
          <p className="text-xs uppercase tracking-wide text-muted">Gastos de {nombreMes}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-fg">{formatearRD(totalMes)}</p>
          {delta !== null ? (
            <p
              className={`mt-2 flex items-center gap-1 text-sm font-medium ${
                delta > 0 ? "text-danger" : "text-success"
              }`}
            >
              {delta > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {Math.abs(delta).toFixed(1)}% vs. mes anterior
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted">Sin datos del mes anterior para comparar.</p>
          )}
          <p className="mt-1 text-xs text-muted tabular-nums">
            Mes anterior: {formatearRD(totalMesAnterior)}
          </p>
        </div>

        <div className="rounded-card border border-line bg-surface p-5 lg:col-span-2">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
            Tendencia de los últimos 6 meses
          </h2>
          <BarrasTendenciaGastos data={tendencia} />
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-4 rounded-card border border-line bg-surface p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-muted">
            Periodo
            <Select
              value={preset}
              onChange={(e) => aplicarPreset(e.target.value as Preset)}
              className="h-9 w-44 text-sm"
            >
              <option value="mes">Este mes</option>
              <option value="mes_ant">Mes anterior</option>
              <option value="30">Últimos 30 días</option>
              <option value="90">Últimos 90 días</option>
              <option value="6m">Últimos 6 meses</option>
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
                  className="h-9 w-40 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted">
                Hasta
                <Input
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  className="h-9 w-40 text-sm"
                />
              </label>
            </>
          )}

          <label className="flex flex-col gap-1 text-xs text-muted">
            Categoría
            <Select
              value={catFiltro}
              onChange={(e) => setCatFiltro(e.target.value)}
              className="h-9 w-44 text-sm"
            >
              <option value="">Todas</option>
              {catOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
              <option value="sin">Sin categoría</option>
            </Select>
          </label>

          <label className="flex flex-col gap-1 text-xs text-muted">
            Método
            <Select
              value={metodoFiltro}
              onChange={(e) => setMetodoFiltro(e.target.value as MetodoPago | "")}
              className="h-9 w-44 text-sm"
            >
              {METODOS.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.etiqueta}
                </option>
              ))}
            </Select>
          </label>

          <label className="flex flex-1 flex-col gap-1 text-xs text-muted">
            Buscar descripción
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Alquiler, combustible…"
                className="h-9 pl-9 text-sm"
              />
            </div>
          </label>

          {filtrosActivos && (
            <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
              <X className="h-4 w-4" />
              Limpiar
            </Button>
          )}
        </div>

        {/* Total del filtro — siempre visible */}
        <div className="mt-3 flex items-center justify-between border-t border-line-soft pt-3">
          <span className="text-sm text-muted">
            {filtrados.length} gasto{filtrados.length === 1 ? "" : "s"} en el periodo
          </span>
          <span className="text-sm text-muted">
            Total filtrado:{" "}
            <span className="text-lg font-semibold tabular-nums text-fg">
              {formatearRD(totalFiltro)}
            </span>
          </span>
        </div>
      </div>

      {/* Lista */}
      {gastos.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Sin gastos registrados"
          description="Registra tus gastos operativos para llevar el control de tu dinero."
          action={
            <Button
              onClick={() => {
                setEditando(null);
                setGastoOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Registrar gasto
            </Button>
          }
        />
      ) : filtrados.length === 0 ? (
        <div className="rounded-card border border-line bg-surface px-4 py-10 text-center text-sm text-muted">
          Ningún gasto coincide con los filtros. Ajusta el periodo o límpialos.
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          <ul className="divide-y divide-line-soft">
            {filtrados.map((g) => (
              <li key={g.id} className="flex items-center gap-4 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{g.descripcion}</span>
                    {g.es_recurrente && (
                      <Badge variant="info">
                        <Repeat className="h-3 w-3" />
                        Recurrente
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted">
                    {g.categoria_nombre ?? "Sin categoría"} · {formatearFecha(g.fecha)} ·{" "}
                    <span className="capitalize">{g.metodo_pago}</span>
                  </p>
                </div>
                {g.comprobante_path && (
                  <button
                    type="button"
                    onClick={() => verComprobante(g.comprobante_path!)}
                    className="inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-accent"
                    title="Ver comprobante"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    <ExternalLink className="h-3 w-3" />
                  </button>
                )}
                <span className="font-semibold tabular-nums">{formatearRD(g.monto)}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditando(g);
                      setGastoOpen(true);
                    }}
                    aria-label="Editar"
                    title="Editar"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-field text-muted transition-colors hover:bg-elevated hover:text-fg"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicar(g.id)}
                    aria-label="Duplicar a hoy"
                    title="Duplicar a hoy"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-field text-muted transition-colors hover:bg-elevated hover:text-fg"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAEliminar(g)}
                    aria-label="Eliminar"
                    title="Eliminar"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-field text-muted transition-colors hover:bg-elevated hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal
        open={gastoOpen}
        onClose={() => setGastoOpen(false)}
        title={editando ? "Editar gasto" : "Nuevo gasto"}
        description={
          editando
            ? "Modifica los datos del gasto."
            : "Registra un gasto operativo del negocio."
        }
        size="lg"
      >
        <GastoForm
          ownerId={ownerId}
          categorias={catOptions}
          gasto={
            editando
              ? {
                  id: editando.id,
                  categoria_id: editando.categoria_id,
                  descripcion: editando.descripcion,
                  monto: editando.monto,
                  fecha: editando.fecha,
                  metodo_pago: editando.metodo_pago,
                  es_recurrente: editando.es_recurrente,
                  comprobante_path: editando.comprobante_path,
                }
              : undefined
          }
          onCancel={() => setGastoOpen(false)}
          onDone={() => {
            setGastoOpen(false);
            setEditando(null);
            router.refresh();
          }}
        />
      </Modal>

      <CategoriasManager open={catOpen} onClose={() => setCatOpen(false)} categorias={categorias} />

      <ConfirmDialog
        open={!!aEliminar}
        onClose={() => setAEliminar(null)}
        onConfirm={eliminar}
        title="Eliminar gasto"
        description="Se eliminará el gasto y su comprobante. La acción queda registrada en la bitácora y no se puede deshacer."
      />
    </>
  );
}
