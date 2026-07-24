import type { ReactNode } from "react";
import { FinanzasNav } from "@/components/finanzas/finanzas-nav";

export default function FinanzasLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <div className="mb-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Finanzas
        </h1>
        <p className="text-sm text-muted">
          Tu dinero de verdad: lo que entró, lo que salió y lo que queda.
        </p>
      </div>
      <FinanzasNav />
      {children}
    </div>
  );
}
