"use client";

import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  catalogoSchema,
  type CatalogoInput,
  type CatalogoFormInput,
} from "@/lib/validations/catalogo";
import { crearItem, actualizarItem } from "@/lib/actions/catalogo";
import type { CatalogoItem } from "@/lib/database.types";
import { formatearRD } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export function ItemForm({
  item,
  onDone,
  onCancel,
}: {
  item?: CatalogoItem;
  onDone: () => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CatalogoFormInput, unknown, CatalogoInput>({
    resolver: zodResolver(catalogoSchema),
    defaultValues: {
      descripcion: item?.descripcion ?? "",
      tipo: item?.tipo ?? "producto",
      precio_sugerido: item?.precio_sugerido ?? 0,
      costo_referencial: item?.costo_referencial ?? 0,
      unidad: item?.unidad ?? "unidad",
      activo: item?.activo ?? true,
    },
  });

  const precio = Number(useWatch({ control, name: "precio_sugerido" })) || 0;
  const costo = Number(useWatch({ control, name: "costo_referencial" })) || 0;
  const margen = precio - costo;
  const margenPct = precio > 0 ? (margen / precio) * 100 : 0;

  async function onSubmit(values: CatalogoInput) {
    const res = item
      ? await actualizarItem(item.id, values)
      : await crearItem(values);
    if (!res.ok) {
      toast.error(res.error ?? "No se pudo guardar.");
      return;
    }
    toast.success(item ? "Item actualizado." : "Item creado.");
    onDone();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="descripcion" className="mb-1.5 block">
          Descripción
        </Label>
        <Input
          id="descripcion"
          placeholder='Smart TV Samsung 55" 4K'
          {...register("descripcion")}
        />
        {errors.descripcion && (
          <p className="mt-1 text-xs text-danger">{errors.descripcion.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="tipo" className="mb-1.5 block">
            Tipo
          </Label>
          <Select id="tipo" {...register("tipo")}>
            <option value="producto">Producto</option>
            <option value="servicio">Servicio</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="unidad" className="mb-1.5 block">
            Unidad
          </Label>
          <Input id="unidad" placeholder="unidad, rollo, servicio…" {...register("unidad")} />
          {errors.unidad && (
            <p className="mt-1 text-xs text-danger">{errors.unidad.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="precio_sugerido" className="mb-1.5 block">
            Precio sugerido (RD$)
          </Label>
          <Input
            id="precio_sugerido"
            inputMode="decimal"
            className="tabular-nums"
            {...register("precio_sugerido")}
          />
          {errors.precio_sugerido && (
            <p className="mt-1 text-xs text-danger">{errors.precio_sugerido.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="costo_referencial" className="mb-1.5 block">
            Costo referencial (RD$)
          </Label>
          <Input
            id="costo_referencial"
            inputMode="decimal"
            className="tabular-nums"
            {...register("costo_referencial")}
          />
          {errors.costo_referencial && (
            <p className="mt-1 text-xs text-danger">{errors.costo_referencial.message}</p>
          )}
        </div>
      </div>

      {/* Margen referencial en vivo */}
      <div className="flex items-center justify-between rounded-field border border-line bg-elevated px-4 py-3">
        <span className="text-sm text-muted">Margen referencial</span>
        <span
          className={`text-sm font-semibold tabular-nums ${
            margen > 0 ? "text-success" : margen < 0 ? "text-danger" : "text-muted"
          }`}
        >
          {formatearRD(margen)}
          {precio > 0 && (
            <span className="ml-1.5 text-xs font-normal text-muted">
              ({margenPct.toFixed(1)}%)
            </span>
          )}
        </span>
      </div>

      <Controller
        control={control}
        name="activo"
        render={({ field }) => (
          <div className="flex items-center justify-between rounded-field border border-line bg-elevated px-4 py-3">
            <div>
              <p className="text-sm font-medium">Item activo</p>
              <p className="text-xs text-muted">Los inactivos no aparecen al facturar.</p>
            </div>
            <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
          </div>
        )}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {item ? "Guardar cambios" : "Crear item"}
        </Button>
      </div>
    </form>
  );
}
