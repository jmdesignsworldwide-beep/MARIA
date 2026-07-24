"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, PackageSearch, UserPlus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  facturaSchema,
  type FacturaFormInput,
  type FacturaInput,
} from "@/lib/validations/factura";
import { crearFactura, actualizarFactura } from "@/lib/actions/facturas";
import type { CatalogoItem } from "@/lib/database.types";
import { formatearRD } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Modal } from "@/components/ui/modal";
import { ClienteForm } from "@/components/clientes/cliente-form";
import { MargenBarra } from "@/components/facturas/margen-barra";

type ClienteMin = { id: string; nombre: string };
type SuplidorMin = { id: string; nombre: string };

type FacturaExistente = {
  id: string;
  cliente_id: string | null;
  fecha: string;
  fecha_vencimiento: string | null;
  itbis_activo: boolean;
  itbis_tasa: number;
  descuento: number;
  notas: string | null;
  lineas: {
    catalogo_item_id: string | null;
    suplidor_id: string | null;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    costo_unitario: number;
    itbis_aplicable: boolean;
  }[];
};

const hoyISO = () => new Date().toISOString().slice(0, 10);

export function FacturaForm({
  clientes: clientesIniciales,
  catalogo,
  suplidores,
  factura,
}: {
  clientes: ClienteMin[];
  catalogo: CatalogoItem[];
  suplidores: SuplidorMin[];
  factura?: FacturaExistente;
}) {
  const router = useRouter();
  const [clientes, setClientes] = useState<ClienteMin[]>(clientesIniciales);
  const [nuevoClienteOpen, setNuevoClienteOpen] = useState(false);
  const [catalogoOpen, setCatalogoOpen] = useState(false);
  const [buscarCat, setBuscarCat] = useState("");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FacturaFormInput, unknown, FacturaInput>({
    resolver: zodResolver(facturaSchema),
    defaultValues: {
      cliente_id: factura?.cliente_id ?? "",
      fecha: factura?.fecha ?? hoyISO(),
      fecha_vencimiento: factura?.fecha_vencimiento ?? "",
      itbis_activo: factura?.itbis_activo ?? true,
      itbis_tasa: factura?.itbis_tasa ?? 18,
      descuento: factura?.descuento ?? 0,
      notas: factura?.notas ?? "",
      lineas:
        factura?.lineas && factura.lineas.length > 0
          ? factura.lineas
          : [
              {
                descripcion: "",
                cantidad: 1,
                precio_unitario: 0,
                costo_unitario: 0,
                itbis_aplicable: true,
                catalogo_item_id: null,
                suplidor_id: null,
              },
            ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lineas" });

  const lineasWatch = useWatch({ control, name: "lineas" });
  const itbisActivo = useWatch({ control, name: "itbis_activo" });
  const itbisTasa = Number(useWatch({ control, name: "itbis_tasa" })) || 0;
  const descuento = Number(useWatch({ control, name: "descuento" })) || 0;

  const t = (() => {
    let subtotal = 0;
    let baseItbis = 0;
    let costoTotal = 0;
    (lineasWatch ?? []).forEach((l) => {
      const cant = Number(l?.cantidad) || 0;
      const linea = cant * (Number(l?.precio_unitario) || 0);
      subtotal += linea;
      costoTotal += cant * (Number(l?.costo_unitario) || 0);
      if (l?.itbis_aplicable) baseItbis += linea;
    });
    const base = Math.max(0, subtotal - descuento);
    const itbis = itbisActivo ? (baseItbis * itbisTasa) / 100 : 0;
    const total = base + itbis;
    const utilidad = base - costoTotal;
    const margenPct = base > 0 ? (utilidad / base) * 100 : 0;
    return { subtotal, itbis, total, costoTotal, utilidad, margenPct };
  })();

  function agregarDelCatalogo(item: CatalogoItem) {
    append({
      descripcion: item.descripcion,
      cantidad: 1,
      precio_unitario: Number(item.precio_sugerido),
      costo_unitario: Number(item.costo_referencial),
      itbis_aplicable: true,
      catalogo_item_id: item.id,
      suplidor_id: null,
    });
    setCatalogoOpen(false);
    setBuscarCat("");
  }

  async function onSubmit(values: FacturaInput) {
    const res = factura
      ? await actualizarFactura(factura.id, values)
      : await crearFactura(values);
    if (!res.ok) {
      toast.error(res.error ?? "No se pudo guardar.");
      return;
    }
    toast.success(factura ? "Factura actualizada." : "Factura creada (borrador).");
    router.push(`/facturas/${res.id}`);
    router.refresh();
  }

  const catalogoFiltrado = catalogo.filter((c) =>
    c.descripcion.toLowerCase().includes(buscarCat.trim().toLowerCase()),
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {factura ? "Editar factura" : "Nueva factura"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Registra el costo de cada línea para ver tu margen real en vivo.
        </p>
      </div>

      {/* Cabecera */}
      <div className="rounded-card border border-line bg-surface p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <div className="mb-1.5 flex items-center justify-between">
              <Label htmlFor="cliente_id">Cliente</Label>
              <button
                type="button"
                onClick={() => setNuevoClienteOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Nuevo cliente
              </button>
            </div>
            <Select id="cliente_id" {...register("cliente_id")}>
              <option value="">Selecciona un cliente…</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
            {errors.cliente_id && (
              <p className="mt-1 text-xs text-danger">{errors.cliente_id.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="fecha" className="mb-1.5 block">
              Fecha
            </Label>
            <Input id="fecha" type="date" {...register("fecha")} />
          </div>
          <div>
            <Label htmlFor="fecha_vencimiento" className="mb-1.5 block">
              Vencimiento
            </Label>
            <Input id="fecha_vencimiento" type="date" {...register("fecha_vencimiento")} />
          </div>
        </div>
      </div>

      {/* Líneas */}
      <div className="rounded-card border border-line bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Líneas</h2>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setCatalogoOpen(true)}>
              <PackageSearch className="h-4 w-4" />
              Del catálogo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  descripcion: "",
                  cantidad: 1,
                  precio_unitario: 0,
                  costo_unitario: 0,
                  itbis_aplicable: true,
                  catalogo_item_id: null,
                  suplidor_id: null,
                })
              }
            >
              <Plus className="h-4 w-4" />
              Línea
            </Button>
          </div>
        </div>

        {errors.lineas?.message && (
          <p className="mb-3 text-xs text-danger">{errors.lineas.message}</p>
        )}

        <div className="space-y-3">
          {fields.map((field, i) => {
            const l = lineasWatch?.[i];
            const cant = Number(l?.cantidad) || 0;
            const sub = cant * (Number(l?.precio_unitario) || 0);
            const utilLinea = cant * ((Number(l?.precio_unitario) || 0) - (Number(l?.costo_unitario) || 0));
            return (
              <div key={field.id} className="rounded-field border border-line bg-elevated/40 p-3">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Descripción"
                    aria-label="Descripción"
                    {...register(`lineas.${i}.descripcion` as const)}
                  />
                  <button
                    type="button"
                    onClick={() => (fields.length > 1 ? remove(i) : null)}
                    disabled={fields.length <= 1}
                    aria-label="Quitar línea"
                    className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-field text-muted transition-colors hover:bg-surface hover:text-danger disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <Label className="mb-1 block text-[11px] text-muted">Cantidad</Label>
                    <Input inputMode="decimal" className="tabular-nums" aria-label="Cantidad"
                      {...register(`lineas.${i}.cantidad` as const)} />
                  </div>
                  <div>
                    <Label className="mb-1 block text-[11px] text-muted">Precio unit.</Label>
                    <Input inputMode="decimal" className="tabular-nums" aria-label="Precio"
                      {...register(`lineas.${i}.precio_unitario` as const)} />
                  </div>
                  <div>
                    <Label className="mb-1 block text-[11px] text-muted">Costo unit.</Label>
                    <Input inputMode="decimal" className="tabular-nums" aria-label="Costo"
                      {...register(`lineas.${i}.costo_unitario` as const)} />
                  </div>
                  <div>
                    <Label className="mb-1 block text-[11px] text-muted">Suplidor</Label>
                    <Select aria-label="Suplidor" {...register(`lineas.${i}.suplidor_id` as const)}>
                      <option value="">—</option>
                      {suplidores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-4 border-t border-line-soft pt-2.5 text-xs">
                  <Controller
                    control={control}
                    name={`lineas.${i}.itbis_aplicable` as const}
                    render={({ field: f }) => (
                      <label className="flex items-center gap-2">
                        <Switch checked={f.value ?? true} onCheckedChange={f.onChange} />
                        <span className="text-muted">ITBIS</span>
                      </label>
                    )}
                  />
                  <div className="flex gap-4">
                    <span className="text-muted">
                      Util. <span className={`tabular-nums ${utilLinea >= 0 ? "text-success" : "text-danger"}`}>{formatearRD(utilLinea)}</span>
                    </span>
                    <span className="font-medium tabular-nums">{formatearRD(sub)}</span>
                  </div>
                </div>
                {errors.lineas?.[i]?.descripcion && (
                  <p className="mt-1 text-xs text-danger">{errors.lineas[i]?.descripcion?.message}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Margen en vivo */}
      <MargenBarra utilidad={t.utilidad} margenPct={t.margenPct} costoTotal={t.costoTotal} />

      {/* Opciones + resumen */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-card border border-line bg-surface p-5">
          <Controller
            control={control}
            name="itbis_activo"
            render={({ field }) => (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Aplicar ITBIS</p>
                  <p className="text-xs text-muted">18% sobre las líneas marcadas.</p>
                </div>
                <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
              </div>
            )}
          />
          <div>
            <Label htmlFor="descuento" className="mb-1.5 block">
              Descuento (RD$)
            </Label>
            <Input id="descuento" inputMode="decimal" className="tabular-nums" {...register("descuento")} />
          </div>
          <div>
            <Label htmlFor="notas" className="mb-1.5 block">
              Notas
            </Label>
            <Textarea id="notas" placeholder="Notas para el cliente…" {...register("notas")} />
          </div>
        </div>

        <div className="rounded-card border border-line bg-surface p-5">
          <h2 className="mb-4 font-display text-lg font-semibold">Resumen</h2>
          <dl className="space-y-2.5 text-sm">
            <Fila label="Subtotal" valor={t.subtotal} />
            {descuento > 0 && <Fila label="Descuento" valor={-descuento} />}
            <Fila label="ITBIS" valor={t.itbis} />
            <div className="mt-2 flex items-baseline justify-between border-t border-line pt-3">
              <dt className="text-lg font-semibold text-fg">Total</dt>
              <dd className="text-lg font-semibold tabular-nums text-accent">{formatearRD(t.total)}</dd>
            </div>
            <div className="flex justify-between text-xs text-muted">
              <dt>Costo</dt>
              <dd className="tabular-nums">{formatearRD(t.costoTotal)}</dd>
            </div>
          </dl>
          <Button type="submit" size="lg" loading={isSubmitting} className="mt-6 w-full">
            {factura ? "Guardar cambios" : "Crear factura"}
          </Button>
        </div>
      </div>

      <Modal open={nuevoClienteOpen} onClose={() => setNuevoClienteOpen(false)} title="Nuevo cliente" size="lg">
        <ClienteForm
          onCancel={() => setNuevoClienteOpen(false)}
          onDone={(creado) => {
            setNuevoClienteOpen(false);
            if (creado) {
              setClientes((prev) => [...prev, creado].sort((a, b) => a.nombre.localeCompare(b.nombre)));
              setValue("cliente_id", creado.id, { shouldValidate: true });
            }
          }}
        />
      </Modal>

      <Modal
        open={catalogoOpen}
        onClose={() => setCatalogoOpen(false)}
        title="Agregar del catálogo"
        description="El costo referencial se copia como costo de la línea."
        size="lg"
      >
        <Input
          autoFocus
          value={buscarCat}
          onChange={(e) => setBuscarCat(e.target.value)}
          placeholder="Buscar en el catálogo…"
          className="mb-3"
        />
        <div className="max-h-[50vh] space-y-1.5 overflow-y-auto">
          {catalogoFiltrado.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              {catalogo.length === 0 ? "Tu catálogo está vacío." : "Sin resultados."}
            </p>
          ) : (
            catalogoFiltrado.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => agregarDelCatalogo(item)}
                className="flex w-full items-center justify-between gap-3 rounded-field border border-line bg-elevated px-3.5 py-2.5 text-left text-sm transition-colors hover:border-accent/60"
              >
                <span className="truncate">{item.descripcion}</span>
                <span className="flex-none tabular-nums text-muted">{formatearRD(item.precio_sugerido)}</span>
              </button>
            ))
          )}
        </div>
      </Modal>
    </form>
  );
}

function Fila({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="tabular-nums">{formatearRD(valor)}</dd>
    </div>
  );
}
