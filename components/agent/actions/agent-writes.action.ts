import { confirmAgentProposal } from "@/actions/agent/confirm-proposal";
import {
  deleteAgentConversation,
  renameAgentConversation,
  setAgentConversationMode,
  setAgentConversationPinned,
} from "@/actions/agent/conversations";
import { rejectAgentProposal } from "@/actions/agent/reject-proposal";
import { saveAgentBudget } from "@/actions/agent/save-budget";
import ValidationError from "@/instances/validation-error";
import { readConfirmResponse } from "@/lib/agent/proposal-outcome";
import type { AgentMode } from "@/lib/ai/modes";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

// Escrituras del Sheet: un { error } se lanza como ValidationError para que
// la mutación lo muestre en un toast.
const WRITE_ERROR = "No se pudo completar la acción";

export const renameConversationAction = async (input: { id: string; title: string }) => {
  const result = await renameAgentConversation(input);
  if (!result.success) throw new ValidationError(result.error ?? WRITE_ERROR);
  return result.success;
};

export const deleteConversationAction = async (conversationId: string) => {
  const result = await deleteAgentConversation(conversationId);
  if (!result.success) throw new ValidationError(result.error ?? WRITE_ERROR);
  return result.success;
};

export const pinConversationAction = async (input: { id: string; pinned: boolean }) => {
  const result = await setAgentConversationPinned(input);
  if (!result.success) throw new ValidationError(result.error ?? WRITE_ERROR);
  return result.success;
};

export const setConversationModeAction = async (input: { id: string; mode: AgentMode }) => {
  const result = await setAgentConversationMode(input);
  if (!result.success) throw new ValidationError(result.error ?? WRITE_ERROR);
  return result.mode;
};

// Acepta las dos formas de la respuesta: con la propuesta, o solo con el
// resultado si borraron la conversación mientras se ejecutaba.
export const confirmProposalAction = async (proposalId: string) => {
  const outcome = readConfirmResponse(await confirmAgentProposal(proposalId));
  if (!outcome.ok) throw new ValidationError(outcome.error);
  return outcome;
};

export const rejectProposalAction = async (proposalId: string) => {
  const result = await rejectAgentProposal(proposalId);
  if (!("success" in result) || !result.success) throw new ValidationError(result.error ?? WRITE_ERROR);
  return result.success;
};

// Un error del nombre (vacío o con la dirección tomada) viaja con field para
// marcarlo en el formulario del editor.
export class BudgetFieldError extends ValidationError {
  readonly field: "name";

  constructor(message: string, field: "name") {
    super(message);
    this.field = field;
  }
}

export const saveBudgetAction = async (input: {
  conversationId: string;
  toolCallId: string;
  values: BudgetFormValues;
}) => {
  const response = await saveAgentBudget(input);
  if ("field" in response && response.field) throw new BudgetFieldError(response.error, response.field);
  const outcome = readConfirmResponse(response);
  if (!outcome.ok) throw new ValidationError(outcome.error);
  return outcome;
};
