import { calculateEffectiveVisits } from "@/lib/budget-calculations";
import { getJobBudgetPrice } from "@/lib/ops/job-budget-pricing";

export type JobExportSource = {
  budgetIncludesIva: boolean;
  budgetSnapshot?: unknown;
  createdAt: Date | string;
  description?: string | null;
  jobType: string;
  name: string;
  operationalNotes?: string | null;
  punctualEndDate?: Date | string | null;
  punctualStartDate?: Date | string | null;
  serviceAddress?: string | null;
  sourceBudget?: { name: string } | null;
  sourceBudgetOption?: unknown | null;
  updatedAt: Date | string;
};

export type JobExportRow = {
  budgetName: string;
  createdAt: Date | null;
  description: string;
  employees: number | null;
  hasProducts: boolean | null;
  hourlyPrice: number | null;
  hoursPerVisit: number | null;
  jobType: string;
  name: string;
  operationalNotes: string;
  price: number | null;
  productsCost: number | null;
  punctualEndDate: Date | null;
  punctualStartDate: Date | null;
  serviceAddress: string;
  totalHours: number | null;
  updatedAt: Date | null;
  visitFrequency: string;
  visits: number | null;
};

const jobTypeLabels: Record<string, string> = {
  ONGOING: "Recurrente",
  PUNCTUAL: "Puntual",
};

const visitTypeLabels: Record<string, string> = {
  days: "Por periodo",
  month: "Mensual",
  week: "Semanal",
};

const toRecord = (value: unknown) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readValue = (record: Record<string, unknown> | null, ...keys: string[]) =>
  keys.map((key) => record?.[key]).find((value) => value !== undefined);

const readNumber = (record: Record<string, unknown> | null, ...keys: string[]) => {
  const rawValue = readValue(record, ...keys);
  const value = Number(rawValue);
  return rawValue !== null && rawValue !== undefined && Number.isFinite(value)
    ? value
    : null;
};

const readString = (record: Record<string, unknown> | null, ...keys: string[]) => {
  const value = readValue(record, ...keys);
  return typeof value === "string" ? value : "";
};

const readBoolean = (record: Record<string, unknown> | null, ...keys: string[]) => {
  const value = readValue(record, ...keys);
  return typeof value === "boolean" ? value : null;
};

const toDate = (value: Date | string | null | undefined) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const round = (value: number) => Number(value.toFixed(2));

export const buildJobExportRows = (jobs: JobExportSource[]): JobExportRow[] =>
  jobs.map((job) => {
    const snapshot = toRecord(job.budgetSnapshot);
    const option = toRecord(snapshot?.option) ?? toRecord(job.sourceBudgetOption);
    const snapshotBudget = toRecord(snapshot?.budget);
    const visits = readNumber(option, "visits");
    const visitType = readString(option, "visitType", "visit_type");
    const hoursPerVisit = readNumber(option, "hoursPerVisit", "hours_per_visit");
    const employees = readNumber(option, "employees");
    const totalHours =
      visits !== null && hoursPerVisit !== null && employees !== null
        ? round(calculateEffectiveVisits(visits, visitType) * hoursPerVisit * employees)
        : null;
    const price = getJobBudgetPrice(job);

    return {
      budgetName: job.sourceBudget?.name ?? readString(snapshotBudget, "name"),
      createdAt: toDate(job.createdAt),
      description: job.description ?? "",
      employees,
      hasProducts: readBoolean(option, "hasProducts", "has_products"),
      hourlyPrice: price !== null && totalHours ? round(price / totalHours) : null,
      hoursPerVisit,
      jobType: jobTypeLabels[job.jobType] ?? job.jobType,
      name: job.name,
      operationalNotes: job.operationalNotes ?? "",
      price,
      productsCost: readNumber(option, "productsPrice", "products_price"),
      punctualEndDate: toDate(job.punctualEndDate),
      punctualStartDate: toDate(job.punctualStartDate),
      serviceAddress: job.serviceAddress ?? "",
      totalHours,
      updatedAt: toDate(job.updatedAt),
      visitFrequency: visitTypeLabels[visitType] ?? visitType,
      visits,
    };
  });
