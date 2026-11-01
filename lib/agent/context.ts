import "server-only";

import { getBudgetById } from "@/data/budget";
import {
  budgetOptionToFormValues,
  getCalculationAmounts,
  getStoredOptionAmounts,
  runBudgetCalculation,
  withEffectiveIva,
} from "@/lib/agent/budget-calculation";
import { formatMonthLabel } from "@/lib/agent/month";
import { getLastIndicator } from "@/lib/billing/invoice-defaults";
import { getIssueDay } from "@/lib/billing/issue-payload";
import type { NewInvoiceForm } from "@/lib/billing/new-invoice";
import {
  formatNewInvoiceContext,
  getNewInvoiceFormAmounts,
  sanitizeNewInvoiceForm,
} from "@/lib/billing/new-invoice-agent-context";
import { db } from "@/lib/db";
import { formatBudgetForAI } from "@/lib/format-budget";
import type { AgentBudgetContextInput } from "@/schemas/agent";
import { defaultBudgetValues, type BudgetFormValues } from "@/schemas/BudgetSchema";

// El formulario de Nueva factura del turno (feature 46). `current` lo
// actualiza fillInvoiceForm después de cada llamada: dos llamadas en un mismo
// turno parten de lo que dejó la anterior, como la página.
export type InvoiceFormContext = { current: NewInvoiceForm; today: string };

// Tasa básica si todavía no hay ninguna factura emitida (como la página).
const FALLBACK_INDICATOR = 3;

// El presupuesto que el usuario está mirando. Guardado: lectura fresca en cada
// turno. Formulario: los valores sin guardar que manda el cliente. Los
// importes del contexto se pueden citar, igual que los de una tool.
export type ResolvedBudgetContext = {
  kind: "saved" | "form" | "billing" | null;
  budgetId: string | null;
  formValues: BudgetFormValues | null;
  // El mes que se mira en Facturación (AAAA-MM): las tools de facturación lo
  // usan cuando el pedido no dice otro.
  billingMonth: string | null;
  invoiceForm: InvoiceFormContext | null;
  text: string | null;
  amounts: number[];
};

const NO_CONTEXT: ResolvedBudgetContext = {
  kind: null,
  budgetId: null,
  formValues: null,
  billingMonth: null,
  invoiceForm: null,
  text: null,
  amounts: [],
};

export const resolveBudgetContext = async (
  input?: AgentBudgetContextInput
): Promise<ResolvedBudgetContext> => {
  if (!input) return NO_CONTEXT;

  if (input.kind === "billing") {
    return {
      ...NO_CONTEXT,
      kind: "billing",
      billingMonth: input.month,
      text: `El usuario está en Facturación, mirando ${formatMonthLabel(input.month)} (${input.month}). Si pide algo del borrador o de las facturas sin nombrar otro mes, es ese.`,
    };
  }

  // Nueva factura: una conversación de Facturación (su historial) con el
  // formulario sin emitir como contexto.
  if (input.kind === "new-invoice") {
    const today = getIssueDay(new Date()).toISOString().slice(0, 10);
    const form = sanitizeNewInvoiceForm(input.form, today, (await getLastIndicator(db)) ?? FALLBACK_INDICATOR);
    return {
      ...NO_CONTEXT,
      kind: "billing",
      billingMonth: input.month,
      invoiceForm: { current: form, today },
      text: formatNewInvoiceContext(form, today, formatMonthLabel(input.month)),
      amounts: getNewInvoiceFormAmounts(form),
    };
  }

  if (input.kind === "saved") {
    const budget = await getBudgetById(input.budgetId);
    if (!budget) {
      return { ...NO_CONTEXT, text: "El presupuesto de esta conversación ya no existe." };
    }
    const values = budgetOptionToFormValues(budget);
    // El slug va a la vista: sin él, el modelo inventaba uno para getBudget.
    const header = `Presupuesto guardado "${budget.name}" (slug ${budget.slug}). Para leerlo o calcular sobre él dejá el slug en null.`;
    return {
      ...NO_CONTEXT,
      kind: "saved",
      budgetId: budget.id,
      text: `${header}\n\n${formatBudgetForAI({
        name: budget.name,
        description: budget.description ?? undefined,
        budgetOptions: budget.budgetOptions,
      })}`,
      amounts: [
        ...getStoredOptionAmounts(budget.budgetOptions),
        ...getCalculationAmounts(runBudgetCalculation(values)),
      ],
    };
  }

  const raw: BudgetFormValues = { ...defaultBudgetValues, ...input.values };
  // Un IVA 0 en el formulario se calcula igual con 22: el agente usa ese.
  const values = withEffectiveIva(raw);
  const ivaNote =
    values.iva === raw.iva
      ? ""
      : `\n\nEl formulario tiene IVA ${raw.iva}: sus totales se calculan con ${values.iva} %, y el agente usa esos.`;
  return {
    ...NO_CONTEXT,
    kind: "form",
    formValues: values,
    text: `${formatBudgetForAI({ ...values, name: values.name || "Presupuesto sin guardar" })}${ivaNote}`,
    amounts: [
      ...getStoredOptionAmounts([{ price: values.price, iva: values.iva }]),
      ...getCalculationAmounts(runBudgetCalculation(values)),
    ],
  };
};
