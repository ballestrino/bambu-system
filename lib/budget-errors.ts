// El presupuesto cambió entre que se leyó y se quiso guardar. Lo lanza
// updateBudget dentro de su transacción cuando recibe expectedUpdatedAt (las
// propuestas del agente) y el updatedAt ya no coincide.
export const BUDGET_CHANGED_MESSAGE =
  "El presupuesto cambió mientras se guardaba: recargalo y volvé a intentar.";

export class BudgetChangedError extends Error {
  constructor() {
    super(BUDGET_CHANGED_MESSAGE);
    this.name = "BudgetChangedError";
  }
}
