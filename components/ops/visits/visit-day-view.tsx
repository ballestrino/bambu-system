"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { formatMinuteOfDay } from "@/lib/ops/minute-ranges";
import { DEFAULT_OPS_TIMEZONE, getLocalDateTime } from "@/lib/ops/timezone";
import { formatDayLabel, shiftDayKey } from "@/lib/ops/visit-calendar";
import { useNow } from "@/components/ops/visits/hooks/use-now";
import type { VisitsController } from "@/components/ops/visits/hooks/use-visits-controller";
import { getDaySummary, VisitAttentionToggle } from "@/components/ops/visits/visit-agenda-list";
import { VisitAttentionList } from "@/components/ops/visits/visit-attention-list";
import { VisitDayStates } from "@/components/ops/visits/visit-day-states";
import { VisitDetailPanel } from "@/components/ops/visits/visit-detail-panel";
import { VisitMiniMonth } from "@/components/ops/visits/visit-mini-month";
import { VisitRegisterDialog } from "@/components/ops/visits/visit-register-dialog";
import { VisitTimeGrid } from "@/components/ops/visits/visit-time-grid";

const navButton =
  "flex size-8 items-center justify-center rounded-lg border border-ops-border hover:bg-ops-surface-muted";

// "Dia por empleada" (3a): mini mes y atencion a la izquierda, grilla horaria
// por empleada a la derecha y el detalle encima de la grilla.
export const VisitDayView = ({ ctrl }: { ctrl: VisitsController }) => {
  const { content, desk } = ctrl;
  const now = useNow();
  const isToday = desk.dayKey === desk.todayKey;
  const local = now ? getLocalDateTime(now, DEFAULT_OPS_TIMEZONE) : null;

  return (
    <div className="grid h-[max(560px,calc(100dvh-15rem))] grid-cols-[268px_minmax(0,1fr)] gap-4">
      <aside className="flex min-h-0 flex-col gap-3">
        <section className="rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface p-3.5">
          <VisitMiniMonth dayKey={desk.dayKey} month={desk.month} onPick={desk.goToDay} todayKey={desk.todayKey} totals={ctrl.data.totals} />
        </section>
        <VisitAttentionList
          onAssign={(visit) => desk.open(visit.id, "asignar")}
          onOpen={ctrl.select}
          visits={ctrl.dayAttention}
        />
      </aside>
      <section className="relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface">
        <header className="flex flex-none flex-wrap items-center gap-3 border-b border-ops-border px-4 py-3">
          <div className="flex gap-1">
            <button aria-label="Día anterior" className={navButton} onClick={() => desk.goToDay(shiftDayKey(desk.dayKey, -1))} type="button">
              <ChevronLeft className="size-4" />
            </button>
            <button aria-label="Día siguiente" className={navButton} onClick={() => desk.goToDay(shiftDayKey(desk.dayKey, 1))} type="button">
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="flex flex-col gap-px">
            <span className="text-[17px] font-semibold tracking-tight whitespace-nowrap text-ops-text">{formatDayLabel(desk.dayKey)}</span>
            <span className="text-[12.5px] whitespace-nowrap text-ops-text-muted">{getDaySummary(content)}</span>
          </div>
          {isToday ? null : (
            <button className="h-7 rounded-full bg-ops-bamboo-soft px-2.5 text-xs font-semibold text-ops-bamboo-strong" onClick={desk.goToToday} type="button">
              Hoy
            </button>
          )}
          <span className="flex-1" />
          <VisitAttentionToggle content={content} />
          {isToday && local ? (
            <span className="flex items-center gap-1.5 text-xs text-ops-text-muted tabular-nums">
              <span className="size-2 rounded-full bg-[#C0392B]" />
              Ahora {formatMinuteOfDay(local.hour * 60 + local.minute)}
            </span>
          ) : null}
        </header>
        {content.body === "list" ? (
          <VisitTimeGrid
            employees={ctrl.data.employees}
            now={isToday ? now : null}
            onAction={ctrl.act}
            onOpen={ctrl.select}
            selectedId={ctrl.selected?.id ?? null}
            visits={content.visits}
          />
        ) : (
          <VisitDayStates ctrl={ctrl} />
        )}
        {ctrl.selected ? (
          <div className="absolute inset-y-0 right-0 z-[6] flex w-[380px] max-w-full flex-col border-l border-ops-border bg-ops-surface shadow-[-16px_0_40px_rgb(24_37_29/0.12)]">
            <VisitDetailPanel ctrl={ctrl} onClose={desk.close} registerInline={false} />
          </div>
        ) : null}
      </section>
      <VisitRegisterDialog ctrl={ctrl} />
    </div>
  );
};
