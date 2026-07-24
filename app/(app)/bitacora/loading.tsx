import { Skeleton } from "@/components/ui/skeleton";

export default function BitacoraLoading() {
  return (
    <div>
      <Skeleton className="mb-2 h-8 w-48" />
      <Skeleton className="mb-6 h-4 w-72" />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-card" />
        ))}
      </div>

      <Skeleton className="mb-4 h-16 w-full rounded-card" />

      <div className="space-y-6">
        {[0, 1].map((g) => (
          <div key={g}>
            <Skeleton className="mb-3 h-4 w-56" />
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-9 w-9 flex-none rounded-full" />
                  <Skeleton className="h-16 flex-1 rounded-card" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
