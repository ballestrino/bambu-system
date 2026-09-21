import type { AgentBudgetContextInput } from "@/schemas/agent";

// Qué conversaciones lista un historial: las de un presupuesto (su Sheet), las
// que no tienen presupuesto (el Sheet de crear) o todas (la página del agente).
export type AgentConversationScope =
  | { kind: "budget"; budgetId: string }
  | { kind: "no-budget" }
  | { kind: "all" };

export const ALL_AGENT_CONVERSATIONS: AgentConversationScope = { kind: "all" };

export const budgetConversationScope = (budgetId: string | null): AgentConversationScope =>
  budgetId ? { kind: "budget", budgetId } : { kind: "no-budget" };

// La parte variable de la query key del historial.
export const conversationScopeKey = (scope: AgentConversationScope) =>
  scope.kind === "budget" ? scope.budgetId : scope.kind === "no-budget" ? "sin-presupuesto" : "todas";

// Lo que recibe listAgentConversations: sin presupuesto es budgetId null, no
// "cualquiera".
export const conversationListInput = (scope: AgentConversationScope) =>
  scope.kind === "all" ? { all: true } : { budgetId: scope.kind === "budget" ? scope.budgetId : null };

type LinkedBudget = { id: string; name: string } | null | undefined;

// En la página, una conversación de un presupuesto habla de él en cada turno,
// como en su Sheet. Las demás van sin contexto: el formulario de crear no
// existe acá.
export const pageBudgetContext = (budget: LinkedBudget): AgentBudgetContextInput | undefined =>
  budget ? { kind: "saved", budgetId: budget.id } : undefined;

export const pageContextLabel = (budget: LinkedBudget) =>
  budget ? `Presupuesto: ${budget.name}` : "Sin presupuesto";
