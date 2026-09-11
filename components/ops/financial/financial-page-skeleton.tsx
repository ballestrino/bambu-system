import { OpsPageShell, OpsRecordSkeleton, opsSurface } from "@/components/ops/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const FinancialPageSkeleton = () => (
  <OpsPageShell>
    <div className={cn("space-y-2", opsSurface.headerAccent)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-48" />
    </div>
    <div className={cn(opsSurface.toolbar, "flex gap-2")}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton className="h-11 w-28" key={index} />
      ))}
    </div>
    <OpsRecordSkeleton count={3} />
  </OpsPageShell>
);
