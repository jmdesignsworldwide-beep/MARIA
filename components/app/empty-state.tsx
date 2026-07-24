import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Estado vacío diseñado con ilustración de icono y llamada a la acción. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-line bg-surface/50 px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft">
        <Icon className="h-7 w-7 text-accent" aria-hidden />
      </div>
      <h3 className="mt-6 font-display text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
