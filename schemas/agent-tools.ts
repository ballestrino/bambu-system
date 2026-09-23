import { z } from "zod";

import { officialBudgetSearchCriteriaSchema } from "@/schemas/official-budget-search";
import { jobStatusSchema } from "@/schemas/ops/job";
import { occurrenceStatusSchema } from "@/schemas/ops/job-occurrence";
import { operationalCostCategoryKindSchema } from "@/schemas/ops/operational-cost";

// Entradas de las tools del agente. Las descripciones son para el modelo.
// Cada campo es obligatorio y nullable, como la tool del agente de correo:
// OpenAI trata los campos de una tool como obligatorios, y sin null el modelo
// inventaba valores (ceros, false) para lo que no quería cambiar. null es
// "sin dato" o "sin cambio". La raíz es siempre un objeto: por eso
// queryOperations usa un `kind` cerrado y no una unión discriminada.
const idSchema = z.string().trim().min(1).max(64);

export const monthKeySchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Usá el formato AAAA-MM")
  .nullable()
  .describe("Mes AAAA-MM; null es el mes actual en Montevideo");

const keep = "; null si no cambia";

export const budgetChangesSchema = z.object({
  visits: z.number().int().min(0).nullable().describe(`Visitas por período${keep}`),
  visit_type: z
    .enum(["days", "week", "month"])
    .nullable()
    .describe(`days: puntuales; week: por semana (x4,32 al mes); month: por mes${keep}`),
  hours_per_visit: z.number().min(0).nullable().describe(`Horas por visita${keep}`),
  employees: z.number().int().min(1).nullable().describe(`Empleadas por visita${keep}`),
  nominal_hour: z.number().min(0).nullable().describe(`Costo de la hora nominal${keep}`),
  revenue_percent: z.number().min(0).nullable().describe(`Margen del servicio en %${keep}`),
  products_price: z.number().min(0).nullable().describe(`Costo mensual de productos, 0 es sin productos${keep}`),
  products_revenue_percent: z.number().min(0).nullable().describe(`Margen de productos en %${keep}`),
  transportation_cost: z.number().min(0).nullable().describe(`Costo mensual de transporte${keep}`),
  // El cálculo toma un IVA 0 como 22 (`|| 22`): aceptarlo mostraría importes
  // con IVA rotulados como sin IVA.
  iva: z
    .number()
    .positive("El IVA tiene que ser mayor que 0: para cotizar sin IVA (Literal E) usá los importes sin IVA del cálculo")
    .nullable()
    .describe(`IVA en %, mayor que 0; nunca 0 para "sin IVA": los importes sin IVA ya vienen en el cálculo${keep}`),
  incidence_enabled: z.boolean().nullable().describe(`Solo si piden habilitar o quitar la incidencia${keep}`),
  company_enabled: z.boolean().nullable().describe(`Solo si piden habilitar o quitar los aportes patronales${keep}`),
  personal_enabled: z.boolean().nullable().describe(`Solo si piden habilitar o quitar los aportes personales${keep}`),
  estimateTransport: z.boolean().nullable().describe("true recalcula el transporte: visitas del mes x empleadas x $ 52"),
  estimateProducts: z
    .boolean()
    .nullable()
    .describe("true recalcula los productos: $ 175 cada 4 horas de servicio, al múltiplo de $ 500 más cercano"),
  roundPrice: z
    .boolean()
    .nullable()
    .describe(
      "null sube el precio sin IVA al próximo múltiplo de $ 100, salvo que pidan un margen exacto; true lo redondea igual; false solo si piden el precio exacto"
    ),
});

export type AgentBudgetChanges = Partial<z.infer<typeof budgetChangesSchema>>;

const budgetBaseShape = {
  budgetSlug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .nullable()
    .describe("Slug de otro presupuesto como base; null es el presupuesto en contexto"),
  fromDefaults: z
    .boolean()
    .nullable()
    .describe("true para partir de los valores por defecto de un presupuesto nuevo"),
  changes: budgetChangesSchema.describe("Cada campo en null salvo lo que el usuario pidió cambiar"),
};

export const emptyInputSchema = z.object({});

// Los criterios del agente de correo, con empleadas null como 1 (feature 46).
export const searchOfficialBudgetsInputSchema = officialBudgetSearchCriteriaSchema.extend({
  employees: z.number().int().positive().nullable().describe("Empleadas por visita; null es 1"),
});

export const listOfficialBudgetsInputSchema = z.object({
  query: z.string().trim().max(120).nullable(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).nullable().describe("null es ACTIVE"),
});

export const getOfficialBudgetInputSchema = z.object({ officialBudgetId: idSchema });

