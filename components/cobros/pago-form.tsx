"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  pagoSchema,
  type PagoFormInput,
  type PagoInput,
} from "@/lib/validations/pago";
import { registrarPago } from "@/lib/actions/pagos";
import { formatearRD } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function PagoForm({
  facturaId,
  saldo,
  onDone,
  onCancel,
}: {
  facturaId: string;
  saldo: number;
  onDone: () => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PagoFormInput, unknown, PagoInput>({
    resolver: zodResolver(pagoSchema),
    defaultValues: {
      factura_id: facturaId,
      monto: saldo > 0 ? saldo : 0,
      fecha: new Date().toISOString().slice(0, 10),
      metodo_pago: "transferencia",
      referencia: "",
      notas: "",
    },
  });

  async function onSubmit(values: PagoInput) {
    const res = await registrarPago(values);
    if (!res.ok) {
      toast.error(res.error ?? "No se pudo registrar el cobro.");
      return;
    }
    toast.success("Cobro registrado.");
    onDone();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <input type="hidden" {...register("factura_id")} />

      <div className="rounded-field border border-line bg-elevated/50 px-4 py-3 text-sm">
        Saldo pendiente:{" "}
        <span className="font-semibold tabular-nums text-warning">{formatearRD(saldo)}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="p_monto" className="mb-1.5 block">Monto a cobrar (RD$)</Label>
          <Input id="p_monto" inputMode="decimal" className="tabular-nums" {...register("monto")} />
          {errors.monto && <p className="mt-1 text-xs text-danger">{errors.monto.message}</p>}
        </div>
        <div>
          <Label htmlFor="p_fecha" className="mb-1.5 block">Fecha</Label>
          <Input id="p_fecha" type="date" {...register("fecha")} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="p_metodo" className="mb-1.5 block">Método</Label>
          <Select id="p_metodo" {...register("metodo_pago")}>
            <option value="transferencia">Transferencia</option>
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="cheque">Cheque</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="p_ref" className="mb-1.5 block">Referencia (opcional)</Label>
          <Input id="p_ref" placeholder="TRF-889001" {...register("referencia")} />
        </div>
      </div>

      <div>
        <Label htmlFor="p_notas" className="mb-1.5 block">Notas (opcional)</Label>
        <Textarea id="p_notas" placeholder="Detalle del cobro…" {...register("notas")} />
      </div>

      <div className="sticky bottom-0 -mx-6 -mb-5 flex justify-end gap-3 border-t border-line bg-surface px-6 py-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Registrar cobro
        </Button>
      </div>
    </form>
  );
}
