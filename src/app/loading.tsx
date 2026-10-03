import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24" />
      <Skeleton className="h-64" />
    </div>
  );
}
