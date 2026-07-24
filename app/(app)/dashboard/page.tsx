import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { navItems } from "@/lib/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Panel",
};

function saludo(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default async function DashboardPage() {
  const user = await requireUser();
  const nombre = user.email?.split("@")[0] ?? "";

  return (
    <>
      <PageHeader
        title={`${saludo()}${nombre ? `, ${nombre}` : ""}`}
        description="Tu sistema está tomando forma. Este es el recorrido de lo que viene."
      />

      {/* Tarjeta de bienvenida */}
      <div className="relative overflow-hidden rounded-card border border-line bg-surface p-6 shadow-card sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full"
          style={{
            background:
              "radial-gradient(circle, var(--accent-soft) 0%, transparent 70%)",
          }}
        />
        <Badge variant="accent" className="mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          Tanda 2 · Diseño y acceso
        </Badge>
        <h2 className="max-w-xl font-display text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          El sistema de diseño «Grafito &amp; Ámbar» ya está en pie.
        </h2>
        <p className="mt-3 max-w-xl text-sm text-muted">
          Autenticación segura, modo claro y oscuro impecables, y la
          estructura base lista. El panel financiero con KPIs y gráficos
          llega en la Tanda 11.
        </p>
      </div>

      {/* Recorrido de módulos */}
      <h3 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-muted">
        Módulos del sistema
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {navItems
          .filter((i) => i.href !== "/dashboard")
          .map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col gap-3 rounded-card border border-line bg-surface p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-card"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-field bg-elevated ring-1 ring-line transition-colors group-hover:bg-accent-soft">
                    <Icon className="h-5 w-5 text-accent" aria-hidden />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted transition-colors group-hover:text-accent" />
                </div>
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="mt-1 text-xs text-muted">{item.descripcion}</p>
                </div>
              </Link>
            );
          })}
      </div>
    </>
  );
}
