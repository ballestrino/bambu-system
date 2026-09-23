import "server-only";

import { tool } from "ai";

import {
  getOfficialBudgetAction,
  getOfficialBudgetsAction,
} from "@/components/official-budgets/actions/official-budget-reads";
import { addToolGrounding, type OfficialSource } from "@/lib/agent/grounding";
import type { AgentToolContext } from "@/lib/agent/tools/context";
import { runTool, toolError, toolOk } from "@/lib/agent/tool-result";
import {
  searchOfficialBudgets,
  type OfficialBudgetSearchResult,
} from "@/lib/official-budgets/search";
import {
  getOfficialBudgetInputSchema,
  listOfficialBudgetsInputSchema,
  searchOfficialBudgetsInputSchema,
} from "@/schemas/agent-tools";

type SearchMatch = OfficialBudgetSearchResult["matches"][number];

const matchToSource = (match: SearchMatch): OfficialSource => ({
  sourceOptionId: match.sourceOptionId,
  officialBudgetId: match.officialBudget.id,
  name: match.officialBudget.name,
  version: match.immutableVersion.number,
  hasProducts: match.conditions.hasProducts,
  prices: {
    net: match.prices.net,
    ivaAmount: match.prices.ivaAmount,
    final: match.prices.final,
    hourlyNet: match.prices.hourlyNet,
  },
});

// Precios de lista: solo versiones vigentes de presupuestos oficiales. Un
// resultado exact es la única búsqueda que habilita citar esos importes.
export const createOfficialBudgetTools = (ctx: AgentToolContext) => ({
  searchOfficialBudgets: tool({
    description:
      "Busca el precio vigente en los presupuestos oficiales para un servicio con frecuencia, visitas, horas por visita, empleadas y productos. Mandá null en lo que no sepas (empleadas null es 1). Solo un status exact permite citar el precio. No sirve para presupuestos generadores ni para calcular.",
    inputSchema: searchOfficialBudgetsInputSchema,
    execute: (input) =>
      runTool("searchOfficialBudgets", async () => {
        // Sin empleadas se busca con 1, como findMatchingBudgets: si no, la
        // búsqueda queda incompleta y el agente pregunta. La búsqueda es la
        // del agente de correo, que sigue tratando null como dato faltante.
        const result = await searchOfficialBudgets({ ...input, employees: input.employees ?? 1 });
        const sources = result.status === "exact" ? result.matches.map(matchToSource) : [];
        const grounding = { amounts: [], sources };
        addToolGrounding(ctx.grounding, grounding);
        return toolOk({
          card: "official-search" as const,
          status: result.status,
          canQuotePrice: result.canQuotePrice,
          missingFields: result.missingFields,
          matches: result.matches.map((match) => ({
            ...matchToSource(match),
            serviceName: match.service.name,
            conditions: match.conditions,
            monthlyHours: match.workload.monthlyHours,
          })),
          grounding,
        });
      }),
  }),

  listOfficialBudgets: tool({
    description:
      "Lista los presupuestos oficiales (vigentes por defecto) con su versión actual. Para ver precios usá getOfficialBudget con el id.",
    inputSchema: listOfficialBudgetsInputSchema,
    execute: (input) =>
      runTool("listOfficialBudgets", async () => {
        const rows = await getOfficialBudgetsAction({
          status: input.status ?? "ACTIVE",
          query: input.query || undefined,
        });
        return toolOk({
          card: "list" as const,
          kind: "officialBudgets" as const,
          total: rows.length,
          truncated: rows.length > 30,
          rows: rows.slice(0, 30).map((row) => ({
            id: row.id,
            name: row.sourceBudgetName,
            slug: row.sourceBudgetSlug,
            status: row.status,
            version: row.currentVersion,
            publishedAt: row.publishedAt,
          })),
        });
      }),
  }),

  getOfficialBudget: tool({
    description:
      "Abre un presupuesto oficial por id y devuelve las opciones de su versión actual con precios sin IVA, IVA, final y por hora. Los precios de uno vigente se pueden citar.",
    inputSchema: getOfficialBudgetInputSchema,
    execute: (input) =>
      runTool("getOfficialBudget", async () => {
        const detail = await getOfficialBudgetAction(input.officialBudgetId);
        if (!detail) return toolError("not_found", "No encontré ese presupuesto oficial.");
        const version =
          detail.versions.find((item) => item.version === detail.currentVersion) ??
          detail.versions[0];
        if (!version) return toolError("not_found", "El presupuesto oficial no tiene versiones.");

        const options = version.options.map((option) => ({
          sourceOptionId: option.id,
          hasProducts: option.hasProducts,
          visitType: option.visitType,
          visits: option.visits,
          hoursPerVisit: option.hoursPerVisit,
          employees: option.employees,
          monthlyHours: option.monthlyWorkload,
          prices: {
            net: option.netPrice,
            ivaAmount: option.ivaAmount,
            final: option.finalPrice,
            hourlyNet: option.hourlyPrice,
          },
        }));
        const sources: OfficialSource[] =
          detail.status === "ACTIVE"
            ? options.map((option) => ({
                sourceOptionId: option.sourceOptionId,
                officialBudgetId: detail.id,
                name: detail.sourceBudgetName,
                version: version.version,
                hasProducts: option.hasProducts,
                prices: option.prices,
              }))
            : [];
        const grounding = { amounts: [], sources };
        addToolGrounding(ctx.grounding, grounding);

        return toolOk({
          card: "official-budget" as const,
          id: detail.id,
          name: detail.sourceBudgetName,
          status: detail.status,
          version: version.version,
          serviceName: version.serviceName,
          serviceDescription: version.serviceDescription,
          publishedAt: version.publishedAt,
          options,
          grounding,
        });
      }),
  }),
});
