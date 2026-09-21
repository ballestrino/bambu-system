import { queryOptions, type QueryClient } from "@tanstack/react-query";

import {
  getAgentSettingsAction,
  getConversationAction,
  getConversationCostAction,
  getMonthlyCostAction,
  listConversationsAction,
  listProposalsAction,
} from "@/components/agent/actions/agent-reads.action";
import { agentKeys } from "@/components/agent/query-keys";

// Las queries del Sheet, compartidas por los hooks y por las lecturas que se
// hacen al abrir (fetchQuery).
export const agentSettingsQuery = () =>
  queryOptions({
    queryKey: agentKeys.settings(),
    queryFn: getAgentSettingsAction,
    // Sale del entorno del servidor: no cambia mientras la página está abierta.
    staleTime: 10 * 60 * 1000,
  });

export const conversationListQuery = (budgetId: string | null) =>
  queryOptions({
    queryKey: agentKeys.conversationList(budgetId),
    queryFn: () => listConversationsAction(budgetId),
  });

// Siempre fresca: se lee para abrir una conversación y tiene que traer los
// últimos turnos.
export const conversationQuery = (conversationId: string) =>
  queryOptions({
    queryKey: agentKeys.conversation(conversationId),
    queryFn: () => getConversationAction(conversationId),
    staleTime: 0,
  });

export const proposalsQuery = (conversationId: string) =>
  queryOptions({
    queryKey: agentKeys.proposals(conversationId),
    queryFn: () => listProposalsAction(conversationId),
  });

export const conversationCostQuery = (conversationId: string) =>
  queryOptions({
    queryKey: agentKeys.usage(conversationId),
    queryFn: () => getConversationCostAction(conversationId),
  });

// month null = el mes actual, que decide el servidor en hora de Montevideo.
export const monthlyCostQuery = (month: string | null) =>
  queryOptions({
    queryKey: agentKeys.monthlyUsage(month),
    queryFn: () => getMonthlyCostAction(month),
  });

const REFRESH_AGAIN_MS = 4000;

// Al terminar un turno: el título, el costo y las propuestas cambian. El
// título del modelo se genera después de la respuesta (after()) y un turno
// detenido guarda su consumo al cortarse, así que se lee una vez más.
export const refreshAfterTurn = (queryClient: QueryClient, conversationId: string) => {
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: agentKeys.conversations() }),
      queryClient.invalidateQueries({ queryKey: agentKeys.usage(conversationId) }),
      queryClient.invalidateQueries({ queryKey: agentKeys.monthlyUsages() }),
      queryClient.invalidateQueries({ queryKey: agentKeys.proposals(conversationId) }),
    ]);
  void refresh();
  window.setTimeout(() => void refresh(), REFRESH_AGAIN_MS);
};
