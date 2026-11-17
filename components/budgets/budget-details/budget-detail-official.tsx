"use client";

import Link from "next/link";
import { BadgeCheck, History, Loader2, Send } from "lucide-react";

import { formatDetailDate } from "@/components/budgets/budget-details/budget-detail-model";
import { useOfficialBudgetMutations } from "@/components/official-budgets/hooks/use-official-budget-mutations";

const bandButton =
  "inline-flex h-11 items-center gap-[7px] rounded-[10px] border border-ops-border bg-ops-surface px-3.5 text-[13.5px] font-semibold text-ops-text hover:bg-ops-surface-muted disabled:opacity-50";

type BudgetDetailOfficialProps = {
  budgetId: string;
  officialBudget: { id: string; currentVersion: number } | null;
  publishedAt: string | null;
};

// Un generador vinculado a un oficial (archivarlo lo desvincula) o un borrador
// que se puede publicar desde acá.
export const BudgetDetailOfficial = ({ budgetId, officialBudget, publishedAt }: BudgetDetailOfficialProps) => {
  const { publish } = useOfficialBudgetMutations();

  if (!officialBudget) {
    return (
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--ops-radius-panel)] border border-dashed border-ops-border bg-ops-surface p-4">
        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-0.5">
          <span className="text-[15px] font-semibold text-ops-text">Borrador</span>
          <span className="text-[13.5px] text-ops-text-muted">
            Todavía no es un presupuesto oficial. Publicarlo guarda una versión que no cambia y que el agente puede citar.
          </span>
        </div>
        <button className={bandButton} disabled={publish.isPending} onClick={() => publish.mutate(budgetId)} type="button">
          {publish.isPending ? <Loader2 className="size-[15px] animate-spin" /> : <Send className="size-[15px]" />}
          Publicar como oficial
        </button>
      </section>
    );
  }

  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--ops-radius-panel)] border border-ops-bamboo/25 bg-ops-bamboo-soft p-4 text-ops-bamboo-strong">
      <div className="flex min-w-0 flex-[1_1_420px] gap-3">
        <span className="grid size-10 flex-none place-items-center rounded-full bg-ops-surface">
          <BadgeCheck className="size-5" />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-xs font-semibold tracking-[0.04em] uppercase">Presupuesto oficial</span>
          <span className="text-[15px] font-semibold">
            Versión {officialBudget.currentVersion}
            {publishedAt ? ` publicada el ${formatDetailDate(publishedAt)}` : " vigente"}
          </span>
          <span className="text-[13.5px] text-ops-text">
            Cada edición publica una versión nueva que no se puede cambiar. Para eliminarlo, primero archivalo.
          </span>
        </div>
      </div>
      <Link className={bandButton} href={`/dashboard/official-budgets/${officialBudget.id}`}>
        <History className="size-[15px]" />
        Ver versiones
      </Link>
    </section>
  );
};
