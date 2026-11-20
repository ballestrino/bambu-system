"use client";

import { useState } from "react";

import { BudgetDetailContributions } from "@/components/budgets/budget-details/budget-detail-contributions";
import {
  contributionsFromValues,
  serviceFactsFromValues,
  statsFromValues,
} from "@/components/budgets/budget-details/budget-detail-facts";
import {
  buildDetailOption,
  type DetailContributions,
  type DetailFact,
  type DetailOption,
  type DetailStats,
} from "@/components/budgets/budget-details/budget-detail-model";
import { BudgetDetailOptions, type IvaView } from "@/components/budgets/budget-details/budget-detail-options";
import { BudgetDetailService } from "@/components/budgets/budget-details/budget-detail-service";
import { BudgetDetailStats } from "@/components/budgets/budget-details/budget-detail-stats";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

// El detalle del panel lateral con los bloques de la página del presupuesto
// (la 58): los cuatro números, las opciones con la composición del precio y
// el selector de IVA, los datos del servicio y los aportes. Sin cabecera ni
// trabajos: el panel trae la suya.
export function AgentDetailBody({
  stats,
  buildOptions,
  facts,
  contributions,
}: {
  stats: DetailStats;
  buildOptions: (withIva: boolean) => DetailOption[];
  facts: DetailFact[];
  contributions: DetailContributions;
}) {
  const [ivaView, setIvaView] = useState<IvaView>("without");
  const withIva = ivaView === "with";
  const options = buildOptions(withIva);
  if (!options.length) return null;

  return (
    <div className="flex flex-col gap-5">
      <BudgetDetailStats base={options[0]} stats={stats} withIva={withIva} />
      <BudgetDetailOptions ivaView={ivaView} onIvaViewChange={setIvaView} options={options} />
      <BudgetDetailService facts={facts} />
      <BudgetDetailContributions data={contributions} />
    </div>
  );
}

// Sobre valores del generador: los de un cálculo o una propuesta (la opción
// con productos sale de los mismos valores) o los de un presupuesto guardado.
export function AgentValuesDetail({ base, products }: { base: BudgetFormValues; products: BudgetFormValues | null }) {
  return (
    <AgentDetailBody
      stats={statsFromValues(base)}
      buildOptions={(withIva) => [
        buildDetailOption(base, "base", withIva),
        ...(products ? [buildDetailOption(products, "products", withIva)] : []),
      ]}
      facts={serviceFactsFromValues(base, products)}
      contributions={contributionsFromValues(base)}
    />
  );
}
