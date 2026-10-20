"use client";

import type { VisitsController } from "@/components/ops/visits/hooks/use-visits-controller";
import { VisitAgendaList } from "@/components/ops/visits/visit-agenda-list";
import { VisitDayStates } from "@/components/ops/visits/visit-day-states";
import { VisitDayStrip } from "@/components/ops/visits/visit-day-strip";
import { VisitDetailPanel } from "@/components/ops/visits/visit-detail-panel";

// Agenda de escritorio (3a): tira de la semana, lista del dia y el panel fijo
// de la visita abierta a la derecha.
export const VisitAgendaView = ({ ctrl }: { ctrl: VisitsController }) => {
  const { desk } = ctrl;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <VisitDayStrip
        dayKey={desk.dayKey}
        month={desk.month}
        onPick={desk.goToDay}
        todayKey={desk.todayKey}
        totals={ctrl.data.totals}
      />
      <div className="grid h-[max(520px,calc(100dvh-22rem))] grid-cols-[minmax(0,1fr)_minmax(320px,400px)] gap-3.5">
        <VisitAgendaList
          content={ctrl.content}
          onAction={ctrl.act}
          onSelect={ctrl.select}
          selectedId={ctrl.selected?.id ?? null}
          states={<VisitDayStates ctrl={ctrl} />}
        />
        <section className="flex min-h-0 flex-col overflow-hidden rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface">
          <VisitDetailPanel ctrl={ctrl} />
        </section>
      </div>
    </div>
  );
};
