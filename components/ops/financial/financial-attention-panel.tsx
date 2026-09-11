"use client";

import { ArrowRight, ShieldCheck } from "lucide-react";

import type { AttentionItem } from "@/components/ops/financial/financial-attention-items";
import { buildProfitabilityItem } from "@/components/ops/financial/financial-attention-items";
import type { FinanceSection } from "@/components/ops/financial/financial-sections";
import type { FinancialWorkspace } from "@/components/ops/financial/use-financial-workspace";
import { OpsSection, opsSurface, opsToneClasses } from "@/components/ops/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const AttentionRow = ({
  item,
  onSelectSection,
}: {
  item: AttentionItem;
  onSelectSection: (section: FinanceSection) => void;
}) => (
  <button
    className={cn(
      opsSurface.panelSoft,
      "flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-ops-surface"
    )}
    onClick={() => onSelectSection(item.section)}
    type="button"
  >
    <span
      className={cn(
        "mt-0.5 shrink-0 rounded-[var(--ops-radius-control)] border p-1.5",
        opsToneClasses[item.tone]
      )}
    >
      <item.icon className="h-3.5 w-3.5" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-medium text-ops-text">{item.title}</span>
      <span className="block text-xs text-ops-text-muted">{item.detail}</span>
    </span>
    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-ops-text-muted" />
  </button>
);

export const FinancialAttentionPanel = ({
  items,
  onSelectSection,
  workspace,
}: {
  items: AttentionItem[];
  onSelectSection: (section: FinanceSection) => void;
  workspace: FinancialWorkspace;
}) => {
  const { error, isLoading, refetch, results } = workspace.profitability;
  const profitabilityItem = buildProfitabilityItem(results);
  const visible = profitabilityItem ? [profitabilityItem, ...items] : items;

  return (
    <OpsSection
      description="Lo que conviene mirar antes de que cierre el mes."
      title="Requiere atención"
    >
      <div className="grid gap-2">
        {visible.slice(0, 4).map((item) => (
          <AttentionRow
            item={item}
            key={item.id}
            onSelectSection={onSelectSection}
          />
        ))}

        {/* The profitability row carries its own state so one failed query never
            blanks the other alerts. */}
        {isLoading ? (
          <Skeleton className="h-14 w-full" />
        ) : error ? (
          <div
            className={cn(
              opsSurface.panelSoft,
              "flex items-center justify-between gap-3 p-3 text-xs text-ops-text-muted"
            )}
          >
            No pudimos revisar la rentabilidad.
            <Button onClick={() => void refetch()} size="sm" variant="outline">
              Reintentar
            </Button>
          </div>
        ) : null}

        {!visible.length && !isLoading && !error ? (
          <div className="flex items-center gap-3 rounded-[var(--ops-radius-row)] border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            El mes está en orden: sin pérdidas, anulados ni desvíos de BPS.
          </div>
        ) : null}
      </div>
    </OpsSection>
  );
};
