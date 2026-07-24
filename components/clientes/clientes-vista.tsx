"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Building2,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import type { Cliente } from "@/lib/database.types";
import { formatearRD } from "@/lib/format";
import { eliminarCliente } from "@/lib/actions/clientes";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ClienteForm } from "@/components/clientes/cliente-form";

type Filtro = "todos" | "empresa" | "persona";

export function ClientesVista({ clientes }: { clientes: Cliente[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [aEliminar, setAEliminar] = useState<Cliente | null>(null);

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clientes.filter((c) => {
      if (filtro !== "todos" && c.tipo !== filtro) return false;
      if (!q) return true;
      return [c.nombre, c.rnc_cedula, c.telefono, c.email]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));
    });
  }, [clientes, query, filtro]);

  function nuevoCliente() {
    setEditando(null);
    setModalOpen(true);
  }
  function editarCliente(c: Cliente) {
    setEditando(c);
    setModalOpen(true);
  }
  function cerrarModal() {
    setModalOpen(false);
    setEditando(null);
  }
  function trasGuardar() {
    cerrarModal();
    router.refresh();
  }

  async function confirmarEliminar() {
    if (!aEliminar) return;
    const res = await eliminarCliente(aEliminar.id);
    if (!res.ok) {
      toast.error(res.error ?? "No se pudo eliminar.");
      setAEliminar(null);
      return;
    }
    toast.success("Cliente eliminado.");
    setAEliminar(null);
    router.refresh();
  }

  const filtros: { key: Filtro; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "empresa", label: "Empresas" },
    { key: "persona", label: "Personas" },
  ];

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Tu cartera de clientes con historial y rentabilidad."
        action={
          <Button onClick={nuevoCliente}>
            <Plus className="h-4 w-4" />
            Nuevo cliente
          </Button>
        }
      />

      {clientes.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aún no tienes clientes"
          description="Agrega tu primer cliente para empezar a cotizar y facturar."
          action={
            <Button onClick={nuevoCliente}>
              <Plus className="h-4 w-4" />
              Agregar cliente
            </Button>
          }
        />
      ) : (
        <>
          {/* Barra de herramientas */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre, RNC, teléfono…"
                className="pl-10"
                aria-label="Buscar clientes"
              />
            </div>
            <div className="inline-flex rounded-field border border-line bg-elevated p-0.5">
              {filtros.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFiltro(f.key)}
                  className={`rounded-[6px] px-3 py-1.5 text-xs font-medium transition-colors ${
                    filtro === f.key
                      ? "bg-accent text-accent-contrast"
                      : "text-muted hover:text-fg"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filtrados.length === 0 ? (
            <div className="rounded-card border border-dashed border-line bg-surface/50 px-6 py-14 text-center text-sm text-muted">
              No se encontraron clientes con esos criterios.
            </div>
          ) : (
            <>
              {/* Tabla (escritorio) */}
              <div className="hidden overflow-hidden rounded-card border border-line bg-surface md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                      <th className="px-4 py-3 font-medium">Cliente</th>
                      <th className="px-4 py-3 font-medium">Contacto</th>
                      <th className="px-4 py-3 font-medium">RNC / Cédula</th>
                      <th className="px-4 py-3 text-right font-medium">Límite crédito</th>
                      <th className="px-4 py-3 text-center font-medium">Estado</th>
                      <th className="px-4 py-3 text-right font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((c) => (
                      <tr
                        key={c.id}
                        className="border-b border-line-soft last:border-0 transition-colors hover:bg-elevated/50"
                      >
                        <td className="px-4 py-3">
                          <Link href={`/clientes/${c.id}`} className="group flex items-center gap-3">
                            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-field bg-elevated ring-1 ring-line">
                              {c.tipo === "empresa" ? (
                                <Building2 className="h-4 w-4 text-muted" />
                              ) : (
                                <User className="h-4 w-4 text-muted" />
                              )}
                            </span>
                            <span className="font-medium group-hover:text-accent">{c.nombre}</span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {c.telefono || c.email || "—"}
                        </td>
                        <td className="px-4 py-3 text-muted tabular-nums">
                          {c.rnc_cedula || "—"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatearRD(c.limite_credito)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {c.activo ? (
                            <Badge variant="success">Activo</Badge>
                          ) : (
                            <Badge variant="neutral">Inactivo</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <IconLink href={`/clientes/${c.id}`} label="Ver ficha">
                              <Eye className="h-4 w-4" />
                            </IconLink>
                            <IconBtn onClick={() => editarCliente(c)} label="Editar">
                              <Pencil className="h-4 w-4" />
                            </IconBtn>
                            <IconBtn onClick={() => setAEliminar(c)} label="Eliminar" danger>
                              <Trash2 className="h-4 w-4" />
                            </IconBtn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tarjetas (móvil) */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {filtrados.map((c) => (
                  <div key={c.id} className="rounded-card border border-line bg-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`/clientes/${c.id}`} className="flex items-center gap-3">
                        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-field bg-elevated ring-1 ring-line">
                          {c.tipo === "empresa" ? (
                            <Building2 className="h-5 w-5 text-muted" />
                          ) : (
                            <User className="h-5 w-5 text-muted" />
                          )}
                        </span>
                        <div>
                          <p className="font-medium">{c.nombre}</p>
                          <p className="text-xs text-muted">{c.telefono || c.email || "Sin contacto"}</p>
                        </div>
                      </Link>
                      {c.activo ? (
                        <Badge variant="success">Activo</Badge>
                      ) : (
                        <Badge variant="neutral">Inactivo</Badge>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-line-soft pt-3">
                      <span className="text-xs text-muted">
                        Crédito: <span className="tabular-nums text-fg">{formatearRD(c.limite_credito)}</span>
                      </span>
                      <div className="flex gap-1">
                        <IconLink href={`/clientes/${c.id}`} label="Ver ficha">
                          <Eye className="h-4 w-4" />
                        </IconLink>
                        <IconBtn onClick={() => editarCliente(c)} label="Editar">
                          <Pencil className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn onClick={() => setAEliminar(c)} label="Eliminar" danger>
                          <Trash2 className="h-4 w-4" />
                        </IconBtn>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={cerrarModal}
        title={editando ? "Editar cliente" : "Nuevo cliente"}
        description={editando ? undefined : "Agrega un cliente a tu cartera."}
        size="lg"
      >
        <ClienteForm
          key={editando?.id ?? "nuevo"}
          cliente={editando ?? undefined}
          onDone={trasGuardar}
          onCancel={cerrarModal}
        />
      </Modal>

      <ConfirmDialog
        open={!!aEliminar}
        onClose={() => setAEliminar(null)}
        onConfirm={confirmarEliminar}
        title="Eliminar cliente"
        description={`¿Seguro que deseas eliminar a "${aEliminar?.nombre}"? Esta acción no se puede deshacer.`}
      />
    </>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-field text-muted transition-colors hover:bg-elevated ${
        danger ? "hover:text-danger" : "hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}

function IconLink({
  children,
  href,
  label,
}: {
  children: React.ReactNode;
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-field text-muted transition-colors hover:bg-elevated hover:text-accent"
    >
      {children}
    </Link>
  );
}
