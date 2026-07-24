import { cn } from "@/lib/utils";

/**
 * Skeleton de carga (Regla innegociable #5: nunca un spinner solo).
 * Efecto shimmer suave acorde al tema.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-field bg-elevated",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer",
        "after:bg-gradient-to-r after:from-transparent after:via-white/5 after:to-transparent",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
