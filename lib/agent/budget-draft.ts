import type { describeBudgetInputs } from "@/lib/agent/budget-calculation";
import type { AgentProposalStatus } from "@/lib/agent/proposals";
import { calculateBudgetTotals } from "@/lib/budget-calculations";
import { defaultBudgetValues, type BudgetFormValues } from "@/schemas/BudgetSchema";

// Presupuestos que armó el agente y que se pueden editar y guardar desde el
// chat: los cálculos y las propuestas de crear. Puro: lo usan la acción de
// guardar, las tarjetas y check:agent-budget-editor.
export const SAVABLE_BUDGET_TOOLS = ["calculateBudget", "solveForTargetPrice", "proposeCreateBudget"] as const;

export type SavableBudgetTool = (typeof SAVABLE_BUDGET_TOOLS)[number];

const SAVABLE_PART_TYPES = new Set<string>(SAVABLE_BUDGET_TOOLS.map((name) => `tool-${name}`));

export const isSavableBudgetPartType = (type: string) => SAVABLE_PART_TYPES.has(type);

// Una propuesta que todavía no se ejecutó se puede revisar con valores nuevos
// (una rechazada o vencida vuelve a pendiente al guardarla). Guardada o
// guardándose, el presupuesto queda de solo lectura.
export const REVISABLE_PROPOSAL_STATUSES = ["PENDING", "REJECTED", "EXPIRED", "FAILED"] as const;

export const isBudgetLocked = (status: AgentProposalStatus | null | undefined) =>
  status === "CONFIRMED" || status === "EXECUTING";

type BudgetInputs = ReturnType<typeof describeBudgetInputs>;

const contribution = (percent: number, fallback: number) => ({
  enabled: percent > 0,
  percent: percent > 0 ? percent : fallback,
});

// Las salidas guardadas antes de la feature 43 no traen values: se arman con
// los insumos, que alcanzan para el cálculo (nominal_salary y products_iva no
// entran en él). Un aporte en 0 es un aporte deshabilitado. El precio sale
// del cálculo, como en el formulario: si no, abrirlo contaría como un cambio.
export const valuesFromInputs = (inputs: BudgetInputs, name: string): BudgetFormValues => {
  const incidence = contribution(inputs.contributions.incidence, defaultBudgetValues.incidence_contribution);
  const company = contribution(inputs.contributions.company, defaultBudgetValues.company_contribution);
  const personal = contribution(inputs.contributions.personal, defaultBudgetValues.personal_contribution);
  const values: BudgetFormValues = {
    ...defaultBudgetValues,
    name,
    visits: inputs.visits,
    visit_type: inputs.visitType,
    hours_per_visit: inputs.hoursPerVisit,
    employees: inputs.employees,
    nominal_hour: inputs.nominalHour,
    revenue_percent: inputs.revenuePercent,
    products_price: inputs.productsPrice,
    products_revenue_percent: inputs.productsRevenuePercent,
    transportation_cost: inputs.transportationCost,
    iva: inputs.ivaPercent,
    incidence_enabled: incidence.enabled,
    incidence_contribution: incidence.percent,
    company_enabled: company.enabled,
    company_contribution: company.percent,
    personal_enabled: personal.enabled,
    personal_contribution: personal.percent,
    categoryIds: [],
  };
  return { ...values, price: Number(calculateBudgetTotals(values).totalFinalWithProducts.toFixed(2)) };
};
