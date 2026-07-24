import { cn } from "@/lib/utils";

/**
 * Marca del negocio: logo de MCS Importaciones (PNG transparente, se ve
 * bien en modo claro y oscuro). Reemplaza el monograma anterior.
 */
export function Brand({
  className,
  size = "md",
}: {
  className?: string;
  // Se conserva en el tipo por compatibilidad con las llamadas existentes;
  // el logo ya incluye el nombre, así que no se renderiza texto aparte.
  showName?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  // Relación de aspecto del logo ≈ 2.51:1 (640×255).
  const alto = size === "lg" ? 56 : size === "sm" ? 26 : 34;
  const ancho = Math.round(alto * 2.51);

  return (
    <span className={cn("inline-flex items-center", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-importaciones.png"
        alt="MCS Importaciones"
        width={ancho}
        height={alto}
        style={{ height: alto, width: "auto" }}
        className="select-none"
        draggable={false}
      />
    </span>
  );
}
