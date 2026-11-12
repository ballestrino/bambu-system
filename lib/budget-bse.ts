import { calculateBudgetTotals, type BudgetCalculationValues } from "@/lib/budget-calculations";
import { BSE_DEFAULT_PERCENT } from "@/schemas/BudgetSchema";

// "Calcular BSE" de un presupuesto guardado antes del BSE (bse_contribution
// null): pone el BSE por defecto y baja la ganancia del servicio para que el
// precio sin IVA quede igual. Los productos no cambian. El margen va sin
// redondear: con 6 decimales el precio podía moverse un centavo. Puro.
export type BseKeepingPrice<T> =
  | { ok: true; values: T; bseAmount: number; revenuePercentFrom: number; revenuePercentTo: number }
  | { ok: false; reason: "already_set" | "no_cost" | "not_enough_profit"; bseAmount: number; profit: number };

// "5,2%" para los textos de la pantalla.
export const BSE_DEFAULT_LABEL = `${BSE_DEFAULT_PERCENT.toLocaleString("es-UY")}%`;

export const hasBse = (value: unknown) => value !== null && value !== undefined && value !== "";

export const applyBseKeepingPrice = <T extends BudgetCalculationValues>(values: T): BseKeepingPrice<T> => {
  const before = calculateBudgetTotals(values);
  const next = { ...values, bse_contribution: BSE_DEFAULT_PERCENT };
  const after = calculateBudgetTotals(next);
  const bseAmount = after.bseVal;
  const profit = before.revenueAmountService;

  if (hasBse(values.bse_contribution)) return { ok: false, reason: "already_set", bseAmount, profit };
  if (after.costBasisNoProducts <= 0) return { ok: false, reason: "no_cost", bseAmount, profit };
  if (bseAmount > profit) return { ok: false, reason: "not_enough_profit", bseAmount, profit };

  const revenuePercent = Math.max(0, (before.priceNoTaxService / after.costBasisNoProducts - 1) * 100);
  return {
    ok: true,
    values: { ...next, revenue_percent: revenuePercent },
    bseAmount,
    revenuePercentFrom: Number(values.revenue_percent) || 0,
    revenuePercentTo: revenuePercent,
  };
};

export const BSE_KEEP_PRICE_ERRORS: Record<"already_set" | "no_cost" | "not_enough_profit", string> = {
  already_set: "Este presupuesto ya tiene el BSE calculado.",
  no_cost: "Sin horas ni costo no hay BSE para calcular.",
  not_enough_profit: "La ganancia no alcanza para cubrir el BSE sin subir el precio.",
};
