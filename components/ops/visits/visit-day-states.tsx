"use client";

import { Plus } from "lucide-react";

import type { VisitsController } from "@/components/ops/visits/hooks/use-visits-controller";
import { VisitDayEmpty, VisitDayError, VisitDaySkeleton } from "@/components/ops/visits/visit-day-state";

// Carga, error o dia vacio, segun en que punto este la consulta del mes.
export const VisitDayStates = ({ ctrl }: { ctrl: VisitsController }) => {
  const { body } = ctrl.content;

  if (body === "loading") return <VisitDaySkeleton />;
  if (body === "error") {
    return <VisitDayError isRetrying={ctrl.data.isFetching} onRetry={() => void ctrl.data.refetch()} />;
  }
  if (body !== "empty") return null;

  return (
    <VisitDayEmpty
      filtered={ctrl.hasFilters}
      newVisit={
        <button
          className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-ops-bamboo-strong px-4 text-[13.5px] font-semibold text-white hover:bg-ops-bamboo-strong/90 dark:text-ops-canvas"
          onClick={() => ctrl.newVisit()}
          type="button"
        >
          <Plus className="size-4" />
          Nueva visita
        </button>
      }
      onClearFilters={ctrl.desk.clearFilters}
      onToday={ctrl.desk.dayKey === ctrl.desk.todayKey ? undefined : ctrl.desk.goToToday}
    />
  );
};
