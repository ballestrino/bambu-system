"use client";

import { ScheduleBoard } from "@/components/ops/schedules/schedule-board";
import { useElementWidth } from "@/components/ops/visits/hooks/use-element-width";
import { useVisitsController } from "@/components/ops/visits/hooks/use-visits-controller";
import { VisitAgendaView } from "@/components/ops/visits/visit-agenda-view";
import { VisitDayView } from "@/components/ops/visits/visit-day-view";
import { VisitDialogs } from "@/components/ops/visits/visit-dialogs";
import { VisitsHeader } from "@/components/ops/visits/visits-header";
import { VisitsMobile } from "@/components/ops/visits/visits-mobile";

// Ancho del panel desde el que va el diseño de escritorio (3a). Se mide el
// panel y no la ventana: la barra lateral lo angosta.
const DESKTOP_MIN_WIDTH = 896;

// Visitas (feature 26, diseño "Visitas Bambu 3a-2a"). Hasta medir el panel se
// dibujan los dos diseños y el container query muestra uno; despues solo se
// monta el que corresponde, asi sus hojas y modales no se abren de mas.
export const VisitsPage = () => {
  const ctrl = useVisitsController();
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const { content, desk } = ctrl;
  const wide = width === null ? null : width >= DESKTOP_MIN_WIDTH;
  const countLabel = `${content.visits.length} de ${content.total} visitas`;

  return (
    <div className="@container/visits container flex w-full flex-col pb-8" ref={ref}>
      {wide !== false ? (
        <div className="hidden flex-col gap-4 @4xl/visits:flex">
          <VisitsHeader countLabel={countLabel} ctrl={ctrl} />
          {desk.view === "cron" ? (
            <ScheduleBoard initialDayKey={desk.dayKey} todayKey={desk.todayKey} />
          ) : desk.view === "dia" ? (
            <VisitDayView ctrl={ctrl} />
          ) : (
            <VisitAgendaView ctrl={ctrl} />
          )}
        </div>
      ) : null}
      {wide !== true ? (
        <div className="@4xl/visits:hidden">
          <VisitsMobile ctrl={ctrl} enabled={wide === false} />
        </div>
      ) : null}
      <VisitDialogs ctrl={ctrl} />
    </div>
  );
};
