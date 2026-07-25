"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  suplidorSchema,
  type SuplidorFormInput,
  type SuplidorInput,
} from "@/lib/validations/suplidor";
import { crearSuplidor, actualizarSuplidor } from "@/lib/actions/suplidores";
import type { Suplidor } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export function SuplidorForm({
  suplidor,
  onDone,
  onCancel,
}: {
  suplidor?: Suplidor;
  onDone: (created?: { id: string; nombre: string }) => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SuplidorFormInput, unknown, SuplidorInput>({
    resolver: zodResolver(suplidorSchema),
    defaultValues: {
      nombre: suplidor?.nombre ?? "",
      contacto: suplidor?.contacto ?? "",
      telefono: suplidor?.telefono ?? "",
      notas: suplidor?.notas ?? "",
      activo: suplidor?.activo ?? true,
    },
  });

  async function onSubmit(values: SuplidorInput) {
    const res = suplidor
      ? await actualizarSuplidor(suplidor.id, values)
      : await crearSuplidor(values);
    if (!res.ok) {
      toast.error(res.error ?? "No se pudo guardar.");
      return;
    }
    toast.success(suplidor ? "Suplidor actualizado." : "Suplidor creado.");
    onDone(suplidor || !res.id ? undefined : { id: res.id, nombre: values.nombre });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="s_nombre" className="mb-1.5 block">Nombre</Label>
        <Input id="s_nombre" placeholder="Plaza Lama" {...register("nombre")} />
        {errors.nombre && <p className="mt-1 text-xs text-danger">{errors.nombre.message}</p>}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="s_contacto" className="mb-1.5 block">Contacto</Label>
          <Input id="s_contacto" placeholder="Depto. Empresarial" {...register("contacto")} />
        </div>
        <div>
          <Label htmlFor="s_telefono" className="mb-1.5 block">Teléfono</Label>
          <Input id="s_telefono" inputMode="tel" placeholder="(809) 555-0000" {...register("telefono")} />
        </div>
      </div>
      <div>
        <Label htmlFor="s_notas" className="mb-1.5 block">Notas</Label>
        <Textarea id="s_notas" placeholder="Qué le compras, condiciones…" {...register("notas")} />
      </div>
      <Controller
        control={control}
        name="activo"
        render={({ field }) => (
          <div className="flex items-center justify-between rounded-field border border-line bg-elevated px-4 py-3">
            <p className="text-sm font-medium">Suplidor activo</p>
            <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
          </div>
        )}
      />
      <div className="sticky bottom-0 -mx-6 -mb-5 flex justify-end gap-3 border-t border-line bg-surface px-6 py-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {suplidor ? "Guardar" : "Crear suplidor"}
        </Button>
      </div>
    </form>
  );
}
