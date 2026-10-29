"use client";

import { BudgetContributionsFields } from "@/components/budgets/create-budget/budget-contributions-fields";
import { BudgetCostsFields } from "@/components/budgets/create-budget/budget-costs-fields";
import { BudgetDetailsFields } from "@/components/budgets/create-budget/budget-details-fields";
import { BudgetPriceFields } from "@/components/budgets/create-budget/budget-price-fields";
import { BudgetTeamFields } from "@/components/budgets/create-budget/budget-team-fields";
import type { CreatorStepId } from "@/components/budgets/create-budget/creator-steps";

// Los campos de cada paso: los mismos en las secciones de escritorio y en las
// pantallas del celular.
export const CreatorStepFields = ({ step }: { step: CreatorStepId }) => {
  switch (step) {
    case "detalle":
      return <BudgetDetailsFields />;
    case "equipo":
      return <BudgetTeamFields />;
    case "costos":
      return <BudgetCostsFields />;
    case "precio":
      return <BudgetPriceFields />;
    case "aportes":
      return <BudgetContributionsFields />;
  }
};
