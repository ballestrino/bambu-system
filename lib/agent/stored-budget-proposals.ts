import {
  budgetOptionToFormValues,
  describeBudgetInputs,
  runBudgetCalculation,
} from "@/lib/agent/budget-calculation";
import { refuse, type BuiltProposal } from "@/lib/agent/proposal-builders";
import {
  getStoredAmounts,
  getStoredPrices,
  hasPriceDrift,
  onlyText,
  type ProposalBudget,
} from "@/lib/agent/proposal-summary";
import { slugifyBudgetName } from "@/lib/budget-slug";

// Propuestas sobre un presupuesto guardado tal cual está: duplicarlo y
// publicarlo como oficial. Usan sus precios guardados, no un cálculo nuevo.
// Puro, como proposal-builders.ts.

// duplicateBudget exige ser quien creó el presupuesto: se avisa al proponer.
export const buildDuplicateBudgetProposal = (input: {
  budget: ProposalBudget;
  actorId: string;
}): BuiltProposal<"DUPLICATE_BUDGET"> => {
  const { budget } = input;
  if (budget.userId !== input.actorId) {
    return refuse(
      "not_owner",
      "Solo quien creó este presupuesto puede duplicarlo. Como alternativa, proponé crear uno nuevo con este de base (proposeCreateBudget con su slug)."
    );
  }
  const name = `${budget.name} (copia)`;
  return {
    ok: true,
    kind: "DUPLICATE_BUDGET",
    payload: { budgetId: budget.id, baseUpdatedAt: budget.updatedAt.toISOString() },
    summary: {
      title: `Duplicar “${budget.name}”`,
      name,
      slug: slugifyBudgetName(name) || null,
      changes: [],
      inputs: describeBudgetInputs(budgetOptionToFormValues(budget)),
      before: null,
      after: null,
      stored: getStoredPrices(budget),
      warnings: [
        "La copia lleva las mismas opciones, precios guardados y categorías, y no queda vinculada a ningún presupuesto oficial.",
      ],
    },
    grounding: getStoredAmounts(budget),
  };
};

export const buildPublishOfficialBudgetProposal = (input: {
  budget: ProposalBudget;
}): BuiltProposal<"PUBLISH_OFFICIAL_BUDGET"> => {
  const { budget } = input;
  if (budget.officialBudget) {
    return refuse(
      "already_official",
      `Ya está publicado como oficial (versión ${budget.officialBudget.currentVersion}): cada cambio guardado publica una versión nueva sola.`
    );
  }
  if (!budget.budgetOptions.length) return refuse("no_options", "El presupuesto no tiene opciones para publicar.");
  const values = budgetOptionToFormValues(budget);
  return {
    ok: true,
    kind: "PUBLISH_OFFICIAL_BUDGET",
    payload: { sourceBudgetId: budget.id, baseUpdatedAt: budget.updatedAt.toISOString() },
    summary: {
      title: `Publicar “${budget.name}” como oficial`,
      name: budget.name,
      slug: budget.slug,
      changes: [],
      inputs: describeBudgetInputs(values),
      before: null,
      after: null,
      stored: getStoredPrices(budget),
      warnings: onlyText([
        "Sus precios guardados pasan a ser precio de lista vigente: el agente y el correo los citan como oficiales.",
        "Desde ahí, cada cambio guardado en el presupuesto publica una versión oficial nueva.",
        hasPriceDrift(budget, runBudgetCalculation(values))
          ? "Los precios guardados no salen del cálculo actual: se publican los guardados."
          : null,
      ]),
    },
    grounding: getStoredAmounts(budget),
  };
};
