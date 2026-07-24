import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { Suplidor, MetodoPago } from "@/lib/database.types";
import { ComprasVista, type CompraRow } from "@/components/compras/compras-vista";

export const metadata: Metadata = { title: "Compras" };

type CompraQuery = {
  id: string;
  descripcion: string | null;
  monto: number;
  fecha: string;
  metodo_pago: MetodoPago;
  numero_comprobante: string | null;
  recibo_path: string | null;
  factura_id: string | null;
  suplidor: { nombre: string } | null;
  factura: { numero: string } | null;
};

export default async function ComprasPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const primerDiaMes = new Date();
  primerDiaMes.setDate(1);
  const inicioMes = primerDiaMes.toISOString().slice(0, 10);

  const [comprasRes, suplidoresRes, facturasRes, alertasRes] = await Promise.all([
    supabase
      .from("compras")
      .select(
        "id, descripcion, monto, fecha, metodo_pago, numero_comprobante, recibo_path, factura_id, suplidor:suplidores(nombre), factura:facturas(numero)",
      )
      .order("fecha", { ascending: false }),
    supabase.from("suplidores").select("*").order("nombre"),
    supabase
      .from("facturas")
      .select("id, numero")
      .neq("estado", "anulada")
      .order("numero", { ascending: false }),
    supabase
      .from("facturas")
      .select("id, numero")
      .eq("costo_total", 0)
      .in("estado", ["emitida", "cobrada_parcial", "cobrada", "vencida"])
      .order("numero", { ascending: false }),
  ]);

  const comprasQuery = (comprasRes.data as unknown as CompraQuery[] | null) ?? [];
  const compras: CompraRow[] = comprasQuery.map((c) => ({
    id: c.id,
    suplidor_nombre: c.suplidor?.nombre ?? "Suplidor",
    factura_id: c.factura_id,
    factura_numero: c.factura?.numero ?? null,
    descripcion: c.descripcion,
    monto: Number(c.monto),
    fecha: c.fecha,
    metodo_pago: c.metodo_pago,
    numero_comprobante: c.numero_comprobante,
    recibo_path: c.recibo_path,
  }));

  // Resumen del mes por suplidor.
  const mapaMes = new Map<string, number>();
  compras
    .filter((c) => c.fecha >= inicioMes)
    .forEach((c) => {
      mapaMes.set(c.suplidor_nombre, (mapaMes.get(c.suplidor_nombre) ?? 0) + c.monto);
    });
  const resumenMensual = Array.from(mapaMes.entries())
    .map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total);

  const facturasOpciones = ((facturasRes.data as { id: string; numero: string }[] | null) ?? []).map(
    (f) => ({ id: f.id, numero: f.numero }),
  );
  const alertas = ((alertasRes.data as { id: string; numero: string }[] | null) ?? []).map((f) => ({
    id: f.id,
    numero: f.numero,
  }));

  return (
    <ComprasVista
      ownerId={user.id}
      compras={compras}
      suplidores={(suplidoresRes.data as Suplidor[] | null) ?? []}
      facturasOpciones={facturasOpciones}
      resumenMensual={resumenMensual}
      alertas={alertas}
    />
  );
}
