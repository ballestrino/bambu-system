"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

import { BillingReviewCard, type ReviewCardState } from "@/components/billing/billing-review-card";
import { useApplyReviewSuggestion, useDraftReview } from "@/components/billing/hooks/use-draft-review";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { formatUsd } from "@/lib/ai/pricing";
import type { ReviewSuggestion } from "@/lib/billing/draft-review";

const TEXT_KINDS = new Set<ReviewSuggestion["kind"]>(["adenda", "concepto"]);

// "Revisar con IA" (feature 52): el modelo lee las adendas y los detalles del
// borrador y sugiere corregir el mes o sacar un servicio puntual. No cambia
// nada solo: cada sugerencia se aplica acá, con las acciones del borrador.
export const BillingDraftReview = ({ disabled, periodKey }: { disabled: boolean; periodKey: string }) => {
  const review = useDraftReview(periodKey);
  const apply = useApplyReviewSuggestion(periodKey);
  const [open, setOpen] = useState(false);
  const [states, setStates] = useState<Record<string, ReviewCardState>>({});
  const result = review.data;
  const suggestions = result?.suggestions ?? [];
  const pendingText = suggestions.filter((item) => TEXT_KINDS.has(item.kind) && (states[item.id] ?? "open") === "open");

  const setState = (id: string, state: ReviewCardState) => setStates((current) => ({ ...current, [id]: state }));
  const run = () => {
    setStates({});
    setOpen(true);
    review.mutate();
  };
  const applyOne = async (suggestion: ReviewSuggestion) => {
    setState(suggestion.id, "busy");
    try {
      await apply.mutateAsync(suggestion);
      setState(suggestion.id, "applied");
    } catch {
      setState(suggestion.id, "open");
    }
  };
  const applyTexts = async () => {
    for (const suggestion of pendingText) await applyOne(suggestion);
  };

  return (
    <>
      <button
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-ops-border bg-ops-surface px-3 text-sm font-semibold text-ops-text hover:bg-ops-surface-muted disabled:opacity-60"
        disabled={disabled || review.isPending}
        onClick={run}
        title="La IA revisa las adendas y los detalles, y avisa de los servicios puntuales"
        type="button"
      >
        {review.isPending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Sparkles aria-hidden className="size-4" />}
        Revisar con IA
      </button>
      <Sheet onOpenChange={setOpen} open={open}>
        <SheetContent className="w-full gap-0 border-ops-border bg-ops-canvas p-0 sm:max-w-[560px]" side="right">
          <header className="flex flex-none flex-col gap-0.5 border-b border-ops-border bg-ops-surface py-3.5 pr-14 pl-5">
            <SheetTitle className="text-lg font-semibold text-ops-text">Revisión con IA</SheetTitle>
            <SheetDescription className="text-[13px] text-ops-text-muted">
              {review.isPending
                ? "Leyendo las adendas y los detalles del borrador…"
                : result
                  ? `${result.reviewed} facturas revisadas · ${result.model}${result.costUsd !== null ? ` · ${formatUsd(result.costUsd)}` : ""}`
                  : "Sugerencias para el borrador. Nada cambia hasta que lo aplicás."}
            </SheetDescription>
          </header>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {review.isPending ? (
              <p className="flex items-center gap-2 text-sm text-ops-text-muted">
                <Loader2 aria-hidden className="size-4 animate-spin" /> Esto tarda unos segundos.
              </p>
            ) : review.isError ? (
              <p className="text-sm text-red-700 dark:text-red-300" role="alert">{review.error.message}</p>
            ) : result && !suggestions.length ? (
              <p className="text-sm text-ops-text-muted">No hay nada para corregir: las adendas y los detalles están bien.</p>
            ) : (
              suggestions.map((suggestion) => (
                <BillingReviewCard
                  key={suggestion.id}
                  onApply={() => void applyOne(suggestion)}
                  onDiscard={() => setState(suggestion.id, "discarded")}
                  state={states[suggestion.id] ?? "open"}
                  suggestion={suggestion}
                />
              ))
            )}
          </div>
          {pendingText.length > 1 ? (
            <footer className="flex flex-none items-center justify-between gap-3 border-t border-ops-border bg-ops-surface px-4 py-3">
              <span className="text-[13px] text-ops-text-muted">Sacar del borrador se confirma de a una.</span>
              <button
                className="h-10 rounded-lg bg-ops-bamboo-strong px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 dark:text-ops-canvas"
                disabled={apply.isPending}
                onClick={() => void applyTexts()}
                type="button"
              >
                Aplicar los {pendingText.length} textos
              </button>
            </footer>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
};
