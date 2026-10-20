"use client";

import type { ReactNode } from "react";
import { TriangleAlert, X } from "lucide-react";

import { formatDayLabel } from "@/lib/ops/visit-calendar";
import { groupVisitsByHour, plural } from "@/lib/ops/visit-day";
import { opsAttention } from "@/components/ops/shared";
import type { OpsOccurrence } from "@/components/ops/types";
import { VisitAgendaRow } from "@/components/ops/visits/visit-agenda-row";
import type { VisitActionKind } from "@/components/ops/visits/visit-view-model";
import { cn } from "@/lib/utils";

export type VisitDayContent = {
  attentionCount: number;
  attentionOnly: boolean;
  body: "empty" | "error" | "list" | "loading";
  dayKey: string;
  onToggleAttention: () => void;
  total: number;
  visits: OpsOccurrence[];
};

export const getDaySummary = ({ attentionCount, attentionOnly, body, total, visits }: VisitDayContent) => {
  if (body === "error") return "No se cargaron las visitas";
  if (body === "loading") return "Cargando visitas...";
  if (!total) return "Sin visitas";
  if (attentionOnly) return `${visits.length} de ${plural(total, "visita")}`;
  return attentionCount
    ? `${plural(total, "visita")} · ${attentionCount} requiere${attentionCount === 1 ? "" : "n"} atención`
    : plural(total, "visita");
};

export const VisitAttentionToggle = ({ content }: { content: VisitDayContent }) =>
  content.attentionCount || content.attentionOnly ? (
    <button
      aria-pressed={content.attentionOnly}
      className={cn(
        "inline-flex h-[30px] shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-semibold whitespace-nowrap",
        opsAttention.chip,
        content.attentionOnly && "border-ops-amber bg-amber-100 dark:bg-amber-500/25"
      )}
      onClick={content.onToggleAttention}
      type="button"
    >
      <TriangleAlert className="size-[13px]" />
      {content.attentionOnly ? "Solo requieren atención" : `${content.attentionCount} requiere${content.attentionCount === 1 ? "" : "n"} atención`}
      {content.attentionOnly ? <X className="size-[13px]" /> : null}
    </button>
  ) : null;

// Lista del dia de la Agenda (3a): linea de tiempo agrupada por hora.
export const VisitAgendaList = ({
  content,
  onAction,
  onSelect,
  selectedId,
  states,
}: {
  content: VisitDayContent;
  onAction: (visit: OpsOccurrence, kind: VisitActionKind) => void;
  onSelect: (visit: OpsOccurrence) => void;
  selectedId: string | null;
  states: ReactNode;
}) => (
  <section className="flex min-h-0 flex-col overflow-hidden rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface">
    <header className="flex flex-none flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-ops-surface-muted px-[18px] py-3">
      <span className="text-base font-semibold text-ops-text">{formatDayLabel(content.dayKey)}</span>
      <span className="text-[13px] text-ops-text-muted">{getDaySummary(content)}</span>
      <span className="flex-1" />
      <VisitAttentionToggle content={content} />
    </header>
    {content.body === "list" ? (
      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pt-3.5 pb-[18px]">
        {groupVisitsByHour(content.visits).map((group) => (
          <div className="grid grid-cols-[56px_minmax(0,1fr)] gap-3.5" key={group.hour}>
            <div className="flex flex-col gap-0.5 pt-3 text-right">
              <span className="text-[13px] font-semibold text-ops-text tabular-nums">{group.label}</span>
              <span className="text-[11px] text-ops-text-muted">{plural(group.items.length, "visita")}</span>
            </div>
            <div className="relative flex flex-col gap-2 border-l border-ops-border pb-3.5 pl-[18px]">
              <span className="absolute top-[15px] -left-[5px] size-[9px] rounded-full bg-ops-bamboo ring-3 ring-ops-surface" />
              {group.items.map((visit) => (
                <VisitAgendaRow
                  key={visit.id}
                  onAction={(kind) => onAction(visit, kind)}
                  onSelect={() => onSelect(visit)}
                  selected={visit.id === selectedId}
                  visit={visit}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    ) : (
      states
    )}
  </section>
);
