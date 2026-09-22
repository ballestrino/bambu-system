"use server";

import { confirmAgentProposal } from "@/actions/agent/confirm-proposal";
import { getAgentBudget } from "@/data/agent/budgets";
import { findSavableBudgetCall } from "@/data/agent/tool-calls";
import { buildCreateBudgetProposal } from "@/lib/agent/proposal-builders";
import { reviseAgentProposal } from "@/lib/agent/proposal-store";
import {
  AdminAuthorizationError,
  requireAdminSession,
} from "@/lib/require-admin-session";
import { agentSaveBudgetSchema } from "@/schemas/agent-proposals";

// Errores que se muestran en el campo del nombre del editor.
const NAME_ERRORS = new Set(["missing_name", "invalid_name"]);

const describeIssues = (issues: { path: PropertyKey[]; message: string }[]) =>
  `Los valores no son válidos: ${issues.map((issue) => `${issue.path.map(String).join(".")} (${issue.message})`).join(", ")}.`;

// Guardar en el generador, desde el chat, un presupuesto que armó el agente
// (un cálculo o una propuesta de crear), quizás editado en el Sheet. Pasa por
// una propuesta de esa llamada a tool y la confirma con la acción de siempre:
// queda auditado, se escribe una sola vez aunque se repita, y el agente la ve
// en el bloque de propuestas de los turnos siguientes.
export const saveAgentBudget = async (input: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsed = agentSaveBudgetSchema.safeParse(input);
    if (!parsed.success) return { error: describeIssues(parsed.error.issues) };
    const { conversationId, toolCallId, values } = parsed.data;
    const actorId = session.user.id;

    // La llamada tiene que estar en una conversación del usuario y haber
    // armado un presupuesto: una respuesta descartada al regenerar ya no está.
    const call = await findSavableBudgetCall({ conversationId, toolCallId, userId: actorId });
    if (!call) return { error: "Ese presupuesto ya no está en la conversación." };

    // "edited": lo editado a mano se guarda tal cual, sin las reglas de
    // precio del agente.
    const built = buildCreateBudgetProposal({
      base: { source: "edited", values },
      name: values.name,
      description: values.description ?? null,
      changes: {},
    });
    if (!built.ok) return { error: built.message, field: NAME_ERRORS.has(built.code) ? ("name" as const) : null };
    const { slug } = built.summary;
    if (slug && (await getAgentBudget({ slug }))) {
      return {
        error: `Ya existe un presupuesto con la dirección “${slug}”: elegí otro nombre.`,
        field: "name" as const,
      };
    }

    const proposal = await reviseAgentProposal({
      conversationId,
      actorId,
      toolCallId,
      kind: "CREATE_BUDGET",
      payload: built.payload,
      summary: built.summary,
    });
    if (!proposal.ok) return { error: proposal.error };
    return await confirmAgentProposal(proposal.id);
  } catch (error) {
    console.error("Error saving agent budget:", error);
    return {
      error: error instanceof AdminAuthorizationError ? error.message : "No se pudo guardar el presupuesto.",
    };
  }
};
