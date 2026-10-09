"use client";

import { ScheduleBoard } from "@/components/ops/schedules/schedule-board";
import { useVisitsController } from "@/components/ops/visits/hooks/use-visits-controller";
import { VisitAgendaView } from "@/components/ops/visits/visit-agenda-view";
import { VisitDayView } from "@/components/ops/visits/visit-day-view";
import { VisitDialogs } from "@/components/ops/visits/visit-dialogs";
import { VisitsHeader } from "@/components/ops/visits/visits-header";

// Visitas (feature 26, diseño "Visitas Bambu 3a-2a").
export const VisitsPage = () => {
  const ctrl = useVisitsController();
  const { content, desk } = ctrl;
  const countLabel = `${content.visits.length} de ${content.total} visitas`;

  return (
    <div className="@container/visits container flex w-full flex-col gap-4 pb-8">
      <VisitsHeader countLabel={countLabel} ctrl={ctrl} />
      {desk.view === "cron" ? (
        <ScheduleBoard initialDayKey={desk.dayKey} todayKey={desk.todayKey} />
      ) : desk.view === "dia" ? (
        <VisitDayView ctrl={ctrl} />
      ) : (
        <VisitAgendaView ctrl={ctrl} />
      )}
      <VisitDialogs ctrl={ctrl} />
    </div>
  );
};
