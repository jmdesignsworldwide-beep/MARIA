import { Skeleton } from "@/components/ui/skeleton";

/** Estado de carga con skeletons (Regla innegociable #5). */
export default function Loading() {
  return (
    <div className="animate-fade-in">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-40 w-full rounded-card" />
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-card" />
        ))}
      </div>
    </div>
  );
}
