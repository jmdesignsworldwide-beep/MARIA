import { cn } from "@/lib/utils";

/**
 * Marca de JM Facturación. Monograma "JM" en ámbar dentro de un
 * cuadro grafito, con el nombre en tipografía editorial.
 */
export function Brand({
  className,
  showName = true,
  size = "md",
}: {
  className?: string;
  showName?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const box = size === "lg" ? "h-11 w-11" : size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const mono = size === "lg" ? "text-lg" : "text-sm";
  const name = size === "lg" ? "text-xl" : "text-base";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "flex flex-none items-center justify-center rounded-field bg-gradient-to-br from-elevated to-surface shadow-soft",
          "ring-1 ring-line",
          box,
        )}
      >
        <span
          className={cn(
            "font-display font-semibold tracking-tight text-accent",
            mono,
          )}
        >
          JM
        </span>
      </div>
      {showName && (
        <div className="flex flex-col leading-none">
          <span
            className={cn("font-display font-semibold tracking-tight", name)}
          >
            JM Facturación
          </span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
            Control financiero
          </span>
        </div>
      )}
    </div>
  );
}
