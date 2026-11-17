"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { BudgetBseNotice } from "@/components/budgets/budget-details/budget-bse-notice";
import { BudgetDetailActions } from "@/components/budgets/budget-details/budget-detail-actions";
import { BudgetDetailContributions } from "@/components/budgets/budget-details/budget-detail-contributions";
import { BudgetDetailHeader } from "@/components/budgets/budget-details/budget-detail-header";
import { BudgetDetailJobs } from "@/components/budgets/budget-details/budget-detail-jobs";
import {
  buildDetailOption,
  detailOptionValues,
  pickBudgetOptions,
} from "@/components/budgets/budget-details/budget-detail-model";
import { BudgetDetailOfficial } from "@/components/budgets/budget-details/budget-detail-official";
import { BudgetDetailOptions, type IvaView } from "@/components/budgets/budget-details/budget-detail-options";
import { BudgetDetailService } from "@/components/budgets/budget-details/budget-detail-service";
import { BudgetDetailStats } from "@/components/budgets/budget-details/budget-detail-stats";
import { BudgetDetailsSkeleton } from "@/components/budgets/budget-details/BudgetDetailsSkeleton";
import useBudget from "@/components/budgets/hooks/useBudget";
import { useBudgetDetailExtras } from "@/components/budgets/hooks/useBudgetDetailExtras";
import { hasBse } from "@/lib/budget-bse";

const BudgetNotFound = ({ message }: { message: string }) => (
  <div className="container flex flex-col items-start gap-3 py-10">
    <p className="text-lg font-semibold text-ops-text">{message}</p>
    <Link className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-ops-bamboo-strong" href="/dashboard/budgets">
      <ArrowLeft className="size-4" />
      Volver a presupuestos
    </Link>
  </div>
);

// Página del presupuesto: cabecera con los números, estado oficial, las opciones
// con la composición de su precio, los datos, los aportes y los trabajos.
export default function BudgetDetailView({ slug }: { slug: string }) {
  const { budget, error, isLoading } = useBudget(slug);
  const extras = useBudgetDetailExtras(slug, budget?.id);
  const [ivaView, setIvaView] = useState<IvaView>("without");

  if (isLoading) return <BudgetDetailsSkeleton />;
  if (!budget) return <BudgetNotFound message={error instanceof Error ? error.message : "No se encontró el presupuesto"} />;

  const { base, withProducts } = pickBudgetOptions(budget.budgetOptions);
  if (!base) return <BudgetNotFound message="Este presupuesto no tiene opciones guardadas" />;

  const withIva = ivaView === "with";
  const baseValues = detailOptionValues(budget, base);
  const productsValues = withProducts ? detailOptionValues(budget, withProducts) : null;
  const options = [buildDetailOption(baseValues, "base", withIva)];
  if (productsValues) options.push(buildDetailOption(productsValues, "products", withIva));

  return (
    <div className="container flex w-full flex-col gap-5 pb-12">
      <BudgetDetailHeader actions={<BudgetDetailActions budget={budget} />} budget={budget}>
        <BudgetDetailStats base={options[0]} values={baseValues} withIva={withIva} />
      </BudgetDetailHeader>
      <BudgetDetailOfficial
        budgetId={budget.id}
        officialBudget={budget.officialBudget}
        publishedAt={extras.data?.officialPublishedAt ?? null}
      />
      {budget.budgetOptions.some((option) => !hasBse(option.bse_contribution)) ? <BudgetBseNotice slug={budget.slug} /> : null}
      <BudgetDetailOptions ivaView={ivaView} onIvaViewChange={setIvaView} options={options} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-4">
        <BudgetDetailService productsValues={productsValues} values={baseValues} />
        <BudgetDetailContributions values={baseValues} />
      </div>
      <BudgetDetailJobs
        budgetId={budget.id}
        isError={extras.isError}
        jobs={extras.data?.jobs}
        onRetry={() => void extras.refetch()}
        slug={slug}
      />
    </div>
  );
}
