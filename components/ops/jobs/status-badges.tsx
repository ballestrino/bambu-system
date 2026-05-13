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

export const OccurrenceStatusBadge = ({ status }: { status: string }) => {
  const config = getOpsStatusConfig(opsOccurrenceStatus, status);

  return (
    <Badge variant="outline" className={cn("border", opsToneClasses[config.tone])}>
      {config.label}
    </Badge>
  );
};
