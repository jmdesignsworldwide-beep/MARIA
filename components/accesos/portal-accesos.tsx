"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  KeyRound,
  UserPlus,
  RefreshCw,
  Trash2,
  Power,
  Clock,
  Copy,
  Wand2,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  crearCuentaSchema,
  type CrearCuentaFormInput,
  type CrearCuentaInput,
} from "@/lib/validations/acceso";
import {
  crearCuenta,
  renovarCuenta,
  alternarCuenta,
  eliminarCuenta,
  quitarVencimiento,
  type CuentaCliente,
} from "@/lib/actions/accesos";
import { formatearFecha } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const ESTADO_META: Record<
  CuentaCliente["estado"],
  { label: string; variant: "success" | "warning" | "danger" | "neutral" | "info" }
> = {
  activa: { label: "Activa", variant: "success" },
  por_vencer: { label: "Por vencer", variant: "warning" },
  vencida: { label: "Vencida", variant: "danger" },
  inactiva: { label: "Inactiva", variant: "neutral" },
  sin_vencimiento: { label: "Sin vencimiento", variant: "info" },
};

function generarClave(): string {
  const abc = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  const arr = new Uint32Array(10);
  crypto.getRandomValues(arr);
  for (let i = 0; i < 10; i++) s += abc[arr[i]! % abc.length];
  return s;
}

