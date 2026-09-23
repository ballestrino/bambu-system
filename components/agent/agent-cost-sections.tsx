"use client";

import { AlertTriangle } from "lucide-react";

import type { AgentConversationCost, AgentMonthlyCost } from "@/components/agent/types";
import { Skeleton } from "@/components/ui/skeleton";
import { formatModelWithReasoning, formatTokenCount, USAGE_KIND_LABELS } from "@/lib/agent/usage-format";
import { formatAgentModeLabel } from "@/lib/ai/modes";
import { formatUsd } from "@/lib/ai/pricing";

type CostRow = { key: string; label: string; detail: string; tokens: number; costUsd: number; priced: boolean };

// Cada registro de consumo es un turno, un borrador de draftEmail o un título.
const EVENT_NAMES = {
  TURN: ["turno", "turnos"],
  SKILL: ["borrador", "borradores"],
  TITLE: ["título", "títulos"],
} as const;

type EventKind = keyof typeof EVENT_NAMES;

const countEvents = (kind: EventKind, events: number) =>
  `${events} ${EVENT_NAMES[kind][events === 1 ? 0 : 1]}`;

// "5 turnos · 2 borradores": una fila del mes junta turnos y borradores.
const countEventsByKind = (eventsByKind: Partial<Record<EventKind, number>>) =>
  (Object.keys(EVENT_NAMES) as EventKind[])
    .flatMap((kind) => (eventsByKind[kind] ? [countEvents(kind, eventsByKind[kind])] : []))
    .join(" · ");

function CostTable({ rows, total }: { rows: CostRow[]; total: { tokens: number; costUsd: number } }) {
  return (
    <table className="w-full text-xs tabular-nums">
      <tbody>
        {rows.map((row) => (
          <tr key={row.key} className="border-b last:border-b-0">
            <td className="py-1.5">
              <span className="font-medium">{row.label}</span>
              <span className="block text-muted-foreground">{row.detail}</span>
            </td>
            <td className="py-1.5 text-right text-muted-foreground">{formatTokenCount(row.tokens)} tokens</td>
            <td className="py-1.5 pl-3 text-right">
              {row.priced ? formatUsd(row.costUsd) : <span className="text-amber-700 dark:text-amber-400">sin precio</span>}
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="font-semibold">
          <td className="pt-2">Total</td>
          <td className="pt-2 text-right text-muted-foreground">{formatTokenCount(total.tokens)} tokens</td>
          <td className="pt-2 pl-3 text-right">{formatUsd(total.costUsd)}</td>
        </tr>
      </tfoot>
    </table>
  );
}

export function UnpricedNotice({ events }: { events: number }) {
  if (!events) return null;
  return (
    <p className="flex gap-2 text-xs text-amber-700 dark:text-amber-400">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      {events === 1 ? "1 registro" : `${events} registros`} de uso sin precio configurado: sus tokens están
      contados, pero no su costo.
    </p>
  );
}

export const CostSkeleton = () => (
  <div className="space-y-2" aria-busy="true">
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-8 w-full" />
  </div>
);

export function ConversationCostSection({ cost }: { cost: AgentConversationCost }) {
  if (!cost || !cost.rows.length) {
    return <p className="text-xs text-muted-foreground">Esta conversación todavía no tiene consumo.</p>;
  }
  const rows = cost.rows.map((row) => ({
    key: `${row.kind}-${row.modelId}-${row.reasoning}`,
    label: USAGE_KIND_LABELS[row.kind],
    detail: `${formatModelWithReasoning(row.modelId, row.reasoning)} · ${countEvents(row.kind, row.events)}`,
    tokens: row.inputTokens + row.outputTokens,
    costUsd: row.costUsd,
    priced: row.priced,
  }));
  return (
    <div className="space-y-2">
      <CostTable
        rows={rows}
        total={{ tokens: cost.total.inputTokens + cost.total.outputTokens, costUsd: cost.total.costUsd }}
      />
      <UnpricedNotice events={cost.unpricedEvents} />
    </div>
  );
}

// El gasto del equipo en el mes, por modelo, razonamiento y modo ("Luna 6
// Extra alto · Medio"), con los títulos aparte y las conversaciones que más
// gastaron (el título solo de las propias).
export function MonthlyCostSection({ cost }: { cost: AgentMonthlyCost }) {
  if (!cost.rows.length) return <p className="text-xs text-muted-foreground">Sin consumo en este mes.</p>;
  const rows = cost.rows.map((row) => ({
    key: `${row.modelId}-${row.reasoning}-${row.mode}-${row.titles}`,
    label: `${formatModelWithReasoning(row.modelId, row.reasoning)} · ${row.titles ? "Títulos" : formatAgentModeLabel(row.mode)}`,
    detail: countEventsByKind(row.eventsByKind),
    tokens: row.inputTokens + row.outputTokens,
    costUsd: row.costUsd,
    priced: row.priced,
  }));
  return (
    <div className="space-y-3">
      <CostTable
        rows={rows}
        total={{ tokens: cost.total.inputTokens + cost.total.outputTokens, costUsd: cost.total.costUsd }}
      />
      <UnpricedNotice events={cost.unpricedEvents} />
      {cost.topConversations.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium">Conversaciones que más gastaron</p>
          <ol className="space-y-0.5 text-xs">
            {cost.topConversations.map((item, index) => (
              <li key={item.conversationId ?? index} className="flex justify-between gap-3 tabular-nums">
                <span className="min-w-0 truncate text-muted-foreground">
                  {index + 1}. {item.ownedByViewer && item.title ? item.title : "De otra persona del equipo"}
                </span>
                <span className="shrink-0">{formatUsd(item.costUsd)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
