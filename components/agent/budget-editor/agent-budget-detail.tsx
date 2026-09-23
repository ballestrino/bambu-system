"use client";

import { useFormContext, useWatch } from "react-hook-form";

import { BudgetDetails } from "@/components/budgets/budget-details/BudgetDetails";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

// El detalle de la página del presupuesto (sin y con productos) sobre los
// valores del formulario: cada cambio en Editar se ve acá al instante. Con
// productos aparece solo si hay productos, como al guardarlo. Las tarjetas
// traen alto máximo y scroll propios (para la página): acá scrollea el Sheet.
export function AgentBudgetDetail() {
  const { control } = useFormContext<BudgetFormValues>();
  const values = useWatch({ control }) as BudgetFormValues;
  const hasProducts = Number(values.products_price) > 0;

  return (
    <div className="grid gap-4 [&_[data-slot=card]]:h-auto [&_[data-slot=card]]:max-h-none [&_[data-slot=card]]:overflow-visible">
      <BudgetDetails option={{ ...values, has_products: false }} title="Sin productos" />
      {hasProducts && <BudgetDetails option={{ ...values, has_products: true }} title="Con productos" />}
    </div>
  );
}