export const searchBudgetsInputSchema = z.object({
  query: z.string().trim().max(120).nullable().describe("Palabras del nombre o la descripción"),
  page: z.number().int().min(1).max(50).nullable(),
  limit: z.number().int().min(1).max(20).nullable(),
});

// El mismo servicio que busca searchOfficialBudgets, con los mismos nombres:
// el modelo puede buscar en los dos con los mismos datos.
export const findMatchingBudgetsInputSchema = z.object({
  frequency: z.enum(["days", "week", "month"]).describe("days: puntuales; week: por semana; month: por mes"),
  visits: z.number().int().positive().describe("Visitas por período"),
  hoursPerVisit: z.number().positive().describe("Horas por visita"),
  employees: z.number().int().positive().nullable().describe("Empleadas por visita; null es 1"),
  hasProducts: z.boolean().nullable().describe("true si lleva productos; false o null no filtra"),
});

export const getBudgetInputSchema = z.object({
  slug: z.string().trim().min(1).max(200).nullable().describe("null con budgetId null abre el presupuesto en contexto"),
  budgetId: idSchema.nullable(),
});

export const calculateBudgetInputSchema = z.object(budgetBaseShape);

export const solveForTargetPriceInputSchema = z.object({
  ...budgetBaseShape,
  target: z
    .enum(["hourly", "service"])
    .describe("hourly: precio por hora sin IVA; service: precio mensual del servicio sin IVA ni productos"),
  amount: z.number().positive(),
});

export const monthInputSchema = z.object({ month: monthKeySchema });

export const financialTrendInputSchema = z.object({
  month: monthKeySchema.describe("Último mes de la serie, AAAA-MM; null es el actual"),
  months: z.number().int().min(1).max(12).nullable().describe("Cantidad de meses; null son 3"),
});

export const jobProfitabilityInputSchema = z.object({
  month: monthKeySchema,
  jobId: idSchema.nullable().describe("Un trabajo; requerido para HISTORY"),
  mode: z.enum(["MONTH", "HISTORY"]).nullable().describe("null es MONTH"),
});

export const OPERATION_KINDS = [
  "jobs",
  "employees",
  "visits",
  "clientPayments",
  "operationalCosts",
  "employeePayments",
] as const;

export const queryOperationsInputSchema = z.object({
  kind: z.enum(OPERATION_KINDS),
  query: z.string().trim().max(120).nullable().describe("Texto a buscar (jobs, employees)"),
  month: monthKeySchema.describe("Mes (visits, clientPayments, operationalCosts, employeePayments)"),
  jobId: idSchema.nullable(),
  employeeId: idSchema.nullable(),
  jobStatus: jobStatusSchema.nullable(),
  visitStatus: occurrenceStatusSchema.nullable(),
  costKind: operationalCostCategoryKindSchema.nullable(),
  includeInactive: z.boolean().nullable().describe("Empleadas inactivas o archivadas"),
});

export type QueryOperationsInput = z.infer<typeof queryOperationsInputSchema>;

// Propuestas: la misma base y los mismos changes que calculateBudget, así
// "calculalo y guardalo" guarda exactamente lo calculado.
const targetSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .nullable()
  .describe("Slug del presupuesto guardado; null es el presupuesto en contexto");

export const proposeCreateBudgetInputSchema = z.object({
  ...budgetBaseShape,
  name: z.string().trim().min(1).max(120).nullable().describe("Nombre del presupuesto nuevo; null usa el del formulario abierto"),
  description: z.string().trim().max(2000).nullable().describe("Descripción; null usa la de la base"),
});

export const proposeUpdateBudgetInputSchema = z.object({
  budgetSlug: targetSlugSchema,
  name: z.string().trim().min(1).max(120).nullable().describe("Nombre nuevo, solo si piden renombrar: también cambia la dirección (slug); null lo deja igual"),
  description: z.string().trim().max(2000).nullable().describe("Descripción nueva; null la deja igual"),
  changes: budgetChangesSchema.describe("Cada campo en null salvo lo que el usuario pidió cambiar"),
});

export const proposeBudgetTargetInputSchema = z.object({ budgetSlug: targetSlugSchema });

export const draftEmailInputSchema = z.object({
  brief: z
    .string()
    .trim()
    .min(10)
    .max(4000)
    .describe("Qué dice el mensaje: cliente, servicio, alcance, opciones de precio con sus importes y tono"),
  channel: z.enum(["email", "whatsapp"]),
  to: z.string().trim().max(200).nullable().describe("Nombre o correo del destinatario"),
  subject: z.string().trim().max(200).nullable(),
});
