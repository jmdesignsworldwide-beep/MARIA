import type { ReactNode } from "react";

/** Encabezado de página consistente para todos los módulos. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted">{description}</p>
        )}
      </div>
      {action && <div className="flex-none">{action}</div>}
    </div>
  );
}
