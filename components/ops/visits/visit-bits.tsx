import type { OccurrenceStatus } from "@prisma/client";
import { TriangleAlert } from "lucide-react";

import {
  getOpsStatusConfig,
  opsAttention,
  opsOccurrenceStatus,
  opsToneClasses,
} from "@/components/ops/shared";
import { cn } from "@/lib/utils";

export const VisitStatusBadge = ({
  className,
  status,
}: {
  className?: string;
  status: OccurrenceStatus;
}) => {
  const config = getOpsStatusConfig(opsOccurrenceStatus, status);

  return (
    <span
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center rounded-full border px-2 text-[11.5px] font-semibold whitespace-nowrap",
        opsToneClasses[config.tone],
        className
      )}
    >
      {config.label}
    </span>
  );
};

export const VisitAttentionBadge = ({ className }: { className?: string }) => (
  <span
    className={cn(
      "inline-flex h-[22px] items-center gap-1 rounded-full border px-2 text-[11.5px] font-semibold whitespace-nowrap",
      opsAttention.chip,
      className
    )}
  >
    <TriangleAlert className="size-3" aria-hidden />
    Requiere atención
  </span>
);

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

// Iniciales de la empleada; "?" en ambar para la columna Sin asignar.
export const VisitAvatar = ({
  className,
  name,
  unassigned = false,
}: {
  className?: string;
  name: string;
  unassigned?: boolean;
}) => (
  <span
    aria-hidden
    className={cn(
      "flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
      unassigned ? opsAttention.chip : "bg-ops-bamboo-soft text-ops-bamboo-strong",
      className
    )}
  >
    {unassigned ? "?" : initials(name)}
  </span>
);

// Barra de carga de la empleada: horas trabajadas sobre un tope.
export const VisitLoadBar = ({
  className,
  max,
  minutes,
}: {
  className?: string;
  max: number;
  minutes: number;
}) => (
  <span className={cn("block h-[5px] overflow-hidden rounded-full bg-ops-surface-muted", className)}>
    <span
      className="block h-full rounded-full bg-ops-bamboo"
      style={{ width: `${Math.min(100, (minutes / 60 / max) * 100)}%` }}
    />
  </span>
);

// Leyenda de los puntos del mini mes.
export const VisitDotLegend = ({ className }: { className?: string }) => (
  <div className={cn("flex justify-center gap-2.5 text-[11px] text-ops-text-muted", className)}>
    <span className="flex items-center gap-1">
      <span className="size-1.5 rounded-full bg-ops-bamboo" />
      Programadas
    </span>
    <span className="flex items-center gap-1">
      <span className="size-1.5 rounded-full bg-emerald-500" />
      Realizadas
    </span>
    <span className="flex items-center gap-1">
      <span className="size-1.5 rounded-full bg-ops-amber" />
      Atención
    </span>
  </div>
);
