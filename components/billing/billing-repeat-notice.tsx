"use client";

import { Loader2 } from "lucide-react";

import { getMonthName, pluralInvoices } from "@/components/billing/billing-format";
import { useRepeatBillingMonth } from "@/components/billing/hooks/use-billing-draft-mutations";
import type { BillingMonthView } from "@/data/billing/month";

type Draft = NonNullable<BillingMonthView["draft"]>;

// Un borrador que se armó con facturas nuevas (Nueva factura, 45) todavía no
// tiene las del mes anterior: "Repetir <mes>" las suma a este mismo borrador.
export const BillingRepeatNotice = ({ draft, view }: { draft: Draft; view: BillingMonthView }) => {
  const repeat = useRepeatBillingMonth(view.period);
  const { total } = view.repeatPreview;
  if (draft.repeated || draft.status !== "DRAFT" || !total) return null;
  const prevMonth = getMonthName(view.previousPeriod);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--ops-radius-panel)] border border-ops-bamboo/30 bg-ops-bamboo-soft px-4 py-3">
      <p className="text-sm text-ops-bamboo-strong">
        Este borrador todavía no tiene las {pluralInvoices(total)} de {prevMonth}.
      </p>
      <button
        className="flex h-10 items-center gap-2 rounded-[10px] bg-ops-bamboo-strong px-3.5 text-sm font-semibold text-white disabled:opacity-60 dark:text-ops-canvas"
        disabled={repeat.isPending || !view.biller.configured}
        onClick={() => repeat.mutate()}
        type="button"
      >
        {repeat.isPending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
        {repeat.isPending ? "Copiando de Biller…" : `Repetir ${prevMonth}`}
      </button>
    </div>
  );
};
