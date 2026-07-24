"use client";

import { useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, X, Loader2, Paperclip, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  gastoSchema,
  type GastoFormInput,
  type GastoInput,
} from "@/lib/validations/gasto";
import { crearGasto, crearCategoria } from "@/lib/actions/gastos";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type Categoria = { id: string; nombre: string };

export function GastoForm({
  ownerId,
  categorias: categoriasIniciales,
  onDone,
  onCancel,
}: {
  ownerId: string;
  categorias: Categoria[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>(categoriasIniciales);
  const [nuevaCat, setNuevaCat] = useState("");
  const [creandoCat, setCreandoCat] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GastoFormInput, unknown, GastoInput>({
    resolver: zodResolver(gastoSchema),
    defaultValues: {
      categoria_id: null,
      descripcion: "",
      monto: 0,
      fecha: new Date().toISOString().slice(0, 10),
      metodo_pago: "efectivo",
      es_recurrente: false,
    },
  });

  async function agregarCategoria() {
    const nombre = nuevaCat.trim();
    if (nombre.length < 2) return;
    setCreandoCat(true);
    const res = await crearCategoria({ nombre });
    setCreandoCat(false);
    if (!res.ok || !res.id) {
      toast.error(res.error ?? "No se pudo crear.");
      return;
    }
    const cat = { id: res.id, nombre };
    setCategorias((prev) => [...prev, cat].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setValue("categoria_id", res.id);
    setNuevaCat("");
    toast.success("Categoría creada.");
  }

  async function onSubmit(values: GastoInput) {
    let comprobantePath: string | undefined;
    if (archivo) {
      setSubiendo(true);
      const supabase = createClient();
      const ext = (archivo.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${ownerId}/gastos/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("recibos")
        .upload(path, archivo, { upsert: false, contentType: archivo.type });
      setSubiendo(false);
      if (error) {
        toast.error("No se pudo subir el comprobante. El gasto no se guardó.");
        return;
      }
      comprobantePath = path;
    }

    const res = await crearGasto({ ...values, comprobante_path: comprobantePath });
    if (!res.ok) {
      toast.error(res.error ?? "No se pudo registrar el gasto.");
      return;
    }
    toast.success("Gasto registrado.");
    onDone();
  }

  const cargando = isSubmitting || subiendo;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="g_desc" className="mb-1.5 block">Descripción</Label>
        <Input id="g_desc" placeholder="Alquiler del local — julio" {...register("descripcion")} />
        {errors.descripcion && <p className="mt-1 text-xs text-danger">{errors.descripcion.message}</p>}
      </div>

      <div>
        <Label htmlFor="g_cat" className="mb-1.5 block">Categoría</Label>
        <Controller
          control={control}
          name="categoria_id"
          render={({ field }) => (
            <Select
              id="g_cat"
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value || null)}
            >
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </Select>
          )}
        />
        <div className="mt-2 flex gap-2">
          <Input
            value={nuevaCat}
            onChange={(e) => setNuevaCat(e.target.value)}
            placeholder="Nueva categoría…"
            className="h-9 text-sm"
          />
          <Button type="button" variant="outline" size="sm" onClick={agregarCategoria} loading={creandoCat}>
            <Plus className="h-4 w-4" />
            Agregar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="g_monto" className="mb-1.5 block">Monto (RD$)</Label>
          <Input id="g_monto" inputMode="decimal" className="tabular-nums" {...register("monto")} />
          {errors.monto && <p className="mt-1 text-xs text-danger">{errors.monto.message}</p>}
        </div>
        <div>
          <Label htmlFor="g_fecha" className="mb-1.5 block">Fecha</Label>
          <Input id="g_fecha" type="date" {...register("fecha")} />
        </div>
        <div>
          <Label htmlFor="g_metodo" className="mb-1.5 block">Método</Label>
          <Select id="g_metodo" {...register("metodo_pago")}>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="cheque">Cheque</option>
          </Select>
        </div>
      </div>

      <Controller
        control={control}
        name="es_recurrente"
        render={({ field }) => (
          <div className="flex items-center justify-between rounded-field border border-line bg-elevated px-4 py-3">
            <div>
              <p className="text-sm font-medium">Gasto recurrente</p>
              <p className="text-xs text-muted">Como alquiler o internet; podrás duplicarlo cada mes.</p>
            </div>
            <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
          </div>
        )}
      />

      {/* Comprobante */}
      <div>
        <Label className="mb-1.5 block">Comprobante (opcional)</Label>
        <input
          ref={inputFileRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
        />
        {archivo ? (
          <div className="flex items-center justify-between rounded-field border border-line bg-elevated px-3.5 py-2.5 text-sm">
            <span className="flex items-center gap-2 truncate">
              <Paperclip className="h-4 w-4 flex-none text-muted" />
              <span className="truncate">{archivo.name}</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setArchivo(null);
                if (inputFileRef.current) inputFileRef.current.value = "";
              }}
              aria-label="Quitar archivo"
              className="text-muted hover:text-danger"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputFileRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-field border border-dashed border-line bg-elevated/40 px-3.5 py-3 text-sm text-muted transition-colors hover:border-accent/60 hover:text-fg"
          >
            <Upload className="h-4 w-4" />
            Subir foto o PDF del comprobante
          </button>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={cargando}>
          Cancelar
        </Button>
        <Button type="submit" loading={cargando}>
          {subiendo ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Subiendo…
            </>
          ) : (
            "Registrar gasto"
          )}
        </Button>
      </div>
    </form>
  );
}
