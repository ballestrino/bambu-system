"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { BillingAgent } from "@/components/billing/billing-agent";
import { BillingDraft } from "@/components/billing/billing-draft";
import { getDraftTotals } from "@/components/billing/billing-draft-model";
import { BillingEmptyDraft } from "@/components/billing/billing-empty-draft";
import { BillingHeader } from "@/components/billing/billing-header";
import { BillingIssuedList } from "@/components/billing/billing-issued-list";
import { BillingSummary } from "@/components/billing/billing-summary";
import { BillingTabs, type BillingTab } from "@/components/billing/billing-tabs";
import { useRepeatBillingMonth } from "@/components/billing/hooks/use-billing-draft-mutations";
import { useBillingMonth } from "@/components/billing/hooks/use-billing-month";
import { OpsPageShell, useOpsSelectedMonth } from "@/components/ops/shared";
import { Skeleton } from "@/components/ui/skeleton";

// Facturación del mes (docs/billing.md, diseño B de claude-design): resumen,
// borrador que repite el mes anterior, emitir lo marcado y lo emitido.
export const BillingPage = () => {
  const { monthKey } = useOpsSelectedMonth();
  const { month, sync } = useBillingMonth(monthKey);
  const repeat = useRepeatBillingMonth(monthKey);
  const [tab, setTab] = useState<BillingTab>("draft");
  const view = month.data;
  const pending = view?.draft?.rows.filter((row) => row.status === "DRAFT") ?? [];
  const draftTotals = getDraftTotals(view?.draft?.rows ?? []);

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
            <BillingAgent monthKey={monthKey} />
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
          <BillingTabs
            draftLabel={view.draft ? `${draftTotals.count}/${view.draft.rows.length}` : "0"}
            issuedCount={view.issued.length}
            onChange={setTab}
            value={tab}
          />
          {tab === "issued" ? (
            <BillingIssuedList periodKey={view.period} rows={view.issued} />
          ) : view.draft ? (
            <BillingDraft draft={view.draft} view={view} />
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
