import {
  budgetOptionToFormValues,
  runBudgetCalculation,
  type BudgetCalculation,
  type BudgetOptionRow,
} from "@/lib/agent/budget-calculation";
import { roundMoney } from "@/lib/agent/tool-result";

// La ganancia mensual exacta de un presupuesto, en pesos: lo que se cobra sin
// IVA menos lo que cuesta (horas, aportes, transporte y, si lleva, productos).
// Es la cuenta de la página del presupuesto. No es un importe para clientes:
// no entra al grounding. Puro, con prueba.

// En un cálculo, la ganancia del servicio y, con productos, la de los
// productos sumada.
export const calculationProfit = (calculation: BudgetCalculation) => ({
  withoutProducts: calculation.serviceRevenue,
  withProducts: calculation.withProducts
    ? roundMoney(calculation.serviceRevenue + calculation.productsRevenue)
    : null,
});

// Una opción guardada: su precio sin IVA guardado menos el costo que da el
// cálculo con sus insumos. Si el precio guardado es el calculado, da lo mismo
// que el cálculo; si se escribió a mano, es la ganancia de ese precio.
export const storedOptionProfit = (option: BudgetOptionRow, net: number) => {
  const calculation = runBudgetCalculation(
    budgetOptionToFormValues({ name: "", description: null, budgetOptions: [option] })
  );
  return roundMoney(net - calculation.serviceCost - (option.has_products ? calculation.products : 0));
};

// Una opción oficial: el precio sin IVA publicado menos el costo que se
// guardó al publicarla.
export const officialOptionProfit = (option: {
  hasProducts: boolean;
  netPrice: number;
  calculatedServiceCostBasis: number;
  productsCost: number;
}) =>
  roundMoney(
    Number(option.netPrice) -
      Number(option.calculatedServiceCostBasis) -
      (option.hasProducts ? Number(option.productsCost) : 0)
  );
