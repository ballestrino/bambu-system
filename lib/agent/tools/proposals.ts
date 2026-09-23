import "server-only";

import { tool } from "ai";

import { findAgentBudgetsByService, getAgentBudget, type AgentBudget } from "@/data/agent/budgets";
import { addToolGrounding } from "@/lib/agent/grounding";
import {
  buildCreateBudgetProposal,
  buildUpdateBudgetProposal,
  type BuiltProposal,
} from "@/lib/agent/proposal-builders";
import { sameServiceWarning, serviceFromValues } from "@/lib/agent/matching-budgets";
import { saveAgentProposal } from "@/lib/agent/proposal-store";
import { getSummaryAmounts, onlyText } from "@/lib/agent/proposal-summary";
import { readCreateValues, type ProposalSummary } from "@/lib/agent/proposals";
import {
  buildDuplicateBudgetProposal,
  buildPublishOfficialBudgetProposal,
} from "@/lib/agent/stored-budget-proposals";
import {
  loadTargetBudget,
  resolveBudgetBase,
  type AgentToolContext,
} from "@/lib/agent/tools/context";
import { hideFromModel, runTool, toolError, toolOk, type ToolResult } from "@/lib/agent/tool-result";
import {
  proposeBudgetTargetInputSchema,
  proposeCreateBudgetInputSchema,
  proposeUpdateBudgetInputSchema,
} from "@/schemas/agent-tools";

type Proposal = Extract<BuiltProposal, { ok: true }>;

// Guarda la propuesta PENDING y devuelve la tarjeta. Estas tools nunca
// escriben presupuestos: eso pasa solo al confirmar, en actions/agent. La
// tarjeta sale de la fila guardada: si la misma llamada llega dos veces, lo
// que se muestra es lo que se ejecutaría. Crear suma los valores completos
// (también de la fila) para editar la propuesta antes de guardarla; el modelo
// no los ve.
const saveProposal = async (ctx: AgentToolContext, toolCallId: string, built: Proposal) => {
  const proposal = await saveAgentProposal({
    conversationId: ctx.conversationId,
    actorId: ctx.actorId,
    toolCallId,
    kind: built.kind,
    payload: built.payload,
    summary: built.summary,
  });
  const summary = proposal.summary as ProposalSummary;
  const grounding = { amounts: getSummaryAmounts(summary) };
  addToolGrounding(ctx.grounding, grounding);
  const values = readCreateValues(proposal);
  return toolOk({
    card: "proposal" as const,
    proposalId: proposal.id,
    kind: proposal.kind,
    status: proposal.status,
    expiresAt: proposal.expiresAt.toISOString(),
    summary,
    grounding,
    ...(values ? { values } : {}),
  });
};

// Crear avisa si ya hay presupuestos guardados con el mismo servicio: la
// tarjeta lo muestra y el usuario decide.
const withSameServiceWarning = async (built: Proposal): Promise<Proposal> => {
  if (built.kind !== "CREATE_BUDGET" || !("values" in built.payload)) return built;
  const warning = sameServiceWarning(await findAgentBudgetsByService(serviceFromValues(built.payload.values)));
  return warning
    ? { ...built, summary: { ...built.summary, warnings: onlyText([...built.summary.warnings, warning]) } }
    : built;
};

const slugTaken = (slug: string) =>
  toolError("slug_taken", `Ya existe un presupuesto con la dirección "${slug}": pedí otro nombre.`);

type Target = { ok: true; budget: AgentBudget } | { ok: false; error: ToolResult<never> };

const loadTarget = async (ctx: AgentToolContext, budgetSlug: string | null): Promise<Target> => {
  const budget = await loadTargetBudget(ctx, budgetSlug);
  if (budget) return { ok: true, budget };
  if (!budgetSlug && ctx.formValues) {
    return {
      ok: false,
      error: toolError(
        "unsaved_budget",
        "El presupuesto en contexto todavía no está guardado: para guardarlo usá proposeCreateBudget."
      ),
    };
  }
  return {
    ok: false,
    error: toolError(
      "not_found",
      "No encontré ese presupuesto. Buscalo con searchBudgets o dejá budgetSlug en null para el que está en contexto."
    ),
  };
};

