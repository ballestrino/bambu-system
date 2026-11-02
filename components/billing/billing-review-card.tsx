"use client";

import { ArrowDown } from "lucide-react";

import { BillingChip } from "@/components/billing/billing-chip";
import { formatMoney } from "@/components/billing/billing-format";
import type { ReviewSuggestion } from "@/lib/billing/draft-review";

const KIND: Record<ReviewSuggestion["kind"], { label: string; tone: "neutral" | "warning" | "active" }> = {
  adenda: { label: "Adenda", tone: "active" },
  concepto: { label: "Detalle", tone: "active" },
  remove: { label: "Sacar del borrador", tone: "warning" },
  note: { label: "Para mirar", tone: "neutral" },
};

export type ReviewCardState = "applied" | "busy" | "discarded" | "open";

const button = "h-9 rounded-lg px-3 text-sm font-semibold disabled:opacity-60";

// Una sugerencia de la revisión con IA (52): qué factura, por qué, el texto
// de antes y el de después, y aplicarla o descartarla.
export const BillingReviewCard = ({
  onApply,
  onDiscard,
  state,
  suggestion,
}: {
  onApply: () => void;
  onDiscard: () => void;
  state: ReviewCardState;
  suggestion: ReviewSuggestion;
}) => {
  const kind = KIND[suggestion.kind];
  const done = state === "applied" || state === "discarded";
  return (
    <article className="flex flex-col gap-2.5 rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface p-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[15px] font-semibold text-ops-text">{suggestion.name}</span>
        <BillingChip tone={kind.tone}>
          {kind.label}
          {suggestion.kind === "concepto" && suggestion.lineIndex ? ` · línea ${suggestion.lineIndex + 1}` : ""}
        </BillingChip>
      </div>
      <p className="-mt-1.5 text-[13px] text-ops-text-muted">
        {suggestion.detail} · {formatMoney(suggestion.subtotal)}
      </p>
      <p className="text-sm text-ops-text">{suggestion.reason}</p>
      {suggestion.current !== null && suggestion.proposed !== null ? (
        <div className="flex flex-col gap-1 text-[13px]">
          <p className="rounded-lg bg-red-50 px-2.5 py-2 whitespace-pre-wrap text-red-900 line-through decoration-red-400/60 dark:bg-red-950/40 dark:text-red-100">
            {suggestion.current}
          </p>
          <ArrowDown aria-hidden className="size-3.5 self-center text-ops-text-muted" />
          <p className="rounded-lg bg-emerald-50 px-2.5 py-2 whitespace-pre-wrap text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
            {suggestion.proposed}
          </p>
        </div>
      ) : null}
      <div className="flex items-center justify-end gap-2">
        {done ? (
          <span className="text-[13px] font-semibold text-ops-text-muted">{state === "applied" ? "Aplicada" : "Descartada"}</span>
        ) : (
          <>
            <button className={`${button} text-ops-text-muted hover:bg-ops-surface-muted`} disabled={state === "busy"} onClick={onDiscard} type="button">
              Descartar
            </button>
            {suggestion.kind !== "note" ? (
              <button
                className={`${button} bg-ops-bamboo-strong text-white hover:opacity-90 dark:text-ops-canvas`}
                disabled={state === "busy"}
                onClick={onApply}
                type="button"
              >
                {suggestion.kind === "remove" ? "Sacar del borrador" : "Aplicar"}
              </button>
            ) : null}
          </>
        )}
      </div>
    </article>
  );
};