export function PortalAccesos({ cuentas }: { cuentas: CuentaCliente[] }) {
  const router = useRouter();
  const [crearOpen, setCrearOpen] = useState(false);
  const [renovando, setRenovando] = useState<CuentaCliente | null>(null);
  const [aEliminar, setAEliminar] = useState<CuentaCliente | null>(null);

  return (
    <>
      <PageHeader
        title="Portal de accesos"
        description="Crea y administra las cuentas de cliente con acceso temporal."
        action={
          <Button onClick={() => setCrearOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Nueva cuenta
          </Button>
        }
      />

      {cuentas.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title="Aún no hay cuentas"
          description="Crea la primera cuenta de cliente con su usuario, contraseña y días de acceso."
          action={
            <Button onClick={() => setCrearOpen(true)}>
              <UserPlus className="h-4 w-4" />
              Crear cuenta
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {cuentas.map((c) => (
            <CuentaFila
              key={c.id}
              cuenta={c}
              onRenovar={() => setRenovando(c)}
              onAlternar={async () => {
                const res = await alternarCuenta(c.id, !c.is_active);
                if (!res.ok) return toast.error(res.error ?? "No se pudo actualizar.");
                toast.success(c.is_active ? "Cuenta desactivada." : "Cuenta reactivada.");
                router.refresh();
              }}
              onEliminar={() => setAEliminar(c)}
            />
          ))}
        </div>
      )}

      <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
        <ShieldCheck className="h-3.5 w-3.5" />
        Solo el administrador ve este portal. Cada acción queda registrada en la bitácora.
      </p>

      <CrearCuentaModal open={crearOpen} onClose={() => setCrearOpen(false)} onDone={() => router.refresh()} />
      <RenovarModal
        cuenta={renovando}
        onClose={() => setRenovando(null)}
        onDone={() => router.refresh()}
      />
      <ConfirmDialog
        open={!!aEliminar}
        onClose={() => setAEliminar(null)}
        onConfirm={async () => {
          if (!aEliminar) return;
          const res = await eliminarCuenta(aEliminar.id);
          setAEliminar(null);
          if (!res.ok) {
            toast.error(res.error ?? "No se pudo eliminar.");
            return;
          }
          toast.success("Cuenta eliminada.");
          router.refresh();
        }}
        title="Eliminar cuenta"
        description="Se eliminará la cuenta y su acceso por completo. Esta acción queda registrada en la bitácora y no se puede deshacer."
      />
    </>
  );
}

function CuentaFila({
  cuenta,
  onRenovar,
  onAlternar,
  onEliminar,
}: {
  cuenta: CuentaCliente;
  onRenovar: () => void;
  onAlternar: () => void;
  onEliminar: () => void;
}) {
  const meta = ESTADO_META[cuenta.estado];
  const dias = cuenta.dias_restantes;
  const tono =
    cuenta.estado === "vencida"
      ? "text-danger"
      : cuenta.estado === "por_vencer"
        ? "text-warning"
        : "text-fg";

  return (
    <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{cuenta.usuario}</span>
          <Badge variant={meta.variant}>{meta.label}</Badge>
        </div>
        <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted">
          <Building2 className="h-3.5 w-3.5 flex-none" />
          {cuenta.negocio ?? "—"}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          {cuenta.access_expires_at === null ? (
            <span className="text-sm text-muted">Sin vencimiento</span>
          ) : (
            <>
              <p className={`text-sm font-semibold tabular-nums ${tono}`}>
                {dias !== null && dias <= 0
                  ? "Vencida"
                  : `${dias} día${dias === 1 ? "" : "s"}`}
              </p>
              <p className="text-xs text-muted tabular-nums">
                {formatearFecha(cuenta.access_expires_at)}
              </p>
            </>
          )}
        </div>

        <div className="flex gap-1">
          <button
            type="button"
            onClick={onRenovar}
            aria-label="Renovar / extender"
            title="Renovar / extender"
            className="inline-flex h-8 w-8 items-center justify-center rounded-field text-muted transition-colors hover:bg-elevated hover:text-fg"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onAlternar}
            aria-label={cuenta.is_active ? "Desactivar" : "Reactivar"}
            title={cuenta.is_active ? "Desactivar" : "Reactivar"}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-field transition-colors hover:bg-elevated ${
              cuenta.is_active ? "text-muted hover:text-warning" : "text-success"
            }`}
          >
            <Power className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onEliminar}
            aria-label="Eliminar"
            title="Eliminar"
            className="inline-flex h-8 w-8 items-center justify-center rounded-field text-muted transition-colors hover:bg-elevated hover:text-danger"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

const DURACIONES = [
  { v: "7", t: "7 días" },
  { v: "15", t: "15 días" },
  { v: "30", t: "30 días" },
  { v: "sin", t: "Sin vencimiento" },
  { v: "custom", t: "Personalizado" },
] as const;

function CrearCuentaModal({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CrearCuentaFormInput, unknown, CrearCuentaInput>({
    resolver: zodResolver(crearCuentaSchema),
    defaultValues: { usuario: "", negocio: "", password: "", vencimiento: "15", dias_custom: undefined },
  });

  const venc = watch("vencimiento");
  const pass = watch("password");

  async function onSubmit(values: CrearCuentaInput) {
    const res = await crearCuenta(values);
    if (!res.ok) return toast.error(res.error ?? "No se pudo crear la cuenta.");
    toast.success("Cuenta creada.");
    reset();
    onClose();
    onDone();
  }

  return (
    <Modal open={open} onClose={onClose} title="Nueva cuenta de cliente" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="usuario" className="mb-1.5 block">Usuario</Label>
            <Input id="usuario" placeholder="mcs-importaciones" autoCapitalize="none" {...register("usuario")} />
            {errors.usuario && <p className="mt-1 text-xs text-danger">{errors.usuario.message}</p>}
          </div>
          <div>
            <Label htmlFor="negocio" className="mb-1.5 block">Nombre del negocio</Label>
            <Input id="negocio" placeholder="MCS Importaciones" {...register("negocio")} />
            {errors.negocio && <p className="mt-1 text-xs text-danger">{errors.negocio.message}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="password" className="mb-1.5 block">Contraseña</Label>
          <div className="flex gap-2">
            <Input id="password" autoCapitalize="none" {...register("password")} />
            <Button type="button" variant="secondary" size="sm" onClick={() => setValue("password", generarClave(), { shouldValidate: true })}>
              <Wand2 className="h-4 w-4" />
              Generar
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                if (pass) {
                  navigator.clipboard?.writeText(pass);
                  toast.success("Contraseña copiada.");
                }
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
        </div>

        <div>
          <Label className="mb-1.5 block">Días de acceso</Label>
          <div className="flex flex-wrap gap-2">
            {DURACIONES.map((d) => (
              <button
                key={d.v}
                type="button"
                onClick={() => setValue("vencimiento", d.v, { shouldValidate: true })}
                className={`rounded-field border px-3 py-1.5 text-sm font-medium transition-colors ${
                  venc === d.v
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-line text-muted hover:text-fg"
                }`}
              >
                {d.t}
              </button>
            ))}
          </div>
          {venc === "custom" && (
            <div className="mt-3">
              <Label htmlFor="dias_custom" className="mb-1.5 block">Número de días</Label>
              <Input
                id="dias_custom"
                inputMode="numeric"
                placeholder="Ej.: 45"
                className="w-40 tabular-nums"
                {...register("dias_custom")}
              />
              {errors.dias_custom && <p className="mt-1 text-xs text-danger">{errors.dias_custom.message}</p>}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 -mx-6 -mb-5 flex justify-end gap-3 border-t border-line bg-surface px-6 py-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
          <Button type="submit" loading={isSubmitting}>Crear cuenta</Button>
        </div>
      </form>
    </Modal>
  );
}

function RenovarModal({
  cuenta,
  onClose,
  onDone,
}: {
  cuenta: CuentaCliente | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [dias, setDias] = useState<string>("30");
  const [guardando, setGuardando] = useState(false);

  async function renovar(valor: number) {
    if (!cuenta) return;
    setGuardando(true);
    const res = await renovarCuenta(cuenta.id, { dias: valor });
    setGuardando(false);
    if (!res.ok) return toast.error(res.error ?? "No se pudo renovar.");
    toast.success(`Cuenta renovada por ${valor} día(s).`);
    onClose();
    onDone();
  }

  async function sinVencimiento() {
    if (!cuenta) return;
    setGuardando(true);
    const res = await quitarVencimiento(cuenta.id);
    setGuardando(false);
    if (!res.ok) return toast.error(res.error ?? "No se pudo actualizar.");
    toast.success("Cuenta sin vencimiento.");
    onClose();
    onDone();
  }

  return (
    <Modal open={!!cuenta} onClose={onClose} title="Renovar / extender acceso" size="md">
      {cuenta && (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Cuenta <span className="font-semibold text-fg">{cuenta.usuario}</span> ({cuenta.negocio}).
            {cuenta.access_expires_at
              ? ` Vence el ${formatearFecha(cuenta.access_expires_at)}.`
              : " Sin vencimiento."}
          </p>

          <div className="flex flex-wrap gap-2">
            {[7, 15, 30].map((d) => (
              <Button key={d} variant="secondary" size="sm" onClick={() => renovar(d)} disabled={guardando}>
                <Clock className="h-4 w-4" />
                +{d} días
              </Button>
            ))}
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="dias_renovar" className="mb-1.5 block">Días personalizados</Label>
              <Input
                id="dias_renovar"
                inputMode="numeric"
                value={dias}
                onChange={(e) => setDias(e.target.value)}
                className="tabular-nums"
              />
            </div>
            <Button onClick={() => renovar(Number(dias) || 0)} loading={guardando}>Aplicar</Button>
          </div>

          <button
            type="button"
            onClick={sinVencimiento}
            disabled={guardando}
            className="text-xs text-muted underline-offset-2 transition-colors hover:text-fg hover:underline"
          >
            Dejar esta cuenta sin vencimiento
          </button>
        </div>
      )}
    </Modal>
  );
}
