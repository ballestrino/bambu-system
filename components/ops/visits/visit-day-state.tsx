"use client";

import type { ReactNode } from "react";
import { CalendarX2, CircleAlert, RefreshCw } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const outlineButton =
  "inline-flex h-10 items-center gap-2 rounded-[10px] border border-ops-border bg-ops-surface px-4 text-[13.5px] font-semibold text-ops-text hover:bg-ops-surface-muted disabled:opacity-60";

const StateFrame = ({
  actions,
  description,
  icon,
  title,
  tone,
}: {
  actions?: ReactNode;
  description: string;
  icon: ReactNode;
  title: string;
  tone: "danger" | "neutral";
}) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
    <span
      className={cn(
        "flex size-12 items-center justify-center rounded-[14px]",
        tone === "danger"
          ? "bg-red-50 text-red-800 dark:bg-red-500/15 dark:text-red-200"
          : "bg-ops-bamboo-soft text-ops-bamboo-strong"
      )}
    >
      {icon}
    </span>
    <div className="flex flex-col gap-1">
      <span className="text-base font-semibold text-ops-text">{title}</span>
      <span className="text-[13.5px] text-ops-text-muted">{description}</span>
    </div>
    {actions ? <div className="flex flex-wrap justify-center gap-2">{actions}</div> : null}
  </div>
);

// El mes no cargo: el dia no esta vacio, es desconocido.
export const VisitDayError = ({
  isRetrying,
  onRetry,
}: {
  isRetrying: boolean;
  onRetry: () => void;
}) => (
  <StateFrame
    actions={
      <button className={outlineButton} disabled={isRetrying} onClick={onRetry} type="button">
        <RefreshCw className={cn("size-4", isRetrying && "animate-spin")} />
        {isRetrying ? "Reintentando..." : "Reintentar"}
      </button>
    }
    description="Revisá la conexión y volvé a cargar las visitas del mes."
    icon={<CircleAlert className="size-[22px]" />}
    title="No pudimos cargar la agenda"
    tone="danger"
  />
);

export const VisitDayEmpty = ({
  filtered,
  newVisit,
  onClearFilters,
  onToday,
}: {
  filtered: boolean;
  newVisit?: ReactNode;
  onClearFilters: () => void;
  onToday?: () => void;
}) => (
  <StateFrame
    actions={
      <>
        {filtered ? (
          <button className={outlineButton} onClick={onClearFilters} type="button">
            Limpiar filtros
          </button>
        ) : (
          newVisit
        )}
        {onToday ? (
          <button className={outlineButton} onClick={onToday} type="button">
            Ir a hoy
          </button>
        ) : null}
      </>
    }
    description={filtered ? "Ninguna visita del día coincide con los filtros." : "Creá una visita o pasá a otro día."}
    icon={<CalendarX2 className="size-[22px]" />}
    title={filtered ? "Sin visitas con estos filtros" : "No hay visitas este día"}
    tone="neutral"
  />
);

export const VisitDaySkeleton = () => (
  <div className="flex flex-col gap-2.5 p-4" aria-busy>
    {Array.from({ length: 4 }, (_, index) => (
      <Skeleton className="h-14 w-full rounded-xl" key={index} />
    ))}
  </div>
);
