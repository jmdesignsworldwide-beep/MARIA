"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Search } from "lucide-react";
import { Brand } from "@/components/brand";
import { NavContent } from "@/components/app/nav-content";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UserMenu } from "@/components/app/user-menu";

/**
 * Barra superior. En móvil incluye el botón hamburguesa que abre el
 * cajón de navegación; en escritorio solo acompaña con acciones.
 */
export function Topbar({ email, nombreEmpresa }: { email: string; nombreEmpresa: string }) {
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const pathname = usePathname();

  // Cierra el cajón al navegar.
  useEffect(() => {
    setDrawerAbierto(false);
  }, [pathname]);

  // Bloquea el scroll del fondo con el cajón abierto.
  useEffect(() => {
    document.body.style.overflow = drawerAbierto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerAbierto]);

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-base/80 px-4 backdrop-blur lg:px-8">
        <button
          type="button"
          onClick={() => setDrawerAbierto(true)}
          aria-label="Abrir menú"
          className="inline-flex h-10 w-10 items-center justify-center rounded-field border border-line bg-elevated text-muted transition-colors hover:text-fg lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="lg:hidden">
          <Brand showName={false} />
        </div>

        {/* Buscador global (Cmd+K) */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("abrir-busqueda"))}
          className="ml-auto flex items-center gap-2 rounded-field border border-line bg-elevated px-3 py-2 text-sm text-muted transition-colors hover:border-accent/50 hover:text-fg lg:ml-6 lg:w-64 lg:justify-start"
          aria-label="Buscar"
        >
          <Search className="h-4 w-4 flex-none" />
          <span className="hidden lg:inline">Buscar…</span>
          <kbd className="ml-auto hidden rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted lg:inline">
            ⌘K
          </kbd>
        </button>

        <div className="flex items-center gap-2 lg:ml-2">
          <ThemeToggle />
          <UserMenu email={email} nombre={nombreEmpresa} />
        </div>
      </header>

      {/*
        Cajón de navegación móvil. Va FUERA del <header>: como el header usa
        backdrop-blur, se convierte en bloque contenedor de los elementos
        position:fixed y recortaba el cajón a la altura de la barra (bug del
        menú que "no cargaba nada"). Aquí se posiciona contra el viewport.
      */}
      <AnimatePresence>
        {drawerAbierto && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerAbierto(false)}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: "var(--overlay)" }}
              aria-hidden
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[82%] max-w-xs flex-col border-r border-line bg-surface lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Navegación"
            >
              <div className="flex h-16 flex-none items-center justify-between border-b border-line px-4">
                <Link href="/dashboard" aria-label="Ir al panel">
                  <Brand />
                </Link>
                <button
                  type="button"
                  onClick={() => setDrawerAbierto(false)}
                  aria-label="Cerrar menú"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-field text-muted transition-colors hover:text-fg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="scrollbar-thin flex-1 overflow-y-auto">
                <NavContent onNavigate={() => setDrawerAbierto(false)} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
