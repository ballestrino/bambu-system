import {
  addLocalDays,
  compareLocalDates,
  DEFAULT_OPS_TIMEZONE,
  getIsoWeekday,
  getLocalDateTime,
  type LocalDate,
  zonedTimeToUtc,
} from "@/lib/ops/timezone";

// Horarios de visitas en hora de Montevideo. El modelo lee y escribe
// "AAAA-MM-DD HH:mm", el mismo formato que devuelve queryOperations. Puro.
const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/;

const pad = (value: number) => String(value).padStart(2, "0");

// null si no es una fecha y hora reales: 2026-02-30 o 24:00 no dan la vuelta.
export const parseLocalDateTime = (value: string, timeZone = DEFAULT_OPS_TIMEZONE) => {
  const match = LOCAL_DATE_TIME.exec(value.trim());
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  const date = zonedTimeToUtc({ day, hour, minute, month, year }, timeZone);
  const back = getLocalDateTime(date, timeZone);
  const same =
    back.year === year && back.month === month && back.day === day && back.hour === hour && back.minute === minute;
  return same ? date : null;
};

export const formatLocalDateTime = (date: Date, timeZone = DEFAULT_OPS_TIMEZONE) => {
  const local = getLocalDateTime(date, timeZone);
  return `${local.year}-${pad(local.month)}-${pad(local.day)} ${pad(local.hour)}:${pad(local.minute)}`;
};

const dayFormat = new Intl.DateTimeFormat("es-UY", {
  day: "2-digit",
  month: "2-digit",
  timeZone: DEFAULT_OPS_TIMEZONE,
  weekday: "short",
});
const timeFormat = new Intl.DateTimeFormat("es-UY", {
  hour: "2-digit",
  hourCycle: "h23",
  minute: "2-digit",
  timeZone: DEFAULT_OPS_TIMEZONE,
});

const formatDay = (date: Date) => dayFormat.format(date).replace(",", "").replace(".", "");

// "mar 21/10 09:00–13:00", o con los dos días si cruza la medianoche.
export const formatVisitRange = (start: Date, end: Date) => {
  const startDay = formatDay(start);
  const endDay = formatDay(end);
  const endText = startDay === endDay ? timeFormat.format(end) : `${endDay} ${timeFormat.format(end)}`;
  return `${startDay} ${timeFormat.format(start)}–${endText}`;
};

const LOCAL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

// null si no es un día real: 2026-02-30 no da la vuelta.
export const parseLocalDate = (value: string): LocalDate | null => {
  const match = LOCAL_DATE.exec(value.trim());
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const back = addLocalDays({ day, month, year }, 0);
  return back.year === year && back.month === month && back.day === day ? back : null;
};

export const formatLocalDate = (date: LocalDate) => `${date.year}-${pad(date.month)}-${pad(date.day)}`;

// Un rango que se repite puede cubrir hasta un año; el tope de visitas va
// aparte, en el builder.
const MAX_RANGE_DAYS = 366;

export type VisitDatesInput = {
  dates: string[] | null;
  repeatFrom: string | null;
  repeatTo: string | null;
  repeatWeekdays: number[] | null;
};

type ExpandedDates = { ok: true; dates: LocalDate[] } | { ok: false; code: string; message: string };

const refuse = (code: string, message: string): ExpandedDates => ({ ok: false, code, message });

// Los días de un lote, ordenados y sin repetir: una lista explícita o los días
// de la semana (1 lunes … 7 domingo) de un rango, ambos extremos incluidos. El
// modelo nunca hace cuentas de calendario.
export const expandVisitDates = (raw: VisitDatesInput): ExpandedDates => {
  // Una lista vacía cuenta como no mandada: los modelos a veces mandan [].
  const input = {
    ...raw,
    dates: raw.dates?.length ? raw.dates : null,
    repeatWeekdays: raw.repeatWeekdays?.length ? raw.repeatWeekdays : null,
  };
  const repeat = [input.repeatFrom, input.repeatTo, input.repeatWeekdays];
  const hasRepeat = repeat.some((value) => value !== null);
  if (input.dates !== null && hasRepeat) {
    return refuse("invalid_dates", "Mandá dates o repeatFrom, repeatTo y repeatWeekdays, no los dos.");
  }

  let days: LocalDate[] = [];
  if (input.dates !== null) {
    for (const value of input.dates) {
      const day = parseLocalDate(value);
      if (!day) return refuse("invalid_dates", `${value} no es un día válido: usá AAAA-MM-DD.`);
      days.push(day);
    }
  } else {
    if (repeat.some((value) => value === null)) {
      return refuse("invalid_dates", "Mandá dates, o repeatFrom, repeatTo y repeatWeekdays juntos.");
    }
    const from = parseLocalDate(input.repeatFrom!);
    const to = parseLocalDate(input.repeatTo!);
    if (!from || !to) return refuse("invalid_dates", "repeatFrom y repeatTo van como AAAA-MM-DD.");
    if (compareLocalDates(to, from) < 0) return refuse("invalid_dates", "repeatTo no puede ser anterior a repeatFrom.");
    const weekdays = new Set(input.repeatWeekdays);
    if ([...weekdays].some((weekday) => !Number.isInteger(weekday) || weekday < 1 || weekday > 7)) {
      return refuse("invalid_dates", "repeatWeekdays va de 1 (lunes) a 7 (domingo).");
    }
    for (let day = from, count = 0; compareLocalDates(day, to) <= 0; day = addLocalDays(day, 1), count += 1) {
      if (count >= MAX_RANGE_DAYS) return refuse("invalid_dates", "El rango no puede pasar de un año.");
      if (weekdays.has(getIsoWeekday(day))) days.push(day);
    }
  }

  const unique = new Map(days.map((day) => [formatLocalDate(day), day]));
  days = [...unique.values()].sort(compareLocalDates);
  return { ok: true, dates: days };
};
