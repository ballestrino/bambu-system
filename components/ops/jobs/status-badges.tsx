"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const jobStatusStyles: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PAUSED: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-sky-100 text-sky-700",
  ARCHIVED: "bg-zinc-200 text-zinc-700",
};

const occurrenceStatusStyles: Record<string, string> = {
  SCHEDULED: "bg-slate-100 text-slate-700",
  DONE: "bg-emerald-100 text-emerald-700",
  SKIPPED: "bg-amber-100 text-amber-700",
  CANCELED: "bg-rose-100 text-rose-700",
};

export const JobStatusBadge = ({ status }: { status: string }) => (
  <Badge className={cn("border-0", jobStatusStyles[status] ?? "bg-muted text-foreground")}>
    {status}
  </Badge>
);

export const OccurrenceStatusBadge = ({ status }: { status: string }) => (
  <Badge
    className={cn(
      "border-0",
      occurrenceStatusStyles[status] ?? "bg-muted text-foreground"
    )}
  >
    {status}
  </Badge>
);
