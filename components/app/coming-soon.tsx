import { Hammer } from "lucide-react";
import { navItems } from "@/lib/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";

/**
 * Estado "en construcción" diseñado (Regla innegociable #4: nada de
 * pantallas en blanco). Cada módulo lo usa hasta que llegue su tanda.
 */
export function ComingSoon({ href }: { href: string }) {
  const item = navItems.find((i) => i.href === href);
  const label = item?.label ?? "Módulo";
  const descripcion = item?.descripcion;
  const tanda = item?.tanda;

  return (
    <>
      <PageHeader title={label} description={descripcion} />
      <div className="flex min-h-[52vh] flex-col items-center justify-center rounded-card border border-dashed border-line bg-surface/50 px-6 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft">
          <Hammer className="h-7 w-7 text-accent" aria-hidden />
        </div>
        <h2 className="mt-6 font-display text-xl font-semibold">
          En construcción
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted">
          Este módulo se construye por partes para cuidar cada detalle.
          {descripcion ? ` ${descripcion}` : ""}
        </p>
        {tanda && (
          <Badge variant="accent" className="mt-5">
            Llega en la Tanda {tanda}
          </Badge>
        )}
      </div>
    </>
  );
}
