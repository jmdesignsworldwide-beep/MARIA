import Link from "next/link";
import { Brand } from "@/components/brand";
import { NavContent } from "@/components/app/nav-content";

/**
 * Barra lateral fija de escritorio (lg+). En móvil se oculta y su
 * contenido vive en el cajón del Topbar.
 */
export function Sidebar({ esAdmin = false }: { esAdmin?: boolean }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
      <div className="flex h-16 flex-none items-center border-b border-line px-5">
        <Link href="/dashboard" aria-label="Ir al panel">
          <Brand />
        </Link>
      </div>
      <div className="scrollbar-thin flex-1 overflow-y-auto">
        <NavContent esAdmin={esAdmin} />
      </div>
      <div className="flex-none border-t border-line px-5 py-3">
        <p className="text-[10px] text-muted">
          Versión demo · Grafito &amp; Ámbar · v19
        </p>
      </div>
    </aside>
  );
}
