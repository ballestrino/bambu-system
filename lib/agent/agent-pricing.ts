import { applyBudgetChanges } from "@/lib/agent/budget-calculation";
import { BUSINESS_PROFILE } from "@/lib/agent/business-profile";
import { roundUpToPriceStep } from "@/lib/agent/price-rounding";
import { roundMoney } from "@/lib/agent/tool-result";
import {
  calculateBudgetTotals,
  calculateRevenuePercentForServiceTarget,
} from "@/lib/budget-calculations";
import type { AgentBudgetChanges } from "@/schemas/agent-tools";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

// Las reglas de precio del agente (feature 44) sobre applyBudgetChanges. Las
// aplica el cálculo y no el modelo: draftEmail solo acepta importes que
// salieron de una tool. calculateBudget y las propuestas de crear y guardar
// pasan por acá, así lo que se guarda es lo que se calculó. Puro.
export type PriceRounding = {
  from: number;
  to: number;
  revenuePercentFrom: number;
  revenuePercentTo: number;
};

const serviceNet = (values: BudgetFormValues) =>
  roundMoney(calculateBudgetTotals(values).priceNoTaxService);

// El precio lindo: el total mensual del servicio sin IVA sube al próximo
// múltiplo de $ 100 subiendo el margen, con la cuenta del precio objetivo. Si
// ya es múltiplo, o no hay horas ni costo, queda igual.
export const applyNicePrice = (values: BudgetFormValues) => {
  const totals = calculateBudgetTotals(values);
  const from = roundMoney(totals.priceNoTaxService);
  const target = roundUpToPriceStep(from);
  if (target === from) return { values, rounding: null };
  const solved = calculateRevenuePercentForServiceTarget(target, totals.totalHours, totals.costBasisNoProducts);
  if (!solved.canCalculate) return { values, rounding: null };

  const next = applyBudgetChanges(values, { revenue_percent: solved.revenuePercent }).values;
  const rounding: PriceRounding = {
    from,
    to: serviceNet(next),
    revenuePercentFrom: Number(values.revenue_percent) || 0,
    revenuePercentTo: next.revenue_percent,
  };
  return { values: next, rounding };
};

// Los valores por defecto son de 1 visita semanal de 4 horas: un presupuesto
// nuevo estima transporte y productos con sus propias horas, salvo que vengan
// los montos o se pida no estimarlos.
const withNewBudgetEstimates = (changes: AgentBudgetChanges): AgentBudgetChanges => ({
  ...changes,
  estimateTransport: changes.estimateTransport ?? changes.transportation_cost == null,
  estimateProducts: changes.estimateProducts ?? changes.products_price == null,
});

// Se redondea cuando el precio es nuevo o cambia (el IVA no mueve el precio
// sin IVA). Un margen pedido se respeta salvo roundPrice true, y roundPrice
// false deja el precio exacto.
const shouldRoundPrice = (changes: AgentBudgetChanges, isNew: boolean, changedFields: readonly string[]) => {
  if (changes.roundPrice != null) return changes.roundPrice;
  if (changes.revenue_percent != null) return false;
  return isNew || changedFields.some((field) => field !== "iva");
};

// changedFields es lo que se pidió (y lo que estima un presupuesto nuevo): el
// margen del redondeo va aparte, en rounding. "edited" (el editor de la 43) no
// es nuevo: lo editado a mano se guarda tal cual.
export const applyAgentChanges = (
  base: { source: string; values: BudgetFormValues },
  changes: AgentBudgetChanges
) => {
  const isNew = base.source === "defaults";
  const applied = applyBudgetChanges(base.values, isNew ? withNewBudgetEstimates(changes) : changes);
  if (!shouldRoundPrice(changes, isNew, applied.changedFields)) return { ...applied, rounding: null };
  const nice = applyNicePrice(applied.values);
  return { values: nice.values, changedFields: applied.changedFields, rounding: nice.rounding };
};

const money = new Intl.NumberFormat("es-UY", {
  style: "currency",
  currency: "UYU",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const percent = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 2 });

// El aviso de la tarjeta de una propuesta que redondeó el precio.
export const describeRounding = (rounding: PriceRounding | null) =>
  rounding
    ? `El precio sin IVA sube de ${money.format(rounding.from)} a ${money.format(rounding.to)} (próximo múltiplo de $ ${BUSINESS_PROFILE.priceStep}): el margen del servicio pasa de ${percent.format(rounding.revenuePercentFrom)} % a ${percent.format(rounding.revenuePercentTo)} %.`
    : null;
