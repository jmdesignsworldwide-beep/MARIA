"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, Trash2, ShieldCheck, Clock } from "lucide-react";
import { toast } from "sonner";
import { accesoDemoSchema, type AccesoDemoInput } from "@/lib/validations/ajustes";
import {
  crearAccesoDemo,
  alternarAccesoDemo,
  eliminarAccesoDemo,
  type AccesoDemo,
} from "@/lib/actions/accesos";
import { formatearFecha } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function AccesosDemo({ accesos }: { accesos: AccesoDemo[] }) {
  const router = useRouter();
  const [aEliminar, setAEliminar] = useState<AccesoDemo | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AccesoDemoInput>({
    resolver: zodResolver(accesoDemoSchema),
    defaultValues: { email: "", password: "", nombre: "", vencimiento: "15", fecha_custom: "" },
  });

  const vencimiento = watch("vencimiento");

  async function onSubmit(values: AccesoDemoInput) {
    const res = await crearAccesoDemo(values);
    if (!res.ok) return toast.error(res.error ?? "No se pudo crear.");
    toast.success("Cuenta demo creada.");
    reset();
    router.refresh();
  }

  async function alternar(a: AccesoDemo) {
    const res = await alternarAccesoDemo(a.id, !a.is_active);
    if (!res.ok) return toast.error(res.error ?? "No se pudo actualizar.");
    router.refresh();
  }

  async function eliminar() {
    if (!aEliminar) return;
    const res = await eliminarAccesoDemo(aEliminar.id);
    if (!res.ok) {
      toast.error(res.error ?? "No se pudo eliminar.");
      setAEliminar(null);
      return;
    }
    toast.success("Cuenta eliminada.");
    setAEliminar(null);
    router.refresh();
  }

  function estadoBadge(a: AccesoDemo) {
    if (!a.is_active) return <Badge variant="neutral">Inactiva</Badge>;
    if (a.access_expires_at && new Date(a.access_expires_at).getTime() < Date.now())
      return <Badge variant="danger">Vencida</Badge>;
    return <Badge variant="success">Activa</Badge>;
  }

  return (
    <div className="rounded-card border border-line bg-surface p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-accent" />
        <h2 className="font-display text-lg font-semibold">Accesos demo</h2>
        <Badge variant="accent" className="ml-1">Admin</Badge>
      </div>
      <p className="mb-5 text-sm text-muted">
        Crea cuentas de demostración con vencimiento. El sistema valida la vigencia en el
        servidor en cada acceso.
      </p>

      {/* Crear */}
      <form onSubmit={handleSubmit(onSubmit)} className="mb-6 rounded-card border border-line-soft bg-elevated/40 p-4" noValidate>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="a_email" className="mb-1.5 block">Correo</Label>
            <Input id="a_email" type="email" placeholder="demo@cliente.com" {...register("email")} />
            {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="a_pass" className="mb-1.5 block">Contraseña</Label>
            <Input id="a_pass" type="text" placeholder="Mínimo 8 caracteres" {...register("password")} />
            {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
          </div>
          <div>
            <Label htmlFor="a_nombre" className="mb-1.5 block">Nombre (opcional)</Label>
            <Input id="a_nombre" {...register("nombre")} />
          </div>
          <div>
            <Label htmlFor="a_venc" className="mb-1.5 block">Vencimiento</Label>
            <Select id="a_venc" {...register("vencimiento")}>
              <option value="7">7 días</option>
              <option value="15">15 días</option>
              <option value="30">30 días</option>
              <option value="custom">Fecha personalizada</option>
              <option value="sin">Sin vencimiento</option>
            </Select>
          </div>
          {vencimiento === "custom" && (
            <div>
              <Label htmlFor="a_fecha" className="mb-1.5 block">Fecha de vencimiento</Label>
              <Input id="a_fecha" type="date" {...register("fecha_custom")} />
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="submit" loading={isSubmitting}>
            <UserPlus className="h-4 w-4" />
            Crear acceso demo
          </Button>
        </div>
      </form>

      {/* Lista */}
      {accesos.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">Aún no hay cuentas demo.</p>
      ) : (
        <ul className="divide-y divide-line-soft">
          {accesos.map((a) => (
            <li key={a.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{a.email}</span>
                  {estadoBadge(a)}
                </div>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                  <Clock className="h-3 w-3" />
                  {a.access_expires_at ? `Vence ${formatearFecha(a.access_expires_at)}` : "Sin vencimiento"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={a.is_active} onCheckedChange={() => alternar(a)} />
                <button
                  type="button"
                  onClick={() => setAEliminar(a)}
                  aria-label="Eliminar"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-field text-muted transition-colors hover:bg-elevated hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!aEliminar}
        onClose={() => setAEliminar(null)}
        onConfirm={eliminar}
        title="Eliminar cuenta demo"
        description={`¿Eliminar la cuenta "${aEliminar?.email}"? Se borrará por completo.`}
      />
    </div>
  );
}
