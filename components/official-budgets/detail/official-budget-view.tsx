"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";

import { BudgetDetailContributions } from "@/components/budgets/budget-details/budget-detail-contributions";
import { BudgetDetailHeader, OfficialStatusBadge } from "@/components/budgets/budget-details/budget-detail-header";
import { formatDetailDate } from "@/components/budgets/budget-details/budget-detail-model";
import { BudgetDetailOptions, type IvaView } from "@/components/budgets/budget-details/budget-detail-options";
import { BudgetDetailService } from "@/components/budgets/budget-details/budget-detail-service";
import { BudgetDetailStats } from "@/components/budgets/budget-details/budget-detail-stats";
import { BudgetDetailsSkeleton } from "@/components/budgets/budget-details/BudgetDetailsSkeleton";
import { OfficialDetailActions } from "@/components/official-budgets/detail/official-detail-actions";
import { OfficialVersionsBand } from "@/components/official-budgets/detail/official-versions-band";
import { useOfficialBudget } from "@/components/official-budgets/hooks/use-official-budgets";
import {
  buildOfficialDetailOption,
  officialContributions,
  officialServiceFacts,
  officialStats,
  pickOfficialOptions,
} from "@/components/official-budgets/official-budget-model";

const Message = ({ text, onRetry }: { text: string; onRetry?: () => void }) => (
  <div className="container flex flex-col items-start gap-3 py-10">
    <p className="text-lg font-semibold text-ops-text">{text}</p>
    <div className="flex flex-wrap gap-3">
      {onRetry ? (
        <button className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-ops-bamboo-strong" onClick={onRetry} type="button">
          <RotateCcw className="size-4" />
          Reintentar
        </button>
      ) : null}
      <Link className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-ops-bamboo-strong" href="/dashboard/official-budgets">
        <ArrowLeft className="size-4" />
        Volver a oficiales
      </Link>
    </div>
  </div>
);

// Detalle de un oficial con el mismo armado que el del generador, sobre la
// versión elegida y con sus precios guardados.
export const OfficialBudgetView = ({ id }: { id: string }) => {
  const result = useOfficialBudget(id);
  const [selectedVersion, setSelectedVersion] = useState<number>();
  const [ivaView, setIvaView] = useState<IvaView>("without");

  if (result.isLoading) return <BudgetDetailsSkeleton />;
  if (result.isError) return <Message onRetry={() => void result.refetch()} text="No pudimos cargar el presupuesto oficial" />;
  const budget = result.data;
  if (!budget || !budget.versions.length) return <Message text="No se encontró el presupuesto oficial" />;

  const version = budget.versions.find((item) => item.version === selectedVersion) ?? budget.versions[0];
  const { base, products, first } = pickOfficialOptions(version.options);
  if (!first) return <Message text="Esta versión no tiene opciones" />;

  const withIva = ivaView === "with";
  const options = [base, products].flatMap((option) => (option ? [buildOfficialDetailOption(option, withIva)] : []));
  const main = base ?? first;
  const author = version.publishedBy.name || version.publishedBy.email || "un administrador";

  return (
    <div className="container flex w-full flex-col gap-5 pb-12">
      <BudgetDetailHeader
        actions={<OfficialDetailActions budget={budget} version={version} />}
        backHref="/dashboard/official-budgets"
        backLabel="Presupuestos oficiales"
        badge={<OfficialStatusBadge active={budget.status === "ACTIVE"} version={version.version} />}
        categories={version.serviceCategories.map((category) => ({ key: category.name, name: category.name }))}
        subtitle={`${version.serviceDescription ? `${version.serviceDescription} · ` : ""}publicada el ${formatDetailDate(version.publishedAt)} por ${author}`}
        title={version.serviceName}
      >
        <BudgetDetailStats base={options[0]} stats={officialStats(main)} withIva={withIva} />
      </BudgetDetailHeader>
      <OfficialVersionsBand budget={budget} onSelect={setSelectedVersion} selected={version} />
      <BudgetDetailOptions ivaView={ivaView} onIvaViewChange={setIvaView} options={options} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-4">
        <BudgetDetailService facts={officialServiceFacts(main, products)} />
        <BudgetDetailContributions data={officialContributions(main)} />
      </div>
      <p className="text-xs leading-relaxed text-ops-text-muted">
        El precio sin IVA, el IVA y el final son los oficiales que se guardaron al publicar. Los costos son los calculados en ese
        momento; las horas del mes son una estimación (4,32 semanas por mes).
      </p>
    </div>
  );
};
