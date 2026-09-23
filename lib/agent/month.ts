import { getPayrollWorkMonth } from "@/lib/ops/finance/payroll-period";
import {
  DEFAULT_OPS_TIMEZONE,
  getLocalDate,
  zonedTimeToUtc,
} from "@/lib/ops/timezone";

// Meses como "YYYY-MM" en hora de Montevideo. El servidor corre en UTC, así
// que no se puede usar getMonth(): el 1 de setiembre a las 00:00 en
// Montevideo todavía es agosto en UTC-0 hasta las 03:00.
export type MonthKey = `${number}-${string}`;

const MONTH_KEY_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

export const isMonthKey = (value: string): value is MonthKey =>
  MONTH_KEY_PATTERN.test(value);

export const parseMonthKey = (key: string) => {
  const match = key.match(MONTH_KEY_PATTERN);
  if (!match) throw new Error(`Mes inválido: "${key}". Usá el formato AAAA-MM.`);
  return { year: Number(match[1]), month: Number(match[2]) };
};

const toMonthKey = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, "0")}` as MonthKey;

export const getCurrentMonthKey = (now = new Date()) => {
  const today = getLocalDate(now, DEFAULT_OPS_TIMEZONE);
  return toMonthKey(today.year, today.month);
};

export const shiftMonthKey = (key: string, delta: number) => {
  const { year, month } = parseMonthKey(key);
  const shifted = new Date(Date.UTC(year, month - 1 + delta, 1));
  return toMonthKey(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1);
};

// La regla de mes vencido vive en getPayrollWorkMonth, que trabaja en hora
// local: se arma y se lee la fecha en local para que dé igual en cualquier
// zona horaria.
export const getPayrollWorkMonthKey = (paymentMonthKey: string) => {
  const { year, month } = parseMonthKey(paymentMonthKey);
  const workMonth = getPayrollWorkMonth(new Date(year, month - 1, 1));
  return toMonthKey(workMonth.getFullYear(), workMonth.getMonth() + 1);
};

// assignedMonth se guarda como inicio de mes en UTC: así lo leen los
// filtros financieros (getAssignedMonthRange).
export const toAssignedMonth = (key: string) => {
  const { year, month } = parseMonthKey(key);
  return new Date(Date.UTC(year, month - 1, 1));
};

// Rango de fechas reales (visitas) del mes en Montevideo, igual al que arma
// la pantalla con getMonthRange en el navegador.
export const getZonedMonthRange = (key: string) => {
  const { year, month } = parseMonthKey(key);
  const next = parseMonthKey(shiftMonthKey(key, 1));
  const start = zonedTimeToUtc({ year, month, day: 1 }, DEFAULT_OPS_TIMEZONE);
  const nextStart = zonedTimeToUtc(
    { year: next.year, month: next.month, day: 1 },
    DEFAULT_OPS_TIMEZONE
  );
  return { start, end: new Date(nextStart.getTime() - 1) };
};

const monthLabelFormat = new Intl.DateTimeFormat("es-UY", {
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});

// "setiembre de 2026", en minúscula porque va en medio de la frase.
export const formatMonthLabel = (key: string) =>
  monthLabelFormat.format(toAssignedMonth(key)).toLocaleLowerCase("es-UY");

const todayFormat = new Intl.DateTimeFormat("es-UY", {
  dateStyle: "full",
  timeZone: DEFAULT_OPS_TIMEZONE,
});

export const formatToday = (now = new Date()) => todayFormat.format(now);
