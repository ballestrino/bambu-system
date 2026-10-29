"use client";

import type { ReactNode } from "react";

import { BudgetContributionsFields } from "@/components/budgets/create-budget/budget-contributions-fields";
import { BudgetCostsFields } from "@/components/budgets/create-budget/budget-costs-fields";
import { BudgetDetailsFields } from "@/components/budgets/create-budget/budget-details-fields";
import { BudgetPriceFields } from "@/components/budgets/create-budget/budget-price-fields";
import { BudgetTeamFields } from "@/components/budgets/create-budget/budget-team-fields";
import type { CreatorStepId } from "@/components/budgets/create-budget/creator-steps";

// Los campos de cada paso: los mismos en las secciones de escritorio y en las
// pantallas del celular.
// detailSlot suma campos al final del Detalle (la URL al editar).
export const CreatorStepFields = ({ detailSlot, step }: { detailSlot?: ReactNode; step: CreatorStepId }) => {
  switch (step) {
    case "detalle":
      return <BudgetDetailsFields>{detailSlot}</BudgetDetailsFields>;
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
