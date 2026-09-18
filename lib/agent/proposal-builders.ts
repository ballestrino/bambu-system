import {
  applyBudgetChanges,
  budgetOptionToFormValues,
  describeBudgetInputs,
  getCalculationAmounts,
  runBudgetCalculation,
} from "@/lib/agent/budget-calculation";
import {
  describeChanges,
  getStoredAmounts,
  getStoredPrices,
  hasPriceDrift,
  officialVersionWarning,
  onlyText,
  productsWarning,
  recreatedOptionsWarning,
  type ProposalBudget,
} from "@/lib/agent/proposal-summary";
import { getBudgetUrl, type AgentProposalKind, type ProposalSummary } from "@/lib/agent/proposals";
import { slugifyBudgetName } from "@/lib/budget-slug";
import { proposalBudgetValuesSchema, type ProposalPayloads } from "@/schemas/agent-proposals";
import type { AgentBudgetChanges } from "@/schemas/agent-tools";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

// Arma las propuestas que guardan valores nuevos (crear y guardar cambios): el
// payload que se ejecuta al confirmar, el resumen de la tarjeta y los importes
// que quedan citables. Duplicar y publicar están en stored-budget-proposals.ts.
// Puro: check:agent-proposals lo prueba sin base ni modelo.
export type { ProposalBudget };

export type BuiltProposal<K extends AgentProposalKind = AgentProposalKind> =
  | { ok: true; kind: K; payload: ProposalPayloads[K]; summary: ProposalSummary; grounding: number[] }
  | { ok: false; code: string; message: string };

export const refuse = (code: string, message: string) => ({ ok: false as const, code, message });

const refuseInvalid = (issues: { path: PropertyKey[]; message: string }[]) =>
  refuse(
    "invalid_values",
    `Los valores no son válidos: ${issues.map((issue) => `${issue.path.map(String).join(".")} (${issue.message})`).join(", ")}.`
  );

const INVALID_NAME = "Ese nombre no sirve para la dirección del presupuesto: usá letras o números.";

const withText = (values: BudgetFormValues, name: string, description: string | null) => ({
  ...values,
  name,
  description: description ?? values.description,
});

const CREATE_NOTES = {
  form: "Crea un presupuesto nuevo con estos valores: el formulario abierto no se guarda ni cambia.",
  context: "Crea un presupuesto nuevo: el presupuesto en contexto no cambia.",
  budget: "Crea un presupuesto nuevo: el presupuesto de base no cambia.",
  defaults: null,
} as const;

export const buildCreateBudgetProposal = (input: {
  base: { source: keyof typeof CREATE_NOTES; values: BudgetFormValues };
  name: string | null;
  description: string | null;
  changes: AgentBudgetChanges;
}): BuiltProposal<"CREATE_BUDGET"> => {
  const { base } = input;
  const name = (input.name ?? (base.source === "form" ? base.values.name : "")).trim();
  if (!name) return refuse("missing_name", "Falta el nombre del presupuesto nuevo: preguntáselo al usuario.");
  const slug = slugifyBudgetName(name);
  if (!slug) return refuse("invalid_name", INVALID_NAME);

  const { values } = applyBudgetChanges(base.values, input.changes);
  const parsed = proposalBudgetValuesSchema.safeParse(withText(values, name, input.description));
  if (!parsed.success) return refuseInvalid(parsed.error.issues);
  const after = runBudgetCalculation(parsed.data);
  return {
    ok: true,
    kind: "CREATE_BUDGET",
    payload: { values: parsed.data },
    summary: {
      title: `Crear “${name}”`,
      name,
      slug,
      changes: base.source === "defaults" ? [] : describeChanges(base.values, parsed.data),
      inputs: describeBudgetInputs(parsed.data),
      before: null,
      after,
      stored: [],
      warnings: onlyText([CREATE_NOTES[base.source]]),
    },
    grounding: getCalculationAmounts(after),
  };
};

// El slug solo cambia si cambia el nombre. Sin cambios reales no hay propuesta.
export const buildUpdateBudgetProposal = (input: {
  budget: ProposalBudget;
  name: string | null;
  description: string | null;
  changes: AgentBudgetChanges;
}): BuiltProposal<"UPDATE_BUDGET"> => {
  const { budget } = input;
  const existing = budgetOptionToFormValues(budget);
  const name = input.name?.trim() || budget.name;
  const { values } = applyBudgetChanges(existing, input.changes);
  const parsed = proposalBudgetValuesSchema.safeParse(withText(values, name, input.description));
  if (!parsed.success) return refuseInvalid(parsed.error.issues);
  const changes = describeChanges(existing, parsed.data);
  if (!changes.length) return refuse("no_changes", "No hay nada para guardar: el presupuesto ya tiene esos valores.");
  const newSlug = name === budget.name ? budget.slug : slugifyBudgetName(name);
  if (!newSlug) return refuse("invalid_name", INVALID_NAME);

  const before = runBudgetCalculation(existing);
  const after = runBudgetCalculation(parsed.data);
  const drift = hasPriceDrift(budget, before)
    ? "Los precios guardados no salen del cálculo actual: al guardar quedan los del cálculo, además del cambio pedido."
    : null;
  return {
    ok: true,
    kind: "UPDATE_BUDGET",
    payload: {
      budgetId: budget.id,
      newSlug,
      values: parsed.data,
      baseUpdatedAt: budget.updatedAt.toISOString(),
      officialBudgetId: budget.officialBudget?.id ?? null,
    },
    summary: {
      title: `Guardar cambios en “${budget.name}”`,
      name,
      slug: newSlug,
      changes,
      inputs: describeBudgetInputs(parsed.data),
      before,
      after,
      stored: getStoredPrices(budget),
      warnings: onlyText([
        recreatedOptionsWarning(budget),
        officialVersionWarning(budget),
        newSlug === budget.slug ? null : `Cambia la dirección del presupuesto a ${getBudgetUrl(newSlug)}.`,
        productsWarning(existing, parsed.data),
        drift,
      ]),
    },
    grounding: [...getStoredAmounts(budget), ...getCalculationAmounts(before), ...getCalculationAmounts(after)],
  };
};
