"use client";

import { useFormContext, useWatch } from "react-hook-form";

import { AgentValuesDetail } from "@/components/agent/budget-editor/agent-detail-body";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

// El detalle de la página del presupuesto sobre los valores del formulario:
// cada cambio en Editar se ve acá al instante. Con productos aparece solo si
// hay productos, como al guardarlo.
export function AgentBudgetDetail() {
  const { control } = useFormContext<BudgetFormValues>();
  const values = useWatch({ control }) as BudgetFormValues;
  return <AgentValuesDetail base={values} products={Number(values.products_price) > 0 ? values : null} />;
}
