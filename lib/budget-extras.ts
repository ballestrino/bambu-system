import { BudgetExtraSchema, type BudgetExtra } from "@/schemas/BudgetSchema";

// Los extras se guardan como JSON en BudgetOption. Lo que no tenga la forma
// esperada se ignora: un dato viejo o roto nunca rompe el cálculo.
export const readBudgetExtras = (value: unknown): BudgetExtra[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    const parsed = BudgetExtraSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
};

// El cálculo suma cualquier monto válido aunque el extra todavía no tenga
// nombre: el resumen en vivo acompaña lo que se va escribiendo.
export const sumBudgetExtras = (value: unknown) => {
  if (!Array.isArray(value)) return 0;

  return value.reduce<number>((total, item) => {
    const amount = Number((item as { amount?: unknown } | null)?.amount);
    return Number.isFinite(amount) && amount > 0 ? total + amount : total;
  }, 0);
};
