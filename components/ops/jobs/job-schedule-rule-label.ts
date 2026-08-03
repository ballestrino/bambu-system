import { opsFrequencyLabels } from "@/components/ops/shared";

export type JobScheduleRuleOption = {
  id: string;
  jobId: string;
  dayOfMonth: number | null;
  durationMinutes: number;
  frequency: "DAILY" | "MONTHLY" | "WEEKLY";
  interval: number;
  isActive: boolean;
  startTimeMinutes: number;
  weekdays: number[];
};

const weekdayLabels = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

const toClockLabel = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
    minutes % 60
  ).padStart(2, "0")}`;

const describeRule = (rule: JobScheduleRuleOption) => {
  if (rule.frequency === "WEEKLY") {
    return rule.weekdays.map((day) => weekdayLabels[day - 1]).join(", ");
  }

  if (rule.frequency === "MONTHLY") {
    return `Dia ${rule.dayOfMonth}`;
  }

  return `Cada ${rule.interval} dia(s)`;
};

export const getJobScheduleRuleOptionLabel = (rule: JobScheduleRuleOption) => {
  const activityLabel = rule.isActive ? "" : " · inactiva";

  return `${opsFrequencyLabels[rule.frequency]} · ${describeRule(rule)} · ${toClockLabel(
    rule.startTimeMinutes
  )} · ${rule.durationMinutes} min${activityLabel}`;
};
