import "server-only";

import { tool } from "ai";

import {
  applyBudgetChanges,
  describeBudgetInputs,
  getCalculationAmounts,
  runBudgetCalculation,
  solveTargetPrice,
} from "@/lib/agent/budget-calculation";
import { addToolGrounding } from "@/lib/agent/grounding";
import {
  resolveBudgetBase,
  type AgentToolContext,
  type BudgetBase,
} from "@/lib/agent/tools/context";
import { hideFromModel, runTool, toolError, toolOk } from "@/lib/agent/tool-result";
import {
  calculateBudgetInputSchema,
  solveForTargetPriceInputSchema,
} from "@/schemas/agent-tools";

const describeBase = (base: BudgetBase) => ({
  source: base.source,
  name: base.name,
  slug: base.slug,
});

// Cálculos puros sobre las fórmulas del formulario. Nunca guardan nada.
// values (el formulario completo) es para editar y guardar desde la tarjeta:
// el modelo no lo ve.
export const createCalculationTools = (ctx: AgentToolContext) => ({
  calculateBudget: tool({
    description:
      "Calcula un presupuesto con las fórmulas del formulario: parte del presupuesto en contexto (u otro por slug, o de los valores por defecto) y aplica cambios de margen, horas, visitas, empleadas, productos o transporte. En changes, null en todo salvo lo que el usuario pidió cambiar: el resto sale de la base, no copies valores. changedFields dice qué cambió de verdad. Devuelve totales sin y con productos, IVA y precio por hora. No guarda nada.",
    inputSchema: calculateBudgetInputSchema,
    execute: (input) =>
      runTool("calculateBudget", async () => {
        const base = await resolveBudgetBase(ctx, input);
        if ("error" in base) return toolError("not_found", base.error);

        const { values, changedFields } = applyBudgetChanges(base.values, input.changes ?? {});
        const calculation = runBudgetCalculation(values);
        const grounding = { amounts: getCalculationAmounts(calculation) };
        addToolGrounding(ctx.grounding, grounding);

        return toolOk({
          card: "budget-totals" as const,
          base: describeBase(base),
          changedFields,
          inputs: describeBudgetInputs(values),
          calculation,
          grounding,
          values,
        });
      }),
    toModelOutput: hideFromModel("values"),
  }),

  solveForTargetPrice: tool({
    description:
      "Calcula el margen de servicio necesario para llegar a un precio objetivo sin IVA: por hora (hourly) o total mensual del servicio sin productos (service). Si el objetivo no cubre el costo, el margen queda en 0 y wasClamped es true. No guarda nada.",
    inputSchema: solveForTargetPriceInputSchema,
    execute: (input) =>
      runTool("solveForTargetPrice", async () => {
        const base = await resolveBudgetBase(ctx, input);
        if ("error" in base) return toolError("not_found", base.error);

        const { values } = applyBudgetChanges(base.values, input.changes ?? {});
        const solved = solveTargetPrice(values, { kind: input.target, amount: input.amount });
        if (!solved) {
          return toolError(
            "cannot_solve",
            "No hay horas ni costo de servicio para calcular el margen. Revisá visitas, horas y empleadas."
          );
        }
        const calculation = runBudgetCalculation(solved.values);
        const grounding = { amounts: getCalculationAmounts(calculation) };
        addToolGrounding(ctx.grounding, grounding);

        return toolOk({
          card: "budget-totals" as const,
          base: describeBase(base),
          changedFields: ["revenue_percent"],
          target: { kind: input.target, amount: input.amount },
          revenuePercent: solved.revenuePercent,
          wasClamped: solved.wasClamped,
          minimumHourlyPrice: solved.minimumHourlyPrice,
          minimumServicePrice: solved.minimumServicePrice,
          inputs: describeBudgetInputs(solved.values),
          calculation,
          grounding,
          values: solved.values,
        });
      }),
    toModelOutput: hideFromModel("values"),
  }),
});
