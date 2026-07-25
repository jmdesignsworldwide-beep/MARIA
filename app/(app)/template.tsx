import type { ReactNode } from "react";

/**
 * Template: se re-monta en cada navegación, así que reactiva la animación
 * de entrada (fade + leve desplazamiento). Sutil y rápida — respeta
 * prefers-reduced-motion vía globals.css.
 */
export default function AppTemplate({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
