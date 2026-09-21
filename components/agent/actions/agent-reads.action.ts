import {
  getAgentConversationAction,
  listAgentConversations,
} from "@/actions/agent/conversations";
import { listAgentProposals } from "@/actions/agent/proposals";
import { getAgentSettings } from "@/actions/agent/settings";
import { getAgentConversationCost, getAgentMonthlyCost } from "@/actions/agent/usage";
import ValidationError from "@/instances/validation-error";

// Lecturas del Sheet para TanStack Query: un { error } de la acción se lanza
// como ValidationError y la query queda en error con ese mensaje. Se mira el
// campo de éxito: TypeScript normaliza la unión y "error" existe en todas.
const READ_ERROR = "No se pudieron leer los datos del asistente";

export const getAgentSettingsAction = async () => {
  const result = await getAgentSettings();
  if (!result.modes) throw new ValidationError(result.error ?? READ_ERROR);
  return { defaultMode: result.defaultMode, modes: result.modes };
};

export const listConversationsAction = async (budgetId: string | null) => {
  const result = await listAgentConversations({ budgetId });
  if (!result.conversations) throw new ValidationError(result.error ?? READ_ERROR);
  return result.conversations;
};

export const getConversationAction = async (conversationId: string) => {
  const result = await getAgentConversationAction(conversationId);
  if (!("conversation" in result)) throw new ValidationError(result.error);
  return result;
};

export const listProposalsAction = async (conversationId: string) => {
  const result = await listAgentProposals(conversationId);
  if (!result.proposals) throw new ValidationError(result.error ?? READ_ERROR);
  return result.proposals;
};

// cost es null mientras la conversación no tenga mensajes guardados.
export const getConversationCostAction = async (conversationId: string) => {
  const result = await getAgentConversationCost(conversationId);
  if (result.error !== undefined) throw new ValidationError(result.error);
  return result.cost ?? null;
};

export const getMonthlyCostAction = async (month: string | null) => {
  const result = await getAgentMonthlyCost(month);
  if (!result.cost) throw new ValidationError(result.error ?? READ_ERROR);
  return result.cost;
};