export const createProposalTools = (ctx: AgentToolContext) => ({
  proposeCreateBudget: tool({
    description:
      "Prepara crear un presupuesto generador nuevo para que el usuario lo confirme en una tarjeta: no guarda nada. Parte de la misma base que calculateBudget (formulario abierto, presupuesto en contexto, otro por slug o valores por defecto) y aplica los mismos changes. Usala solo si piden guardar o crear uno nuevo; para cambiar uno guardado usá proposeUpdateBudget.",
    inputSchema: proposeCreateBudgetInputSchema,
    execute: (input, { toolCallId }) =>
      runTool("proposeCreateBudget", async () => {
        const base = await resolveBudgetBase(ctx, input);
        if ("error" in base) return toolError("not_found", base.error);
        const built = buildCreateBudgetProposal({ base, ...input });
        if (!built.ok) return toolError(built.code, built.message);
        if (built.summary.slug && (await getAgentBudget({ slug: built.summary.slug }))) {
          return slugTaken(built.summary.slug);
        }
        return saveProposal(ctx, toolCallId, await withSameServiceWarning(built));
      }),
    toModelOutput: hideFromModel("values"),
  }),

  proposeUpdateBudget: tool({
    description:
      "Prepara guardar cambios en un presupuesto guardado (el de contexto, o otro por slug) para que el usuario los confirme: no guarda nada. La tarjeta muestra antes y después y avisa si se recrean opciones o se publica una versión oficial nueva. Usala solo si piden guardar; para probar escenarios usá calculateBudget. En changes, null en todo salvo lo pedido.",
    inputSchema: proposeUpdateBudgetInputSchema,
    execute: (input, { toolCallId }) =>
      runTool("proposeUpdateBudget", async () => {
        const target = await loadTarget(ctx, input.budgetSlug);
        if (!target.ok) return target.error;
        const built = buildUpdateBudgetProposal({ budget: target.budget, ...input });
        if (!built.ok) return toolError(built.code, built.message);
        const { newSlug } = built.payload;
        if (newSlug !== target.budget.slug && (await getAgentBudget({ slug: newSlug }))) {
          return slugTaken(newSlug);
        }
        return saveProposal(ctx, toolCallId, built);
      }),
  }),

  proposeDuplicateBudget: tool({
    description:
      "Prepara duplicar un presupuesto guardado (la copia se llama igual con \"(copia)\") para que el usuario lo confirme: no guarda nada. Solo si piden duplicar o copiar uno.",
    inputSchema: proposeBudgetTargetInputSchema,
    execute: (input, { toolCallId }) =>
      runTool("proposeDuplicateBudget", async () => {
        const target = await loadTarget(ctx, input.budgetSlug);
        if (!target.ok) return target.error;
        const built = buildDuplicateBudgetProposal({ budget: target.budget });
        if (!built.ok) return toolError(built.code, built.message);
        return saveProposal(ctx, toolCallId, built);
      }),
  }),

  proposePublishOfficialBudget: tool({
    description:
      "Prepara publicar un presupuesto generador como presupuesto oficial (precio de lista vigente) para que el usuario lo confirme: no publica nada. Solo si lo piden explícitamente. Falla si ya está publicado: los cambios guardados de uno oficial publican versiones nuevas solos.",
    inputSchema: proposeBudgetTargetInputSchema,
    execute: (input, { toolCallId }) =>
      runTool("proposePublishOfficialBudget", async () => {
        const target = await loadTarget(ctx, input.budgetSlug);
        if (!target.ok) return target.error;
        const built = buildPublishOfficialBudgetProposal({ budget: target.budget });
        if (!built.ok) return toolError(built.code, built.message);
        return saveProposal(ctx, toolCallId, built);
      }),
  }),
});
