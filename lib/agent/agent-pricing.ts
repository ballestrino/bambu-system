import { applyBudgetChanges, type CHANGEABLE_FIELDS } from "@/lib/agent/budget-calculation";
import { BUSINESS_PROFILE } from "@/lib/agent/business-profile";
import { applyBseKeepingPrice, BSE_KEEP_PRICE_ERRORS } from "@/lib/budget-bse";
import { roundUpToPriceStep } from "@/lib/agent/price-rounding";
import { roundMoney } from "@/lib/agent/tool-result";
import {
  calculateBudgetTotals,
  calculateRevenuePercentForServiceTarget,
} from "@/lib/budget-calculations";
import type { AgentBudgetChanges } from "@/schemas/agent-tools";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

// Las reglas de precio del agente sobre applyBudgetChanges. Las
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
// ya es múltiplo, o no hay horas ni costo, queda igual. El margen va con 6
// decimales: con costos de más de $ 1.000.000 por mes el precio puede no caer
// en la centena, y entonces tampoco se toca.
export const applyNicePrice = (values: BudgetFormValues) => {
  const totals = calculateBudgetTotals(values);
  const from = roundMoney(totals.priceNoTaxService);
  const target = roundUpToPriceStep(from);
  if (target === from) return { values, rounding: null };
  const solved = calculateRevenuePercentForServiceTarget(target, totals.totalHours, totals.costBasisNoProducts);
  if (!solved.canCalculate) return { values, rounding: null };

  const next = applyBudgetChanges(values, { revenue_percent: solved.revenuePercent }).values;
  if (serviceNet(next) !== target) return { values, rounding: null };
  const rounding: PriceRounding = {
    from,
    to: target,
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

// Se redondea cuando el presupuesto es nuevo o cambia su precio sin IVA (el
// IVA y los productos no lo mueven). Un margen pedido se respeta salvo
// roundPrice true, y roundPrice false deja el precio exacto.
const shouldRoundPrice = (
  changes: AgentBudgetChanges,
  isNew: boolean,
  before: BudgetFormValues,
  after: BudgetFormValues
) => {
  if (changes.roundPrice != null) return changes.roundPrice;
  if (changes.revenue_percent != null) return false;
  return isNew || serviceNet(after) !== serviceNet(before);
};

type ChangedFields = (typeof CHANGEABLE_FIELDS)[number][];

export type AgentChangesResult = {
  values: BudgetFormValues;
  changedFields: ChangedFields;
  rounding: PriceRounding | null;
  // calculateBse que no se pudo aplicar: la tool lo devuelve como error.
  bseError: string | null;
};

// calculateBse después de los demás cambios: el BSE sale del margen y el
// precio sin IVA queda igual, así que no se redondea.
const withBseKeepingPrice = (applied: { values: BudgetFormValues; changedFields: ChangedFields }) => {
  const result = applyBseKeepingPrice(applied.values);
  if (!result.ok) return { ...applied, bseError: BSE_KEEP_PRICE_ERRORS[result.reason] };
  const values = {
    ...result.values,
    price: Number(calculateBudgetTotals(result.values).totalFinalWithProducts.toFixed(2)),
  };
  const fields = new Set<ChangedFields[number]>([...applied.changedFields, "bse_contribution", "revenue_percent"]);
  return { values, changedFields: [...fields], bseError: null };
};

// Lo que se tipeó en el editor de la 43 ("edited") se guarda como en el
// generador: sin cambios, estimados ni redondeo, y un aporte habilitado en 0
// queda en 0. Solo se recalcula el precio final, como hace el formulario.
const asEdited = (values: BudgetFormValues) => {
  const changedFields: ChangedFields = [];
  const price = Number(calculateBudgetTotals(values).totalFinalWithProducts.toFixed(2));
  return { values: { ...values, price }, changedFields, rounding: null };
};

// changedFields es lo que se pidió (y lo que estima un presupuesto nuevo): el
// margen del redondeo va aparte, en rounding.
export const applyAgentChanges = (
  base: { source: string; values: BudgetFormValues },
  changes: AgentBudgetChanges
): AgentChangesResult => {
  if (base.source === "edited") return { ...asEdited(base.values), bseError: null };
  const isNew = base.source === "defaults";
  const changed = applyBudgetChanges(base.values, isNew ? withNewBudgetEstimates(changes) : changes);
  const withBse = changes.calculateBse ? withBseKeepingPrice(changed) : { ...changed, bseError: null };
  if (withBse.bseError) return { values: base.values, changedFields: [], rounding: null, bseError: withBse.bseError };
  const applied = { values: withBse.values, changedFields: withBse.changedFields };
  if (!shouldRoundPrice(changes, isNew, base.values, applied.values)) return { ...applied, rounding: null, bseError: null };
  const nice = applyNicePrice(applied.values);
  return { values: nice.values, changedFields: applied.changedFields, rounding: nice.rounding, bseError: null };
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
