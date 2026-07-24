"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  clienteSchema,
  type ClienteInput,
  type ClienteFormInput,
} from "@/lib/validations/cliente";
import { crearCliente, actualizarCliente } from "@/lib/actions/clientes";
import type { Cliente } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

function Campo({
  label,
  htmlFor,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} className="mb-1.5 block">
        {label}
      </Label>
      {children}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function ClienteForm({
  cliente,
  onDone,
  onCancel,
}: {
  cliente?: Cliente;
  onDone: (created?: { id: string; nombre: string }) => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ClienteFormInput, unknown, ClienteInput>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nombre: cliente?.nombre ?? "",
      tipo: cliente?.tipo ?? "empresa",
      rnc_cedula: cliente?.rnc_cedula ?? "",
      telefono: cliente?.telefono ?? "",
      email: cliente?.email ?? "",
      direccion: cliente?.direccion ?? "",
      limite_credito: cliente?.limite_credito ?? 0,
      notas: cliente?.notas ?? "",
      activo: cliente?.activo ?? true,
    },
  });

  async function onSubmit(values: ClienteInput) {
    const res = cliente
      ? await actualizarCliente(cliente.id, values)
      : await crearCliente(values);

    if (!res.ok) {
      toast.error(res.error ?? "No se pudo guardar.");
      return;
    }
    toast.success(cliente ? "Cliente actualizado." : "Cliente creado.");
    onDone(
      cliente || !res.id ? undefined : { id: res.id, nombre: values.nombre },
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Campo label="Nombre o razón social" htmlFor="nombre" error={errors.nombre?.message}>
        <Input id="nombre" placeholder="Ferretería Almonte, SRL" {...register("nombre")} />
      </Campo>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Tipo" htmlFor="tipo" error={errors.tipo?.message}>
          <Select id="tipo" {...register("tipo")}>
            <option value="empresa">Empresa</option>
            <option value="persona">Persona</option>
          </Select>
        </Campo>
        <Campo label="RNC o cédula" htmlFor="rnc_cedula" error={errors.rnc_cedula?.message}>
          <Input id="rnc_cedula" placeholder="1-30-11223-4" {...register("rnc_cedula")} />
        </Campo>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Teléfono" htmlFor="telefono" error={errors.telefono?.message}>
          <Input id="telefono" inputMode="tel" placeholder="(809) 555-7788" {...register("telefono")} />
        </Campo>
        <Campo label="Correo" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" placeholder="compras@empresa.do" {...register("email")} />
        </Campo>
      </div>

      <Campo label="Dirección" htmlFor="direccion" error={errors.direccion?.message}>
        <Input id="direccion" placeholder="Santo Domingo, D.N." {...register("direccion")} />
      </Campo>

      <Campo
        label="Límite de crédito (RD$)"
        htmlFor="limite_credito"
        error={errors.limite_credito?.message}
      >
        <Input
          id="limite_credito"
          inputMode="decimal"
          className="tabular-nums"
          {...register("limite_credito")}
        />
      </Campo>

      <Campo label="Notas" htmlFor="notas" error={errors.notas?.message}>
        <Textarea id="notas" placeholder="Cliente frecuente, paga puntual…" {...register("notas")} />
      </Campo>

      <Controller
        control={control}
        name="activo"
        render={({ field }) => (
          <div className="flex items-center justify-between rounded-field border border-line bg-elevated px-4 py-3">
            <div>
              <p className="text-sm font-medium">Cliente activo</p>
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
          {cliente ? "Guardar cambios" : "Crear cliente"}
        </Button>
      </div>
    </form>
  );
}
