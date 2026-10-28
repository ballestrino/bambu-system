import { profitabilityNeedsAttention } from "@/components/ops/profitability/profitability-status";
import { opsFrequencyLabels } from "@/components/ops/shared/ops-theme";
import type { OpsJobListItem } from "@/components/ops/types";
import { getJobBudgetPrice } from "@/lib/ops/job-budget-pricing";
import type { JobProfitability } from "@/lib/ops/profitability";
import type { SortAccessors } from "@/lib/ops/table-query";
import type { jobStatusValues } from "@/schemas/ops";

// Filas de la tabla de Trabajos (diseño "Trabajos Bambu 1a"). El servidor
// filtra búsqueda, vista y archivo; las pestañas de estado y "Requiere
// atención" se filtran acá para poder contar cada pestaña.

export type JobStatusTab = (typeof jobStatusValues)[number] | "all";
export type JobsSortKey = "name" | "price";

export type JobRuleSummary = {
  dayOfMonth: number | null;
  frequency: keyof typeof opsFrequencyLabels;
  interval: number;
  isActive: boolean;
  jobId: string;
  weekdays: number[];
};

export type JobRow = {
  job: OpsJobListItem;
  location: string | null;
  needsAttention: boolean;
  price: number | null;
  profitability?: JobProfitability;
  typeDetail: string;
  typeLabel: string;
};

const weekdayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const shortDate = new Intl.DateTimeFormat("es-UY", { day: "numeric", month: "short" });

const describeRule = (rule: JobRuleSummary) => {
  const frequency = opsFrequencyLabels[rule.frequency];
  if (rule.frequency === "WEEKLY") {
    const days = [...rule.weekdays].sort((a, b) => a - b).map((day) => weekdayLabels[day - 1]);
    return `${frequency} · ${days.join(", ")}`;
  }
  if (rule.frequency === "MONTHLY") return `${frequency} · día ${rule.dayOfMonth ?? "-"}`;
  return rule.interval > 1 ? `Cada ${rule.interval} días` : frequency;
};

const describePeriod = (job: OpsJobListItem) => {
  if (!job.punctualStartDate || !job.punctualEndDate) return "Sin período cargado";
  const start = shortDate.format(new Date(job.punctualStartDate)).replace(".", "");
  const end = shortDate.format(new Date(job.punctualEndDate)).replace(".", "");
  return start === end ? start : `${start} – ${end}`;
};

const describeRules = (rules: JobRuleSummary[] = []) => {
  if (!rules.length) return "Sin regla de visitas";
  const [first, ...rest] = rules;
  return rest.length ? `${describeRule(first)} · +${rest.length}` : describeRule(first);
};

export const buildJobRows = (
  jobs: OpsJobListItem[],
  profitabilityByJob: Map<string, JobProfitability>,
  rules: JobRuleSummary[]
): JobRow[] => {
  const rulesByJob = new Map<string, JobRuleSummary[]>();
  for (const rule of rules) {
    if (!rule.isActive) continue;
    rulesByJob.set(rule.jobId, [...(rulesByJob.get(rule.jobId) ?? []), rule]);
  }

  return jobs.map((job) => {
    const profitability = profitabilityByJob.get(job.id);
    const isPunctual = job.jobType === "PUNCTUAL";

    return {
      job,
      location: job.serviceLocation || job.serviceAddress || null,
      needsAttention: profitability ? profitabilityNeedsAttention(profitability.severity) : false,
      price: getJobBudgetPrice(job),
      profitability,
      typeDetail: isPunctual ? describePeriod(job) : describeRules(rulesByJob.get(job.id)),
      typeLabel: isPunctual ? "Puntual" : "Recurrente",
    };
  });
};

export const jobStatusTabs = (includeArchived: boolean): [JobStatusTab, string][] => [
  ["all", "Todos"],
  ["ACTIVE", "Activos"],
  ["PAUSED", "Pausados"],
  ["DRAFT", "Borradores"],
  ["COMPLETED", "Completados"],
  ...(includeArchived ? [["ARCHIVED", "Archivados"] as [JobStatusTab, string]] : []),
];

export const matchesJobRow = (
  row: JobRow,
  { attentionOnly, status }: { attentionOnly: boolean; status: JobStatusTab }
) =>
  (status === "all" || row.job.status === status) && (!attentionOnly || row.needsAttention);

export const jobSortAccessors: SortAccessors<JobRow, JobsSortKey> = {
  name: (row) => row.job.name,
  price: (row) => row.price,
};

const money = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 0 });

export const formatJobRowPrice = (price: number | null) =>
  price === null ? "Sin opción" : `$ ${money.format(price)}`;

export const pluralJobs = (count: number) => `${count} ${count === 1 ? "trabajo" : "trabajos"}`;
