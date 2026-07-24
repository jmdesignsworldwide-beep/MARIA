"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Upload, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";
import {
  empresaSchema,
  type EmpresaFormInput,
  type EmpresaInput,
} from "@/lib/validations/ajustes";
import { actualizarEmpresa, guardarImagenEmpresa } from "@/lib/actions/ajustes";
import { createClient } from "@/lib/supabase/client";
import type { EmpresaConfig } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-line bg-surface p-5 sm:p-6">
      <h2 className="mb-4 font-display text-lg font-semibold">{titulo}</h2>
      {children}
    </div>
  );
}

export function EmpresaForm({
  ownerId,
  empresa,
  logoUrl,
}: {
  ownerId: string;
  empresa: EmpresaConfig;
  logoUrl: string | null;
}) {
  const router = useRouter();
  const logoRef = useRef<HTMLInputElement>(null);
  const [subiendoLogo, setSubiendoLogo] = useState(false);

  const cuentas = Array.isArray(empresa.cuentas_bancarias)
    ? (empresa.cuentas_bancarias as { banco?: string; tipo?: string; numero?: string; titular?: string }[])
    : [];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EmpresaFormInput, unknown, EmpresaInput>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      nombre: empresa.nombre ?? "",
      rnc: empresa.rnc ?? "",
      direccion: empresa.direccion ?? "",
      telefono: empresa.telefono ?? "",
      email: empresa.email ?? "",
      prefijo_cotizacion: empresa.prefijo_cotizacion ?? "COT",
      prefijo_factura: empresa.prefijo_factura ?? "FAC",
      numero_inicial_cotizacion: empresa.numero_inicial_cotizacion ?? 1,
      numero_inicial_factura: empresa.numero_inicial_factura ?? 1,
      itbis_tasa: empresa.itbis_tasa ?? 18,
      itbis_activo: empresa.itbis_activo ?? true,
      terminos_cotizacion: empresa.terminos_cotizacion ?? "",
      terminos_factura: empresa.terminos_factura ?? "",
      cuentas_bancarias: cuentas.length > 0 ? cuentas : [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "cuentas_bancarias" });

  async function subirLogo(file: File) {
    setSubiendoLogo(true);
    const supabase = createClient();
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const path = `${ownerId}/empresa/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("recibos")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      setSubiendoLogo(false);
      toast.error("No se pudo subir el logo (¿almacenamiento configurado?).");
      return;
    }
    const res = await guardarImagenEmpresa("logo_path", path);
    setSubiendoLogo(false);
    if (!res.ok) return toast.error(res.error ?? "No se pudo guardar.");
    toast.success("Logo actualizado.");
    router.refresh();
  }

  async function onSubmit(values: EmpresaInput) {
    const res = await actualizarEmpresa(values);
    if (!res.ok) return toast.error(res.error ?? "No se pudo guardar.");
    toast.success("Configuración guardada.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <Seccion titulo="Datos de la empresa">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-16 w-16 flex-none items-center justify-center overflow-hidden rounded-card bg-elevated ring-1 ring-line">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              <Building2 className="h-6 w-6 text-muted" />
            )}
          </div>
          <div>
            <input
              ref={logoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) subirLogo(f);
              }}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => logoRef.current?.click()} loading={subiendoLogo}>
              <Upload className="h-4 w-4" />
              {logoUrl ? "Cambiar logo" : "Subir logo"}
            </Button>
            <p className="mt-1 text-xs text-muted">Aparece en tus PDFs.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="e_nombre" className="mb-1.5 block">Nombre / razón social</Label>
            <Input id="e_nombre" {...register("nombre")} />
            {errors.nombre && <p className="mt-1 text-xs text-danger">{errors.nombre.message}</p>}
          </div>
          <div>
            <Label htmlFor="e_rnc" className="mb-1.5 block">RNC</Label>
            <Input id="e_rnc" {...register("rnc")} />
          </div>
          <div>
            <Label htmlFor="e_tel" className="mb-1.5 block">Teléfono</Label>
            <Input id="e_tel" {...register("telefono")} />
          </div>
          <div>
            <Label htmlFor="e_email" className="mb-1.5 block">Correo</Label>
            <Input id="e_email" type="email" {...register("email")} />
            {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="e_dir" className="mb-1.5 block">Dirección</Label>
            <Input id="e_dir" {...register("direccion")} />
          </div>
        </div>
      </Seccion>

      <Seccion titulo="Numeración e ITBIS">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <Label htmlFor="e_pc" className="mb-1.5 block">Prefijo cotización</Label>
            <Input id="e_pc" {...register("prefijo_cotizacion")} />
          </div>
          <div>
            <Label htmlFor="e_nc" className="mb-1.5 block">N.º inicial cot.</Label>
            <Input id="e_nc" inputMode="numeric" className="tabular-nums" {...register("numero_inicial_cotizacion")} />
          </div>
          <div>
            <Label htmlFor="e_pf" className="mb-1.5 block">Prefijo factura</Label>
            <Input id="e_pf" {...register("prefijo_factura")} />
          </div>
          <div>
            <Label htmlFor="e_nf" className="mb-1.5 block">N.º inicial fact.</Label>
            <Input id="e_nf" inputMode="numeric" className="tabular-nums" {...register("numero_inicial_factura")} />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 items-end gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="e_itbis" className="mb-1.5 block">Tasa de ITBIS (%)</Label>
            <Input id="e_itbis" inputMode="decimal" className="tabular-nums" {...register("itbis_tasa")} />
          </div>
          <Controller
            control={control}
            name="itbis_activo"
            render={({ field }) => (
              <div className="flex items-center justify-between rounded-field border border-line bg-elevated px-4 py-3">
                <div>
                  <p className="text-sm font-medium">ITBIS activo</p>
                  <p className="text-xs text-muted">Puedes apagarlo por completo.</p>
                </div>
                <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
              </div>
            )}
          />
        </div>
      </Seccion>

      <Seccion titulo="Términos y condiciones">
        <div className="space-y-4">
          <div>
            <Label htmlFor="e_tcot" className="mb-1.5 block">Términos de cotización</Label>
            <Textarea id="e_tcot" {...register("terminos_cotizacion")} />
          </div>
          <div>
            <Label htmlFor="e_tfac" className="mb-1.5 block">Términos de factura</Label>
            <Textarea id="e_tfac" {...register("terminos_factura")} />
          </div>
        </div>
      </Seccion>

      <Seccion titulo="Cuentas bancarias">
        <p className="mb-3 text-sm text-muted">Aparecen en el PDF de la factura para el pago.</p>
        <div className="space-y-3">
          {fields.map((f, i) => (
            <div key={f.id} className="rounded-field border border-line bg-elevated/40 p-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Input placeholder="Banco" {...register(`cuentas_bancarias.${i}.banco` as const)} />
                <Input placeholder="Tipo (Corriente/Ahorros)" {...register(`cuentas_bancarias.${i}.tipo` as const)} />
                <Input placeholder="N.º de cuenta" className="tabular-nums" {...register(`cuentas_bancarias.${i}.numero` as const)} />
                <div className="flex gap-2">
                  <Input placeholder="Titular" {...register(`cuentas_bancarias.${i}.titular` as const)} />
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    aria-label="Quitar cuenta"
                    className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-field text-muted transition-colors hover:bg-surface hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {fields.length < 6 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => append({ banco: "", tipo: "", numero: "", titular: "" })}
          >
            <Plus className="h-4 w-4" />
            Agregar cuenta
          </Button>
        )}
      </Seccion>

      <div className="flex justify-end">
        <Button type="submit" size="lg" loading={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Guardar configuración
        </Button>
      </div>
    </form>
  );
}
