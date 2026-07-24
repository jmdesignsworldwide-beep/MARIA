"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Users,
  ReceiptText,
  FileText,
  Package,
  CornerDownLeft,
  Loader2,
} from "lucide-react";
import { buscarGlobal, type ResultadoBusqueda } from "@/lib/actions/buscar";

type Item = {
  id: string;
  grupo: string;
  icono: typeof Users;
  titulo: string;
  sub: string;
  href: string;
};

const VACIO: ResultadoBusqueda = { clientes: [], facturas: [], cotizaciones: [], productos: [] };

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [res, setRes] = useState<ResultadoBusqueda>(VACIO);
  const [cargando, setCargando] = useState(false);
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Atajos globales: Cmd/Ctrl+K y evento del botón del topbar.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    function onAbrir() {
      setOpen(true);
    }
    document.addEventListener("keydown", onKey);
    window.addEventListener("abrir-busqueda", onAbrir);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("abrir-busqueda", onAbrir);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 40);
    } else {
      setQuery("");
      setRes(VACIO);
      setSel(0);
    }
  }, [open]);

  // Búsqueda con debounce.
  useEffect(() => {
    if (query.trim().length < 2) {
      setRes(VACIO);
      return;
    }
    setCargando(true);
    const t = setTimeout(async () => {
      const r = await buscarGlobal(query);
      setRes(r);
      setCargando(false);
      setSel(0);
    }, 220);
    return () => clearTimeout(t);
  }, [query]);

  const items: Item[] = useMemo(() => {
    return [
      ...res.clientes.map((c) => ({
        id: `c${c.id}`, grupo: "Clientes", icono: Users,
        titulo: c.nombre, sub: c.tipo === "empresa" ? "Empresa" : "Persona", href: `/clientes/${c.id}`,
      })),
      ...res.facturas.map((f) => ({
        id: `f${f.id}`, grupo: "Facturas", icono: ReceiptText,
        titulo: f.numero, sub: f.estado, href: `/facturas/${f.id}`,
      })),
      ...res.cotizaciones.map((c) => ({
        id: `q${c.id}`, grupo: "Cotizaciones", icono: FileText,
        titulo: c.numero, sub: c.estado, href: `/cotizaciones/${c.id}`,
      })),
      ...res.productos.map((p) => ({
        id: `p${p.id}`, grupo: "Catálogo", icono: Package,
        titulo: p.descripcion, sub: p.tipo, href: "/catalogo",
      })),
    ];
  }, [res]);

  const irA = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && items[sel]) {
      e.preventDefault();
      irA(items[sel].href);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="absolute inset-0"
            style={{ background: "var(--overlay)", backdropFilter: "blur(3px)" }}
          />
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-modal border border-line bg-elevated shadow-elevated"
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="h-5 w-5 flex-none text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Buscar clientes, facturas, cotizaciones, productos…"
                className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-muted"
              />
              {cargando && <Loader2 className="h-4 w-4 flex-none animate-spin text-muted" />}
            </div>

            <div className="scrollbar-thin max-h-[52vh] overflow-y-auto p-2">
              {query.trim().length < 2 ? (
                <p className="px-3 py-8 text-center text-sm text-muted">
                  Escribe para buscar en todo el sistema.
                </p>
              ) : items.length === 0 && !cargando ? (
                <p className="px-3 py-8 text-center text-sm text-muted">Sin resultados.</p>
              ) : (
                items.map((it, i) => {
                  const Icon = it.icono;
                  const activo = i === sel;
                  const primeroDelGrupo = i === 0 || items[i - 1]?.grupo !== it.grupo;
                  return (
                    <div key={it.id}>
                      {primeroDelGrupo && (
                        <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
                          {it.grupo}
                        </p>
                      )}
                      <button
                        type="button"
                        onMouseEnter={() => setSel(i)}
                        onClick={() => irA(it.href)}
                        className={`flex w-full items-center gap-3 rounded-field px-3 py-2 text-left text-sm transition-colors ${
                          activo ? "bg-accent-soft text-fg" : "text-fg hover:bg-surface"
                        }`}
                      >
                        <Icon className={`h-4 w-4 flex-none ${activo ? "text-accent" : "text-muted"}`} />
                        <span className="min-w-0 flex-1 truncate">{it.titulo}</span>
                        <span className="flex-none text-xs capitalize text-muted">{it.sub}</span>
                        {activo && <CornerDownLeft className="h-3.5 w-3.5 flex-none text-muted" />}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
