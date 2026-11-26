// Modelo puro de la vista de reglas de calendario (feature 73): etiquetas,
// avisos y filas. Sin React ni base, así lo prueba check:schedule-rules-board.
import { formatMinuteOfDay } from "@/lib/ops/minute-ranges";

export type BoardRule = {
  dayOfMonth: number | null;
  durationMinutes: number;
  endKey: string | null;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  id: string;
  interval: number;
  jobId: string;
  startKey: string;
  startTimeMinutes: number;
  weekdays: number[];
};

export type BoardJob = {
  id: string;
  name: string;
  rules: BoardRule[];
  serviceAddress: string | null;
  status: string;
};

export type BoardFilter = "all" | "none" | "warn";
export type JobWarning = { ruleId: string | null; text: string };

export const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
export const DAY_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
export const DAY_LETTERS = ["L", "M", "X", "J", "V", "S", "D"];
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export const clock = (minutes: number) => formatMinuteOfDay(((minutes % 1440) + 1440) % 1440);

export const durationLabel = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${rest}` : `${hours} h`;
};

export const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

export const dayLabel = (key: string) => `${Number(key.slice(8, 10))} ${MONTHS[Number(key.slice(5, 7)) - 1]}`;

export const monthShort = (key: string) => MONTHS[Number(key.slice(5, 7)) - 1];

export const ruleDays = (rule: Pick<BoardRule, "frequency" | "weekdays">) =>
  rule.frequency === "DAILY" ? [1, 2, 3, 4, 5, 6, 7] : rule.frequency === "WEEKLY" ? rule.weekdays : [];

export const isEndedRule = (rule: Pick<BoardRule, "endKey">, todayKey: string) =>
  Boolean(rule.endKey && rule.endKey < todayKey);

const everyLabel = (rule: BoardRule) => {
  if (rule.interval <= 1) return "";
  if (rule.frequency === "WEEKLY") return ` · cada ${rule.interval} semanas`;
  if (rule.frequency === "MONTHLY") return ` · cada ${rule.interval} meses`;
  return "";
};

export const ruleDaysLabel = (rule: BoardRule) => {
  if (rule.frequency === "DAILY") return rule.interval > 1 ? `Cada ${rule.interval} días` : "Todos los días";
  if (rule.frequency === "MONTHLY") return `Día ${rule.dayOfMonth} de cada mes${everyLabel(rule)}`;
  const days = rule.weekdays.join() === "1,2,3,4,5" ? "Lunes a viernes" : rule.weekdays.map((day) => DAY_SHORT[day - 1]).join(", ");
  return `${days}${everyLabel(rule)}`;
};

export const ruleRangeLabel = (rule: BoardRule) => `${clock(rule.startTimeMinutes)} a ${clock(rule.startTimeMinutes + rule.durationMinutes)}`;

export const ruleTimeLabel = (rule: BoardRule) => `${ruleRangeLabel(rule)} · ${durationLabel(rule.durationMinutes)}`;

export const ruleValidityLabel = (rule: BoardRule) =>
  `Desde ${dayLabel(rule.startKey)}${rule.endKey ? ` hasta ${dayLabel(rule.endKey)}` : ", sin fecha final"}`;

const datesOverlap = (left: BoardRule, right: BoardRule) =>
  (!left.endKey || left.endKey >= right.startKey) && (!right.endKey || right.endKey >= left.startKey);

const timesOverlap = (left: BoardRule, right: BoardRule) =>
  left.startTimeMinutes < right.startTimeMinutes + right.durationMinutes &&
  right.startTimeMinutes < left.startTimeMinutes + left.durationMinutes;

// Avisos de un trabajo: sin horario, dos horarios que se cruzan el mismo día y
// horarios vencidos. flagged son las reglas que se cruzan.
export const getJobWarnings = (job: BoardJob, todayKey: string) => {
  const list: JobWarning[] = [];
  const flagged = new Set<string>();
  if (!job.rules.length) list.push({ ruleId: null, text: "Sin horario" });

  const live = job.rules.filter((rule) => !isEndedRule(rule, todayKey) && rule.frequency !== "MONTHLY");
  live.forEach((left, index) => {
    live.slice(index + 1).forEach((right) => {
      const day = ruleDays(left).find((value) => ruleDays(right).includes(value));
      if (!day || !timesOverlap(left, right) || !datesOverlap(left, right)) return;
      list.push({ ruleId: right.id, text: `Dos horarios se cruzan el ${DAY_NAMES[day - 1].toLowerCase()}` });
      flagged.add(left.id);
      flagged.add(right.id);
    });
  });

  job.rules
    .filter((rule) => isEndedRule(rule, todayKey))
    .forEach((rule) => list.push({ ruleId: rule.id, text: `Un horario venció el ${dayLabel(rule.endKey ?? "")}` }));

  return { flagged, list };
};

export const hasRuleWarnings = (warnings: JobWarning[]) => warnings.some((warning) => warning.ruleId);

export const matchesBoardFilter = (job: BoardJob, warnings: JobWarning[], filter: BoardFilter) =>
  filter === "all" || (filter === "none" ? !job.rules.length : hasRuleWarnings(warnings));

export const matchesBoardSearch = (job: BoardJob, query: string) => {
  const needle = query.trim().toLowerCase();
  return !needle || `${job.name} ${job.serviceAddress ?? ""}`.toLowerCase().includes(needle);
};

// Cuántos trabajos tienen algún horario vigente cada día de la semana.
export const countJobsByWeekday = (jobs: BoardJob[], todayKey: string) =>
  [1, 2, 3, 4, 5, 6, 7].map(
    (day) => jobs.filter((job) => job.rules.some((rule) => !isEndedRule(rule, todayKey) && ruleDays(rule).includes(day))).length
  );

export const rulesOnWeekday = (job: BoardJob, day: number) =>
  job.rules.filter((rule) => rule.frequency !== "MONTHLY" && ruleDays(rule).includes(day));

export const monthlyRules = (job: BoardJob) => job.rules.filter((rule) => rule.frequency === "MONTHLY");
