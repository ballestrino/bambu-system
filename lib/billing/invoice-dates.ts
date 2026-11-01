import { PAYMENT_FORM } from "@/lib/billing/draft-repeat";

// Fechas de emisión y vencimiento por defecto (features 49 y 50,
// docs/billing.md): se factura del 1 al 10. Puro: lo usan el lote al emitir,
// el editor lateral, Nueva factura y el agente. Una factura del borrador
// guarda una fecha solo si la persona la eligió distinta de la de por defecto
// (issueDate y dueDate en la fila); si no, se calcula al emitir.
const DAY_MS = 24 * 60 * 60 * 1000;
// Vence el 10 del mes de emisión; emitida después del 10, a los 5 días.
export const BILLING_DUE_DAY = 10;
export const LATE_DUE_DAYS = 5;

export const toIsoDay = (date: Date) => date.toISOString().slice(0, 10);

export const parseIsoDay = (text: string | null | undefined) =>
  text && /^\d{4}-\d{2}-\d{2}$/.test(text) ? new Date(`${text}T00:00:00Z`) : null;

export const addDays = (day: Date, days: number) => new Date(day.getTime() + days * DAY_MS);

// La emisión: el día en que se emite, o el 1 del mes si se factura un mes
// antes de que empiece (un borrador de noviembre emitido el 30 de octubre sale
// el 1 de noviembre y cuenta en noviembre). `period` es el primer día del mes.
export const getDefaultIssueDate = (today: Date, period: Date) => (today < period ? period : today);

// El vencimiento: el 10 del mes de emisión; emitida después del 10, a los 5 días.
export const getDefaultDueDate = (issueDate: Date) =>
  issueDate.getUTCDate() <= BILLING_DUE_DAY
    ? new Date(Date.UTC(issueDate.getUTCFullYear(), issueDate.getUTCMonth(), BILLING_DUE_DAY))
    : addDays(issueDate, LATE_DUE_DAYS);

// Lo mismo con fechas aaaa-mm-dd y el mes aaaa-mm, para los formularios.
export const getDefaultIssueDay = (today: string, periodKey: string) => {
  const day = parseIsoDay(today);
  const period = parseIsoDay(`${periodKey}-01`);
  return day && period ? toIsoDay(getDefaultIssueDate(day, period)) : today;
};

export const getDefaultDueDay = (issueDay: string) => {
  const day = parseIsoDay(issueDay);
  return day ? toIsoDay(getDefaultDueDate(day)) : "";
};

export type DraftDatesInput = {
  explicitDue: Date | null;
  explicitIssue: Date | null;
  paymentForm: number;
  period: Date;
  today: Date;
};

// Las fechas con que sale una factura del borrador: las elegidas o las de
// por defecto. Un vencimiento elegido que queda antes de la emisión se
// ignora (vuelve al de por defecto). De contado no hay vencimiento.
export const resolveDraftDates = (input: DraftDatesInput) => {
  const issueDate = input.explicitIssue ?? getDefaultIssueDate(input.today, input.period);
  if (input.paymentForm !== PAYMENT_FORM.CREDIT) return { dueDate: null, issueDate };
  const explicit = input.explicitDue && input.explicitDue >= issueDate ? input.explicitDue : null;
  return { dueDate: explicit ?? getDefaultDueDate(issueDate), issueDate };
};

// Lo que se guarda al editar: cada fecha solo si difiere de la de por
// defecto, así una factura sin tocar sale con la fecha del día en que se
// emite y vence según la regla.
export const pickExplicitDates = (
  form: { dueDate: string; issueDate: string; paymentForm: number },
  input: Pick<DraftDatesInput, "period" | "today">
) => {
  const issue = parseIsoDay(form.issueDate);
  const defaultIssue = getDefaultIssueDate(input.today, input.period);
  const explicitIssue = issue && toIsoDay(issue) !== toIsoDay(defaultIssue) ? issue : null;
  if (form.paymentForm !== PAYMENT_FORM.CREDIT) return { dueDate: null, issueDate: explicitIssue };
  const due = parseIsoDay(form.dueDate);
  const defaultDue = getDefaultDueDate(issue ?? defaultIssue);
  const explicitDue = due && toIsoDay(due) !== toIsoDay(defaultDue) ? due : null;
  return { dueDate: explicitDue, issueDate: explicitIssue };
};
