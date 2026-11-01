"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

import { BillingAgent } from "@/components/billing/billing-agent";
import { BillingDraft } from "@/components/billing/billing-draft";
import { getDraftTotals } from "@/components/billing/billing-draft-model";
import { BillingEmptyDraft } from "@/components/billing/billing-empty-draft";
import { BillingHeader } from "@/components/billing/billing-header";
import { BillingIssuedList } from "@/components/billing/billing-issued-list";
import { BillingSummary } from "@/components/billing/billing-summary";
import { BillingToolbar } from "@/components/billing/billing-toolbar";
import { BillingViews } from "@/components/billing/billing-views";
import { useRepeatBillingMonth } from "@/components/billing/hooks/use-billing-draft-mutations";
import { useBillingList } from "@/components/billing/hooks/use-billing-list";
import { useBillingMonth } from "@/components/billing/hooks/use-billing-month";
import { OpsPageShell, useOpsSelectedMonth } from "@/components/ops/shared";
import { Skeleton } from "@/components/ui/skeleton";

// Facturación del mes (docs/billing.md, diseño B de claude-design): resumen,
// borrador que repite el mes anterior, emitir lo marcado y lo emitido, con
// vistas y filtros (48).
export const BillingPage = () => {
  const { monthKey } = useOpsSelectedMonth();
  const { month, sync } = useBillingMonth(monthKey);
  const repeat = useRepeatBillingMonth(monthKey);
  const view = month.data;
  const list = useBillingList(view);
  const pending = view?.draft?.rows.filter((row) => row.status === "DRAFT") ?? [];
  const filtered = list.activeCount > 0;

  return (
    <OpsPageShell className="gap-4 md:gap-5">
      <BillingHeader
        actions={
          <>
            <Link
              aria-label="Nueva factura"
              className="inline-flex h-10 items-center gap-2 rounded-[var(--ops-radius-control)] bg-ops-bamboo-strong px-3 text-sm font-semibold text-white transition-colors hover:bg-ops-bamboo-strong/90 focus-visible:ring-2 focus-visible:ring-ops-bamboo/40 focus-visible:outline-none sm:px-3.5"
              href={`/dashboard/billing/new?month=${monthKey}`}
            >
              <Plus aria-hidden className="size-4" />
              <span className="hidden sm:inline">Nueva factura</span>
            </Link>
            <BillingAgent getContext={() => ({ kind: "billing", month: monthKey })} />
          </>
        }
        biller={view?.biller}
        sync={sync}
      />
      {!view ? (
        month.error ? (
          <div className="rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface p-6 text-sm text-ops-text-muted" role="alert">
            {month.error.message}{" "}
            <button className="font-semibold text-ops-bamboo-strong underline" onClick={() => void month.refetch()} type="button">
              Reintentar
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-44 w-full rounded-[var(--ops-radius-panel)]" />
            <Skeleton className="h-11 w-64" />
            <Skeleton className="h-72 w-full rounded-[var(--ops-radius-panel)]" />
          </div>
        )
      ) : (
        <>
          <BillingSummary draftAmount={getDraftTotals(pending).amount} view={view} />
          <div className="flex flex-col gap-3">
            <BillingViews counts={list.counts} onChange={list.setView} value={list.view} />
            <BillingToolbar list={list} />
          </div>
          {list.view !== "draft" ? (
            <BillingIssuedList
              filtered={filtered}
              mode={list.view}
              onClearFilters={list.clearFilters}
              periodKey={view.period}
              rows={list.view === "issued" ? list.issued : list.archived}
            />
          ) : view.draft ? (
            <BillingDraft
              draft={view.draft}
              filtered={filtered}
              hiddenMarked={list.hiddenMarked}
              onClearFilters={list.clearFilters}
              rows={list.draft}
              view={view}
            />
          ) : (
            <BillingEmptyDraft
              canRepeat={view.biller.configured}
              isRepeating={repeat.isPending}
              onRepeat={() => repeat.mutate()}
              view={view}
            />
          )}
        </>
      )}
    </OpsPageShell>
  );
};
