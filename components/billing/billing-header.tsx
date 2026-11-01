"use client";

import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";

import { BillingChip } from "@/components/billing/billing-chip";
import type { BillingMonthView } from "@/data/billing/month";
import { cn } from "@/lib/utils";

type SyncState = { error: Error | null; isFetching: boolean; refetch: () => unknown };

// Título, el distintivo Test o Producción, el estado de la copia de Biller y
// el agente (actions).
export const BillingHeader = ({
  actions,
  biller,
  sync,
}: {
  actions?: React.ReactNode;
  biller?: BillingMonthView["biller"];
  sync: SyncState;
}) => (
  <header className="flex flex-wrap items-center justify-between gap-3">
    <div className="flex flex-wrap items-center gap-3">
      <h1 className="text-2xl font-semibold tracking-tight text-ops-text md:text-[28px]">Facturación</h1>
      {biller ? (
        biller.configured ? (
          <BillingChip dot tone={biller.environment === "production" ? "success" : "warning"}>
            {biller.environment === "production" ? "Producción" : "Test"}
          </BillingChip>
        ) : (
          <BillingChip tone="danger">Biller sin configurar</BillingChip>
        )
      ) : null}
    </div>
    <div className="flex min-h-10 items-center gap-2 text-[13px] text-ops-text-muted">
      {sync.isFetching ? (
        <span className="inline-flex items-center gap-1.5">
          <Loader2 aria-hidden className="size-3.5 animate-spin" />
          Sincronizando con Biller…
        </span>
      ) : sync.error ? (
        <span className="inline-flex items-center gap-1.5 text-amber-800 dark:text-amber-200" role="status">
          <AlertTriangle aria-hidden className="size-3.5" />
          {sync.error.message}
        </span>
      ) : (
        <span>Al día con Biller</span>
      )}
      <button
        aria-label="Sincronizar con Biller"
        className={cn(
          "flex size-10 items-center justify-center rounded-[var(--ops-radius-control)] border border-ops-border bg-ops-surface text-ops-text transition-colors hover:bg-ops-surface-muted focus-visible:ring-2 focus-visible:ring-ops-bamboo/40 focus-visible:outline-none disabled:opacity-50"
        )}
        disabled={sync.isFetching}
        onClick={() => void sync.refetch()}
        title="Sincronizar con Biller"
        type="button"
      >
        <RefreshCw aria-hidden className={cn("size-4", sync.isFetching && "animate-spin")} />
      </button>
      {actions}
    </div>
  </header>
);
