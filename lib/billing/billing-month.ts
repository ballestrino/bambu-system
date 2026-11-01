import { DEFAULT_OPS_TIMEZONE, getLocalDateTime, zonedTimeToUtc } from "@/lib/ops/timezone";

// Un período de facturación es el primer día del mes en UTC, como
// JobClientPayment.assignedMonth. Biller fecha en hora de Montevideo.
export const BILLING_TIME_ZONE = DEFAULT_OPS_TIMEZONE;

const PERIOD_KEY = /^(\d{4})-(0[1-9]|1[0-2])$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (value: number) => String(value).padStart(2, "0");

export const parseBillingPeriod = (key: string) => {
  const match = PERIOD_KEY.exec(key);
  return match ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1)) : null;
};

export const getBillingPeriodKey = (period: Date) =>
  `${period.getUTCFullYear()}-${pad(period.getUTCMonth() + 1)}`;

export const addBillingMonths = (period: Date, months: number) =>
  new Date(Date.UTC(period.getUTCFullYear(), period.getUTCMonth() + months, 1));

export const getCurrentBillingPeriod = (now: Date) => {
  const local = getLocalDateTime(now, BILLING_TIME_ZONE);
  return new Date(Date.UTC(local.year, local.month - 1, 1));
};

// "2026-10-15" (fecha de emisión de Biller) → Date de esa fecha en UTC, como
// guarda Prisma una columna @db.Date.
export const parseIssueDate = (value: string) => {
  const match = ISO_DATE.exec(value);
  return match ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))) : null;
};

export const getPeriodOfIssueDate = (issueDate: Date) =>
  new Date(Date.UTC(issueDate.getUTCFullYear(), issueDate.getUTCMonth(), 1));

export const getIssueDateRange = (period: Date) => ({
  gte: period,
  lt: addBillingMonths(period, 1),
});

const formatBillerDateTime = (local: { year: number; month: number; day: number; hour?: number; minute?: number; second?: number }) =>
  `${local.year}-${pad(local.month)}-${pad(local.day)} ${pad(local.hour ?? 0)}:${pad(local.minute ?? 0)}:${pad(local.second ?? 0)}`;

// "2026-10-30 11:57:05" de Biller (hora de Montevideo) → instante UTC.
export const parseBillerDateTime = (value: string | null | undefined) => {
  const match = value ? /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(value) : null;
  if (!match) return null;
  const [year, month, day, hour, minute, second] = match.slice(1).map(Number);
  return zonedTimeToUtc({ year, month, day, hour, minute, second }, BILLING_TIME_ZONE);
};

// obtener filtra por fecha de creación, no de emisión. Una factura del mes M
// puede crearse hasta dos meses antes (Biller acepta fechas futuras hasta dos
// meses) o después (una fecha pasada), así que se trae de M-2 a M+1 y el
// resumen filtra por fecha de emisión. El final no pasa de ahora.
export const getSyncCreationWindow = (period: Date, now: Date) => {
  const from = addBillingMonths(period, -2);
  const end = addBillingMonths(period, 2);
  const local = getLocalDateTime(now, BILLING_TIME_ZONE);
  const nowKey = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second);
  const to = end.getTime() <= nowKey
    ? { year: end.getUTCFullYear(), month: end.getUTCMonth() + 1, day: 1 }
    : local;
  return {
    from: formatBillerDateTime({ year: from.getUTCFullYear(), month: from.getUTCMonth() + 1, day: 1 }),
    to: formatBillerDateTime(to),
  };
};

// Para buscar por numero_interno lo que Bambú pudo haber emitido: lo creado
// desde el primer día de hace tres meses hasta mañana.
export const getLookupCreationWindow = (now: Date) => {
  const local = getLocalDateTime(now, BILLING_TIME_ZONE);
  const from = new Date(Date.UTC(local.year, local.month - 4, 1));
  const to = new Date(Date.UTC(local.year, local.month - 1, local.day + 1));
  const day = (date: Date) => ({ year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() });
  return { from: formatBillerDateTime(day(from)), to: formatBillerDateTime(day(to)) };
};
