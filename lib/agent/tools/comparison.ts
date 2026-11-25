import "server-only";

import { tool } from "ai";

import { applyAgentChanges } from "@/lib/agent/agent-pricing";
import { getCalculationAmounts, runBudgetCalculation } from "@/lib/agent/budget-calculation";
import { buildComparisonColumn, type ComparisonColumn } from "@/lib/agent/budget-comparison";
import { addToolGrounding } from "@/lib/agent/grounding";
import { resolveBudgetBase, type AgentToolContext } from "@/lib/agent/tools/context";
import { hideFromModel, runTool, toolError, toolOk } from "@/lib/agent/tool-result";
import { compareBudgetsInputSchema } from "@/schemas/agent-comparison";

// Tabla comparativa de precios (feature 71): cada escenario es un
// calculateBudget con nombre, con las mismas reglas de precio. La tarjeta
// deja elegir los campos y copiar la tabla. Nunca guarda nada.
export const createComparisonTools = (ctx: AgentToolContext) => ({
  compareBudgets: tool({
    description:
      "Arma una tabla comparativa de 2 a 8 escenarios de precio lado a lado: presupuestos guardados (budgetSlug), el del contexto, o variantes con cambios (margen, visitas, horas, empleadas, productos…), cada uno calculado igual que calculateBudget. Devuelve por escenario horas, mano de obra, aportes, transporte, extras, productos, costo, margen, precio sin y con IVA, precio hora, ganancia y % de ganancia, sin y con productos. La tarjeta muestra la tabla, deja elegir los campos y copiarla: no la repitas en el texto. No guarda nada.",
    inputSchema: compareBudgetsInputSchema,
    execute: (input) =>
      runTool("compareBudgets", async () => {
        const columns: ComparisonColumn[] = [];
        const amounts: number[] = [];
        for (const scenario of input.scenarios) {
          const base = await resolveBudgetBase(ctx, scenario);
          if ("error" in base) return toolError("not_found", `${scenario.label}: ${base.error}`);

          const { values, changedFields, bseError } = applyAgentChanges(base, scenario.changes ?? {});
          if (bseError) return toolError("cannot_calculate_bse", `${scenario.label}: ${bseError}`);
          const calculation = runBudgetCalculation(values);
          amounts.push(...getCalculationAmounts(calculation));
          columns.push(
            buildComparisonColumn({
              label: scenario.label,
              base: { source: base.source, name: base.name, slug: base.slug },
              values,
              calculation,
              changedFields,
            })
          );
        }

        // Se guarda en la salida: el grounding se reconstruye de las partes.
        const grounding = { amounts };
        addToolGrounding(ctx.grounding, grounding);
        return toolOk({
          card: "budget-comparison" as const,
          title: input.title ?? "Comparativa de precios",
          columns,
          grounding,
        });
      }),
    toModelOutput: hideFromModel("grounding"),
  }),
});
