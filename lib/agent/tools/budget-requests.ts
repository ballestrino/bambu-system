import "server-only";

import { tool } from "ai";

import { findAgentBudgetsByService } from "@/data/agent/budgets";
import { groupBudgetRequests, wantsOption, type BudgetRequestGroup } from "@/lib/agent/budget-requests";
import { addToolGrounding, type OfficialSource } from "@/lib/agent/grounding";
import { serviceFromInput, toMatchingBudgets } from "@/lib/agent/matching-budgets";
import type { AgentToolContext } from "@/lib/agent/tools/context";
import { matchToSource } from "@/lib/agent/tools/official-budgets";
import { runTool, toolOk } from "@/lib/agent/tool-result";
import { searchOfficialBudgets } from "@/lib/official-budgets/search";
import { groupBudgetRequestsInputSchema } from "@/schemas/agent-mail-tools";

// Un tope de búsquedas por llamada: cada grupo lee los oficiales vigentes y
// los guardados iguales.
const MAX_GROUPS = 12;

type PriceOption = { hasProducts: boolean; net: number };

// El precio de un grupo: un oficial vigente exact gana; si no, el guardado
// igual más reciente; si no, hay que calcularlo. Las opciones son las que
// pidió el cliente (o las dos si no lo dijo).
const priceGroup = async (group: BudgetRequestGroup) => {
  const { service } = group;
  const official =
    service.place === "otro"
      ? null
      : await searchOfficialBudgets({
          service: service.place,
          frequency: service.frequency,
          visits: service.visits,
          hoursPerVisit: service.hoursPerVisit,
          employees: service.employees,
          hasProducts: service.hasProducts,
        });
  const sources: OfficialSource[] = official?.status === "exact" ? official.matches.map(matchToSource) : [];
  const saved = toMatchingBudgets(
    await findAgentBudgetsByService(
      serviceFromInput({ ...service, hasProducts: service.hasProducts === true })
    )
  );

  const officialOptions: PriceOption[] = sources
    .filter((source) => wantsOption(service, source.hasProducts))
    .map((source) => ({ hasProducts: source.hasProducts, net: source.prices.net }));
  const latest = saved.rows[0];
  const savedOptions: PriceOption[] = (latest?.prices ?? [])
    .filter((price) => wantsOption(service, price.hasProducts))
    .map((price) => ({ hasProducts: price.hasProducts, net: price.net }));

  const suggestion = officialOptions.length
    ? { source: "official" as const, name: sources[0].name, version: sources[0].version, options: officialOptions }
    : latest && savedOptions.length
      ? { source: "saved" as const, name: latest.name, slug: latest.slug, options: savedOptions }
      : null;

  return {
    group: {
      label: group.label,
      service,
      count: group.requests.length,
      requests: group.requests,
      officialStatus: official?.status ?? "not_searched",
      suggestion,
      savedMatches: saved.rows.slice(0, 3).map((row) => ({ name: row.name, slug: row.slug, prices: row.prices })),
    },
    grounding: { amounts: saved.grounding.amounts, sources },
  };
};

export const createBudgetRequestTools = (ctx: AgentToolContext) => ({
  groupBudgetRequests: tool({
    description:
      "Agrupa pedidos de presupuesto (por ejemplo, los de varios correos) por servicio idéntico: lugar, frecuencia, visitas, horas por visita, empleadas y productos. Para cada grupo busca el precio oficial vigente y los presupuestos guardados iguales, y sugiere el precio sin IVA con su fuente; esos importes se pueden citar. Un grupo sin sugerencia se calcula una vez con calculateBudget y vale para todos sus pedidos.",
    inputSchema: groupBudgetRequestsInputSchema,
    execute: (input) =>
      runTool("groupBudgetRequests", async () => {
        const groups = groupBudgetRequests(input.requests);
        const priced = await Promise.all(groups.slice(0, MAX_GROUPS).map(priceGroup));
        const grounding = {
          amounts: priced.flatMap((item) => item.grounding.amounts),
          sources: priced.flatMap((item) => item.grounding.sources),
        };
        addToolGrounding(ctx.grounding, grounding);
        return toolOk({
          card: "budget-requests" as const,
          requests: input.requests.length,
          identicalGroups: groups.filter((group) => group.requests.length > 1).length,
          truncated: groups.length > MAX_GROUPS,
          groups: priced.map((item) => item.group),
          grounding,
        });
      }),
  }),
});
