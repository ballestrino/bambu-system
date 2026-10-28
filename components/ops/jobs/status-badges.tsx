"use client";

import { Badge } from "@/components/ui/badge";
import {
  getOpsStatusConfig,
  opsJobStatus,
  opsOccurrenceStatus,
  opsToneClasses,
} from "@/components/ops/shared/ops-theme";
import { cn } from "@/lib/utils";

export const JobStatusBadge = ({ status }: { status: string }) => {
  const config = getOpsStatusConfig(opsJobStatus, status);

  return (
    <Badge variant="outline" className={cn("border", opsToneClasses[config.tone])}>
      {config.label}
    </Badge>
  );
};

const jobStatusDotClasses: Record<string, string> = {
  DRAFT: "bg-ops-text-muted/60",
  ACTIVE: "bg-ops-bamboo",
  PAUSED: "bg-amber-600 dark:bg-amber-400",
  COMPLETED: "bg-emerald-500",
  ARCHIVED: "bg-zinc-400",
};

// Píldora con punto de la tabla de Trabajos.
export const JobStatusPill = ({ status }: { status: string }) => {
  const config = getOpsStatusConfig(opsJobStatus, status);

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full border px-[9px] text-xs font-semibold whitespace-nowrap",
        opsToneClasses[config.tone]
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", jobStatusDotClasses[status] ?? "bg-ops-text-muted")} />
      {config.label}
    </span>
  );
};

export const OccurrenceStatusBadge = ({ status }: { status: string }) => {
  const config = getOpsStatusConfig(opsOccurrenceStatus, status);

  return (
    <Badge variant="outline" className={cn("border", opsToneClasses[config.tone])}>
      {config.label}
    </Badge>
  );
};
