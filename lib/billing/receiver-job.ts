import type { JobStatus } from "@prisma/client";

import type { InvoiceReceiverPayload } from "@/lib/billing/invoice-mapping";

// El vínculo receptor de Biller → trabajo de Bambú (feature 43). Puro: lo usan
// la página, la acción que vincula y el agente, que solo sugiere.

const normalize = (value: string) =>
  value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// El documento sin puntos ni guiones o, sin documento, el nombre normalizado.
// Un consumidor final sin datos no se vincula.
export const getReceiverKey = (receiver: InvoiceReceiverPayload | null) => {
  const document = receiver?.documento?.replace(/\D/g, "") ?? "";
  if (document.length >= 6) return document;
  const name = normalize(receiver?.razon_social || receiver?.nombre_fantasia || "");
  return name ? `nombre:${name}` : null;
};

// Palabras que no distinguen a un cliente de otro.
const STOP_WORDS = new Set(["sa", "srl", "sas", "ltda", "de", "del", "la", "las", "el", "los", "y", "e", "s", "a", "r", "l"]);
const words = (value: string | null | undefined) =>
  new Set(normalize(value ?? "").split(" ").filter((word) => word.length >= 3 && !STOP_WORDS.has(word)));

export type JobChoice = { id: string; name: string; scheduleName: string | null };

// Qué tan parecido es el receptor al trabajo (0 a 1): para cada par de
// nombres (razón social o fantasía contra nombre o nombre de agenda del
// trabajo), las palabras en común sobre las del más largo; vale el mejor par.
export const scoreJobMatch = (receiverNames: string[], job: JobChoice) => {
  let best = 0;
  for (const receiverName of receiverNames) {
    const receiver = words(receiverName);
    for (const jobName of [job.name, job.scheduleName]) {
      const target = words(jobName);
      if (!receiver.size || !target.size) continue;
      const shared = [...receiver].filter((word) => target.has(word)).length;
      best = Math.max(best, shared / Math.max(receiver.size, target.size));
    }
  }
  return best;
};

const MIN_SCORE = 0.6;

// Los trabajos que más se parecen al receptor (hasta 3), para sugerir el vínculo.
export const suggestJobs = (receiver: InvoiceReceiverPayload | null, jobs: JobChoice[], limit = 3) => {
  const names = [receiver?.razon_social, receiver?.nombre_fantasia].filter((name): name is string => Boolean(name));
  return jobs
    .map((job) => ({ job, score: scoreJobMatch(names, job) }))
    .filter((match) => match.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score || a.job.name.localeCompare(b.job.name))
    .slice(0, limit);
};

export type LinkedJob = {
  archivedAt: Date | null;
  canceledVisits: number;
  // Precio mensual sin IVA del presupuesto del trabajo; null si no tiene.
  monthlyPrice: number | null;
  name: string;
  status: JobStatus;
};

export type JobWarning = { kind: "price" | "visits" | "status"; label: string };

const money = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 2 });
const STATUS_LABEL: Partial<Record<JobStatus, string>> = {
  ARCHIVED: "El trabajo está archivado",
  COMPLETED: "El trabajo está terminado",
  DRAFT: "El trabajo es un borrador",
  PAUSED: "El trabajo está pausado",
};

// Los avisos de una factura del borrador según su trabajo: precio distinto al
// del presupuesto del trabajo (sin IVA, contra el subtotal de la factura),
// visitas canceladas o salteadas en el mes y trabajo pausado o terminado.
export const getJobWarnings = (invoice: { currency: string; subtotal: number }, job: LinkedJob, monthName: string) => {
  const warnings: JobWarning[] = [];
  const status = job.archivedAt ? STATUS_LABEL.ARCHIVED : STATUS_LABEL[job.status];
  if (status) warnings.push({ kind: "status", label: status });
  if (invoice.currency === "UYU" && job.monthlyPrice !== null && Math.abs(job.monthlyPrice - invoice.subtotal) >= 1) {
    warnings.push({ kind: "price", label: `El trabajo cobra $ ${money.format(job.monthlyPrice)} sin IVA` });
  }
  if (job.canceledVisits > 0) {
    const visits = job.canceledVisits === 1 ? "1 visita cancelada" : `${job.canceledVisits} visitas canceladas`;
    warnings.push({ kind: "visits", label: `${visits} en ${monthName}` });
  }
  return warnings;
};
