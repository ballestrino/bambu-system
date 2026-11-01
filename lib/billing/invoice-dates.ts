import { PAYMENT_FORM } from "@/lib/billing/draft-repeat";

// Fechas de emisión y vencimiento de una factura del borrador (features 49 y
// 50). Puro: lo usan el lote al emitir, el editor lateral y Nueva factura.
// Una factura del borrador guarda una fecha solo si la persona la eligió
// distinta de la de por defecto (issueDate y dueDate en la fila); si no, se
// calcula al emitir.
const DAY_MS = 24 * 60 * 60 * 1000;
// Sin días de crédito guardados, el vencimiento arranca a 10 días.
export const DEFAULT_CREDIT_DAYS = 10;

export const toIsoDay = (date: Date) => date.toISOString().slice(0, 10);

export const parseIsoDay = (text: string | null | undefined) =>
  text && /^\d{4}-\d{2}-\d{2}$/.test(text) ? new Date(`${text}T00:00:00Z`) : null;

export const addDays = (day: Date, days: number) => new Date(day.getTime() + days * DAY_MS);

// La fecha de emisión por defecto: el día en que se emite.
export const getDefaultIssueDate = (today: Date) => today;

// El vencimiento por defecto de una factura a crédito: los días de crédito
// que trae (los de la factura de origen o los de una nueva), o 10.
export const getDefaultDueDate = (issueDate: Date, dueDays: number | null) =>
  addDays(issueDate, dueDays ?? DEFAULT_CREDIT_DAYS);

export type DraftDatesInput = {
  dueDays: number | null;
  explicitDue: Date | null;
  explicitIssue: Date | null;
  paymentForm: number;
  today: Date;
};

// Las fechas con que sale una factura del borrador: las elegidas o las de
// por defecto. Un vencimiento elegido que queda antes de la emisión se
// ignora (vuelve al de por defecto). De contado no hay vencimiento.
export const resolveDraftDates = (input: DraftDatesInput) => {
  const issueDate = input.explicitIssue ?? getDefaultIssueDate(input.today);
  if (input.paymentForm !== PAYMENT_FORM.CREDIT) return { dueDate: null, issueDate };
  const explicit = input.explicitDue && input.explicitDue >= issueDate ? input.explicitDue : null;
  return { dueDate: explicit ?? getDefaultDueDate(issueDate, input.dueDays), issueDate };
};

// Lo que se guarda al editar: cada fecha solo si difiere de la de por
// defecto, así una factura sin tocar sale con la fecha del día en que se
// emite.
export const pickExplicitDates = (
  form: { dueDate: string; issueDate: string; paymentForm: number },
  input: Omit<DraftDatesInput, "explicitDue" | "explicitIssue" | "paymentForm">
) => {
  const issue = parseIsoDay(form.issueDate);
  const defaultIssue = getDefaultIssueDate(input.today);
  const explicitIssue = issue && toIsoDay(issue) !== toIsoDay(defaultIssue) ? issue : null;
  if (form.paymentForm !== PAYMENT_FORM.CREDIT) return { dueDate: null, issueDate: explicitIssue };
  const due = parseIsoDay(form.dueDate);
  const defaults = resolveDraftDates({ ...input, explicitDue: null, explicitIssue, paymentForm: form.paymentForm });
  const explicitDue = due && defaults.dueDate && toIsoDay(due) !== toIsoDay(defaults.dueDate) ? due : null;
  return { dueDate: explicitDue, issueDate: explicitIssue };
};
