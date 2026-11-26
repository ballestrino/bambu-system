// Formulario de un horario (feature 73): estado, validación y lo que se manda
// a crear o actualizar la regla.
import { dayStartUtc } from "@/lib/ops/schedule-rule-cleanup-window";
import { parseWeekDateKey, toLocalDateKey } from "@/lib/ops/schedule-week";
import { addLocalDays, addLocalMonths, DEFAULT_OPS_TIMEZONE } from "@/lib/ops/timezone";

import { clock, type BoardRule } from "@/components/ops/schedule-rules/schedule-rules-model";

export type RuleFrequency = BoardRule["frequency"];

export type RuleFormState = {
  applyFrom: string;
  dayOfMonth: string;
  end: string;
  endKey: string;
  frequency: RuleFrequency;
  generate: boolean;
  interval: string;
  // La regla que se edita (null al crear): limpiar o deshacer le cambian las
  // fechas y el formulario abierto las sigue.
  ruleId: string | null;
  start: string;
  startKey: string;
  weekdays: number[];
};

const toMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return Number.isFinite(hours) ? hours * 60 + (minutes || 0) : NaN;
};

export const ruleToForm = (rule: BoardRule, todayKey: string): RuleFormState => ({
  applyFrom: todayKey,
  dayOfMonth: String(rule.dayOfMonth ?? Number(rule.startKey.slice(8, 10))),
  end: clock(rule.startTimeMinutes + rule.durationMinutes),
  endKey: rule.endKey ?? "",
  frequency: rule.frequency,
  generate: false,
  interval: String(rule.interval),
  ruleId: rule.id,
  start: clock(rule.startTimeMinutes),
  startKey: rule.startKey,
  weekdays: [...rule.weekdays],
});

export const newRuleForm = (frequency: RuleFrequency, weekday: number | null, todayKey: string): RuleFormState => ({
  applyFrom: todayKey,
  dayOfMonth: String(Number(todayKey.slice(8, 10))),
  end: "11:00",
  endKey: "",
  frequency,
  generate: true,
  interval: "1",
  ruleId: null,
  start: "09:00",
  startKey: todayKey,
  weekdays: weekday ? [weekday] : [1],
});

export const formDurationMinutes = (form: RuleFormState) => toMinutes(form.end) - toMinutes(form.start);

export const ruleFormError = (form: RuleFormState) => {
  const interval = Number(form.interval);
  const dayOfMonth = Number(form.dayOfMonth);
  if (form.frequency === "WEEKLY" && !form.weekdays.length) return "Falta elegir al menos un día.";
  if (!Number.isInteger(interval) || interval < 1) return "La repetición tiene que ser un número entero desde 1.";
  if (form.frequency === "MONTHLY" && (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31)) {
    return "El día del mes va del 1 al 31.";
  }
  if (!(formDurationMinutes(form) > 0)) return "La hora de salida tiene que ser después de la de entrada.";
  if (!parseWeekDateKey(form.startKey)) return "Falta la fecha de inicio.";
  if (form.endKey && form.endKey < form.startKey) return "La fecha final no puede ser anterior a la inicial.";
  return "";
};

export const formToRuleValues = (form: RuleFormState) => ({
  dayOfMonth: form.frequency === "MONTHLY" ? Number(form.dayOfMonth) : null,
  durationMinutes: formDurationMinutes(form),
  endDate: form.endKey ? dayStartUtc(form.endKey) : null,
  frequency: form.frequency,
  interval: Number(form.interval),
  isActive: true,
  startDate: dayStartUtc(form.startKey),
  startTimeMinutes: toMinutes(form.start),
  timezone: DEFAULT_OPS_TIMEZONE,
  weekdays: form.frequency === "WEEKLY" ? [...form.weekdays].sort((a, b) => a - b) : [],
});

// Hasta dónde se generan las visitas de un horario nuevo: desde que empieza (o
// desde hoy) hasta fin del mes siguiente, sin pasar la fecha final.
export const generateRangeFor = (form: RuleFormState, todayKey: string) => {
  const startDate = form.startKey > todayKey ? form.startKey : todayKey;
  const base = parseWeekDateKey(startDate);
  if (!base) return null;
  const monthEnd = toLocalDateKey(addLocalDays(addLocalMonths({ ...base, day: 1 }, 2), -1));
  const endDate = form.endKey && form.endKey < monthEnd ? form.endKey : monthEnd;
  return endDate >= startDate ? { endDate, startDate } : null;
};
