import { z } from "zod";

import { budgetChangesSchema } from "@/schemas/agent-tools";

// Entrada de compareBudgets (feature 71). Aparte de schemas/agent-tools.ts,
// que ya pasa las 200 líneas. Cada escenario es un calculateBudget con nombre.
export const MAX_COMPARISON_SCENARIOS = 8;

const comparisonScenarioSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .describe("Nombre corto de la columna: \"Margen 30 %\", \"3 visitas\", \"Oficina Centro\""),
  budgetSlug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .nullable()
    .describe("Slug de un presupuesto guardado como base; null es el presupuesto en contexto"),
  fromDefaults: z
    .boolean()
    .nullable()
    .describe("true para partir de los valores por defecto de un presupuesto nuevo"),
  changes: budgetChangesSchema
    .nullable()
    .describe("null compara la base tal cual; si no, cada campo en null salvo lo que cambia en este escenario"),
});

export const compareBudgetsInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .nullable()
    .describe("Título de la tabla; null es \"Comparativa de precios\""),
  scenarios: z
    .array(comparisonScenarioSchema)
    .min(2)
    .max(MAX_COMPARISON_SCENARIOS)
    .describe(`De 2 a ${MAX_COMPARISON_SCENARIOS} escenarios, en el orden de las columnas`),
});

export type CompareBudgetsInput = z.infer<typeof compareBudgetsInputSchema>;
