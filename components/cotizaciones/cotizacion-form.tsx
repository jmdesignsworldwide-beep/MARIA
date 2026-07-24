"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, PackageSearch, UserPlus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  cotizacionSchema,
  type CotizacionFormInput,
  type CotizacionInput,
} from "@/lib/validations/cotizacion";
import { crearCotizacion, actualizarCotizacion } from "@/lib/actions/cotizaciones";
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

type ClienteMin = { id: string; nombre: string };

type CotizacionExistente = {
  id: string;
  cliente_id: string | null;
  fecha: string;
  validez_dias: number;
  itbis_activo: boolean;
  itbis_tasa: number;
  notas: string | null;
  condiciones: string | null;
  lineas: {
    catalogo_item_id: string | null;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    itbis_aplicable: boolean;
  }[];
};

const hoyISO = () => new Date().toISOString().slice(0, 10);

export function CotizacionForm({
  clientes: clientesIniciales,
  catalogo,
  cotizacion,
}: {
  clientes: ClienteMin[];
  catalogo: CatalogoItem[];
  cotizacion?: CotizacionExistente;
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
  } = useForm<CotizacionFormInput, unknown, CotizacionInput>({
    resolver: zodResolver(cotizacionSchema),
    defaultValues: {
      cliente_id: cotizacion?.cliente_id ?? "",
      fecha: cotizacion?.fecha ?? hoyISO(),
      validez_dias: cotizacion?.validez_dias ?? 15,
      itbis_activo: cotizacion?.itbis_activo ?? true,
      itbis_tasa: cotizacion?.itbis_tasa ?? 18,
      notas: cotizacion?.notas ?? "",
      condiciones: cotizacion?.condiciones ?? "",
      lineas:
        cotizacion?.lineas && cotizacion.lineas.length > 0
          ? cotizacion.lineas
          : [
              {
                descripcion: "",
                cantidad: 1,
                precio_unitario: 0,
                itbis_aplicable: true,
                catalogo_item_id: null,
              },
            ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lineas" });

  const lineasWatch = useWatch({ control, name: "lineas" });
  const itbisActivo = useWatch({ control, name: "itbis_activo" });
  const itbisTasa = Number(useWatch({ control, name: "itbis_tasa" })) || 0;

  const totales = (() => {
    let subtotal = 0;
    let baseItbis = 0;
    (lineasWatch ?? []).forEach((l) => {
      const linea = (Number(l?.cantidad) || 0) * (Number(l?.precio_unitario) || 0);
      subtotal += linea;
      if (l?.itbis_aplicable) baseItbis += linea;
    });
    const itbis = itbisActivo ? (baseItbis * itbisTasa) / 100 : 0;
    return { subtotal, itbis, total: subtotal + itbis };
  })();

  function agregarDelCatalogo(item: CatalogoItem) {
    append({
      descripcion: item.descripcion,
      cantidad: 1,
      precio_unitario: Number(item.precio_sugerido),
      itbis_aplicable: true,
      catalogo_item_id: item.id,
    });
    setCatalogoOpen(false);
    setBuscarCat("");
  }

  async function onSubmit(values: CotizacionInput) {
    const res = cotizacion
      ? await actualizarCotizacion(cotizacion.id, values)
      : await crearCotizacion(values);
    if (!res.ok) {
      toast.error(res.error ?? "No se pudo guardar.");
      return;
    }
    toast.success(cotizacion ? "Cotización actualizada." : "Cotización creada.");
    router.push(`/cotizaciones/${res.id}`);
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
          {cotizacion ? "Editar cotización" : "Nueva cotización"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          El número se asigna automáticamente al guardar.
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
            <Label htmlFor="validez_dias" className="mb-1.5 block">
              Validez (días)
            </Label>
            <Input id="validez_dias" inputMode="numeric" {...register("validez_dias")} />
          </div>
        </div>
      </div>

      {/* Líneas */}
      <div className="rounded-card border border-line bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Líneas</h2>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setCatalogoOpen(true)}
            >
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
                  itbis_aplicable: true,
                  catalogo_item_id: null,
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
            const sub = (Number(l?.cantidad) || 0) * (Number(l?.precio_unitario) || 0);
            return (
              <div key={field.id} className="rounded-field border border-line bg-elevated/40 p-3">
                <div className="flex flex-col gap-3">
                  <Input
                    placeholder="Descripción del producto o servicio"
                    aria-label="Descripción"
                    {...register(`lineas.${i}.descripcion` as const)}
                  />
                  <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[1fr_1fr_auto_auto_auto]">
                    <div>
                      <Label className="mb-1 block text-[11px] text-muted">Cantidad</Label>
                      <Input
                        inputMode="decimal"
                        className="tabular-nums"
                        aria-label="Cantidad"
                        {...register(`lineas.${i}.cantidad` as const)}
                      />
                    </div>
                    <div>
                      <Label className="mb-1 block text-[11px] text-muted">Precio unit.</Label>
                      <Input
                        inputMode="decimal"
                        className="tabular-nums"
                        aria-label="Precio unitario"
                        {...register(`lineas.${i}.precio_unitario` as const)}
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <Label className="mb-1 block text-[11px] text-muted">ITBIS</Label>
                      <Controller
                        control={control}
                        name={`lineas.${i}.itbis_aplicable` as const}
                        render={({ field: f }) => (
                          <Switch
                            checked={f.value ?? true}
                            onCheckedChange={f.onChange}
                          />
                        )}
                      />
                    </div>
                    <div className="text-right">
                      <Label className="mb-1 block text-[11px] text-muted">Subtotal</Label>
                      <p className="pt-2.5 text-sm font-medium tabular-nums">
                        {formatearRD(sub)}
                      </p>
                    </div>
                    <div className="flex items-end justify-end">
                      <button
                        type="button"
                        onClick={() => (fields.length > 1 ? remove(i) : null)}
                        disabled={fields.length <= 1}
                        aria-label="Quitar línea"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-field text-muted transition-colors hover:bg-surface hover:text-danger disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {errors.lineas?.[i]?.descripcion && (
                    <p className="text-xs text-danger">
                      {errors.lineas[i]?.descripcion?.message}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Totales + opciones */}
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
            <Label htmlFor="notas" className="mb-1.5 block">
              Notas
            </Label>
            <Textarea id="notas" placeholder="Notas internas o para el cliente…" {...register("notas")} />
          </div>
          <div>
            <Label htmlFor="condiciones" className="mb-1.5 block">
              Condiciones
            </Label>
            <Textarea
              id="condiciones"
              placeholder="Términos, tiempo de entrega, garantía…"
              {...register("condiciones")}
            />
          </div>
        </div>

        <div className="rounded-card border border-line bg-surface p-5">
          <h2 className="mb-4 font-display text-lg font-semibold">Resumen</h2>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tabular-nums">{formatearRD(totales.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">ITBIS</dt>
              <dd className="tabular-nums">{formatearRD(totales.itbis)}</dd>
            </div>
            <div className="mt-2 flex items-baseline justify-between border-t border-line pt-3">
              <dt className="text-lg font-semibold text-fg">Total</dt>
              <dd className="text-lg font-semibold tabular-nums text-accent">{formatearRD(totales.total)}</dd>
            </div>
          </dl>
          <Button type="submit" size="lg" loading={isSubmitting} className="mt-6 w-full">
            {cotizacion ? "Guardar cambios" : "Crear cotización"}
          </Button>
        </div>
      </div>

      {/* Modal nuevo cliente */}
      <Modal
        open={nuevoClienteOpen}
        onClose={() => setNuevoClienteOpen(false)}
        title="Nuevo cliente"
        size="lg"
      >
        <ClienteForm
          onCancel={() => setNuevoClienteOpen(false)}
          onDone={(creado) => {
            setNuevoClienteOpen(false);
            if (creado) {
              setClientes((prev) =>
                [...prev, creado].sort((a, b) => a.nombre.localeCompare(b.nombre)),
              );
              setValue("cliente_id", creado.id, { shouldValidate: true });
            }
          }}
        />
      </Modal>

      {/* Modal catálogo */}
      <Modal
        open={catalogoOpen}
        onClose={() => setCatalogoOpen(false)}
        title="Agregar del catálogo"
        description="Selecciona un producto o servicio para agregarlo como línea."
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
              {catalogo.length === 0
                ? "Tu catálogo está vacío. Agrega items desde el módulo Catálogo."
                : "Sin resultados."}
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
                <span className="flex-none tabular-nums text-muted">
                  {formatearRD(item.precio_sugerido)}
                </span>
              </button>
            ))
          )}
        </div>
      </Modal>
    </form>
  );
}
