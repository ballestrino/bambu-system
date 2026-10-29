"use client";

import { BudgetEditor } from "@/components/budgets/edit-budget/budget-editor";
import type { ExistingBudget } from "@/components/budgets/interfaces/edit-buget";

// La clave por slug vuelve a armar el editor cuando la dirección cambia.
export default function EditBudgetPageClient({ budget }: { budget: ExistingBudget }) {
  return <BudgetEditor budget={budget} key={budget.slug} />;
}
