import type { CreditNoteView } from "@/data/billing/credit-note";
import { CREDIT_REASON_MAX } from "@/lib/billing/credit-note-plan";

export type CreditMode = "full" | "partial";

// Lo que se está armando: el alcance, el monto sin IVA por línea (parcial) y la razón.
export type CreditDraft = { amounts: Record<number, number>; mode: CreditMode; reason: string };

const round = (amount: number) => Math.round(amount * 100) / 100;

// Montos que se pueden pedir por la URL (el agente prepara la nota y la abre
// acá): "0:1200,2:500" → { 0: 1200, 2: 500 }.
export const parseAmountsParam = (value: string | undefined) => {
  const amounts: Record<number, number> = {};
  for (const part of value?.split(",") ?? []) {
    const [index, amount] = part.split(":").map(Number);
    if (Number.isInteger(index) && index >= 0 && Number.isFinite(amount) && amount > 0) amounts[index] = round(amount);
  }
  return amounts;
};

// El total como lo calcula el servidor (getItemsTotal): sin IVA más el IVA de
// cada línea, redondeado al final. Por el total, cada línea entera.
export const getCreditTotals = (view: CreditNoteView, draft: CreditDraft) => {
  const lines = view.invoice.lines.map((line) => {
    const amount = draft.mode === "full" ? line.subtotal : Math.min(draft.amounts[line.index] ?? 0, line.subtotal);
    return { amount, iva: amount * line.taxRate, line };
  });
  const credited = lines.filter((line) => line.amount > 0);
  const subtotal = round(credited.reduce((sum, line) => sum + line.amount, 0));
  const total = round(credited.reduce((sum, line) => sum + line.amount + line.iva, 0));
  return { count: credited.length, iva: round(total - subtotal), lines, subtotal, total };
};

// Lo que falta para emitir, como en el diseño (la lista amarilla del resumen).
export const getCreditProblems = (view: CreditNoteView, draft: CreditDraft) => {
  if (view.blocker) return [view.blocker];
  const problems: string[] = [];
  const totals = getCreditTotals(view, draft);
  if (!view.biller.configured) problems.push(view.biller.message ?? "Biller no está configurado");
  else if (!view.biller.issueEnabled) problems.push("Emitir está apagado (BILLER_ISSUE_ENABLED=false)");
  if (draft.mode === "full" && view.credited > 0) problems.push("Ya tiene una nota parcial: hacé otra parcial por lo que queda");
  if (draft.mode === "partial") {
    const over = view.invoice.lines.find((line) => (draft.amounts[line.index] ?? 0) > line.subtotal + 0.01);
    if (over) problems.push(`"${over.concepto}" no puede acreditar más que su subtotal`);
    if (!totals.count) problems.push("Poné el monto a acreditar en al menos una línea");
    if (totals.total > view.remaining + 1) problems.push("La nota supera lo que queda por acreditar de la factura");
  }
  if (!draft.reason.trim()) problems.push("Falta la razón de la nota");
  if (draft.reason.trim().length > CREDIT_REASON_MAX) problems.push(`La razón va hasta ${CREDIT_REASON_MAX} caracteres`);
  return problems;
};

// Lo que se manda a issueCreditNote: lo que se ve (regla 2).
export const toCreditRequest = (view: CreditNoteView, draft: CreditDraft) => {
  const totals = getCreditTotals(view, draft);
  const base = { credited: view.credited, invoiceId: view.invoice.id, reason: draft.reason.trim(), total: totals.total };
  return draft.mode === "full"
    ? { ...base, mode: "full" as const }
    : {
        ...base,
        lines: totals.lines.filter((line) => line.amount > 0).map((line) => ({ amount: line.amount, index: line.line.index })),
        mode: "partial" as const,
      };
};
