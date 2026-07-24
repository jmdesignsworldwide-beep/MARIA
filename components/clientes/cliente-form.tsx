"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
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

/** Aplica la máscara de cédula: ###-#######-# (11 dígitos). */
function mascaraCedula(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  const p = [d.slice(0, 3), d.slice(3, 10), d.slice(10, 11)].filter(Boolean);
  return p.join("-");
}

/** Aplica la máscara de RNC: #-##-#####-# (9 dígitos). */
function mascaraRnc(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 9);
  const p = [d.slice(0, 1), d.slice(1, 3), d.slice(3, 8), d.slice(8, 9)].filter(
    Boolean,
  );
  return p.join("-");
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
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClienteFormInput, unknown, ClienteInput>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nombre: cliente?.nombre ?? "",
      tipo: cliente?.tipo ?? "empresa",
      rnc_cedula: cliente?.rnc_cedula ?? "",
      persona_contacto: cliente?.persona_contacto ?? "",
      telefono: cliente?.telefono ?? "",
      email: cliente?.email ?? "",
      direccion: cliente?.direccion ?? "",
      limite_credito: cliente?.limite_credito ?? 0,
      notas: cliente?.notas ?? "",
      activo: cliente?.activo ?? true,
    },
  });

  const tipo = watch("tipo");
  const esEmpresa = tipo === "empresa";

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Tipo de cliente" htmlFor="tipo" error={errors.tipo?.message}>
          <Select id="tipo" {...register("tipo")}>
            <option value="empresa">Empresa</option>
            <option value="persona">Persona</option>
          </Select>
        </Campo>
        <Campo
          label={esEmpresa ? "Razón social" : "Nombre completo"}
          htmlFor="nombre"
          error={errors.nombre?.message}
        >
          <Input
            id="nombre"
            placeholder={esEmpresa ? "Ferretería Almonte, SRL" : "Juan Pérez"}
            {...register("nombre")}
          />
        </Campo>
      </div>

      <Controller
        control={control}
        name="rnc_cedula"
        render={({ field }) => (
          <Campo
            label={esEmpresa ? "RNC" : "Cédula"}
            htmlFor="rnc_cedula"
            error={errors.rnc_cedula?.message}
          >
            <Input
              id="rnc_cedula"
              inputMode="numeric"
              className="tabular-nums"
              placeholder={esEmpresa ? "1-30-11223-4" : "001-1234567-8"}
              value={field.value ?? ""}
              onChange={(e) =>
                field.onChange(
                  esEmpresa
                    ? mascaraRnc(e.target.value)
                    : mascaraCedula(e.target.value),
                )
              }
              onBlur={field.onBlur}
            />
          </Campo>
        )}
      />

      {/* Persona de contacto: solo empresas, con transición de altura/opacidad. */}
      <AnimatePresence initial={false}>
        {esEmpresa && (
          <motion.div
            key="persona-contacto"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <Campo
              label="Persona de contacto"
              htmlFor="persona_contacto"
              error={errors.persona_contacto?.message}
              className="pt-px"
            >
              <Input
                id="persona_contacto"
                placeholder="Ana Rodríguez — Compras"
                {...register("persona_contacto")}
              />
            </Campo>
          </motion.div>
        )}
      </AnimatePresence>

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
