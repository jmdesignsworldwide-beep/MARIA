"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, X, Loader2, Paperclip } from "lucide-react";
import { toast } from "sonner";
import {
  compraSchema,
  type CompraFormInput,
  type CompraInput,
} from "@/lib/validations/compra";
import { crearCompra } from "@/lib/actions/compras";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type Opcion = { id: string; nombre: string };
type FacturaOpcion = { id: string; numero: string };

export function CompraForm({
  ownerId,
  suplidores,
  facturas,
  onDone,
  onCancel,
}: {
  ownerId: string;
  suplidores: Opcion[];
  facturas: FacturaOpcion[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompraFormInput, unknown, CompraInput>({
    resolver: zodResolver(compraSchema),
    defaultValues: {
      suplidor_id: "",
      factura_id: null,
      descripcion: "",
      monto: 0,
      fecha: new Date().toISOString().slice(0, 10),
      metodo_pago: "efectivo",
      numero_comprobante: "",
    },
  });

  async function onSubmit(values: CompraInput) {
    let reciboPath: string | undefined;

    if (archivo) {
      setSubiendo(true);
      const supabase = createClient();
      const ext = (archivo.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${ownerId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("recibos")
        .upload(path, archivo, { upsert: false, contentType: archivo.type });
      setSubiendo(false);
      if (error) {
        toast.error(
          "No se pudo subir el recibo (¿almacenamiento configurado?). La compra no se guardó.",
        );
        return;
      }
      reciboPath = path;
    }

    const res = await crearCompra({ ...values, recibo_path: reciboPath });
    if (!res.ok) {
      toast.error(res.error ?? "No se pudo registrar la compra.");
      return;
    }
    toast.success("Compra registrada.");
    onDone();
  }

  const cargando = isSubmitting || subiendo;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="c_suplidor" className="mb-1.5 block">Suplidor</Label>
          <Select id="c_suplidor" {...register("suplidor_id")}>
            <option value="">Selecciona…</option>
            {suplidores.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </Select>
          {errors.suplidor_id && <p className="mt-1 text-xs text-danger">{errors.suplidor_id.message}</p>}
        </div>
        <div>
          <Label htmlFor="c_factura" className="mb-1.5 block">Factura (opcional)</Label>
          <Select id="c_factura" {...register("factura_id")}>
            <option value="">Sin factura</option>
            {facturas.map((f) => (
              <option key={f.id} value={f.id}>{f.numero}</option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="c_desc" className="mb-1.5 block">Descripción (opcional)</Label>
        <Input id="c_desc" placeholder="Compra de TV y aire para pedido…" {...register("descripcion")} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="c_monto" className="mb-1.5 block">Monto (RD$)</Label>
          <Input id="c_monto" inputMode="decimal" className="tabular-nums" {...register("monto")} />
          {errors.monto && <p className="mt-1 text-xs text-danger">{errors.monto.message}</p>}
        </div>
        <div>
          <Label htmlFor="c_fecha" className="mb-1.5 block">Fecha</Label>
          <Input id="c_fecha" type="date" {...register("fecha")} />
        </div>
        <div>
          <Label htmlFor="c_metodo" className="mb-1.5 block">Método</Label>
          <Select id="c_metodo" {...register("metodo_pago")}>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="cheque">Cheque</option>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="c_comprobante" className="mb-1.5 block">N.º de comprobante (opcional)</Label>
        <Input id="c_comprobante" placeholder="B1500001234" {...register("numero_comprobante")} />
      </div>

      {/* Foto del recibo */}
      <div>
        <Label className="mb-1.5 block">Foto del recibo (opcional)</Label>
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
            Subir foto o PDF del recibo
          </button>
        )}
      </div>

      <div className="sticky bottom-0 -mx-6 -mb-5 flex justify-end gap-3 border-t border-line bg-surface px-6 py-4">
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
            "Registrar compra"
          )}
        </Button>
      </div>
    </form>
  );
}
