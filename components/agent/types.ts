import type { listAgentConversations } from "@/actions/agent/conversations";
import type { getAgentSettings } from "@/actions/agent/settings";
import type { getAgentConversationCost, getAgentMonthlyCost } from "@/actions/agent/usage";
import type { AgentUIMessage, AgentUITools } from "@/lib/agent/messages";

// Tipos del cliente, derivados de las tools y las acciones: si cambia una
// salida, la tarjeta que la muestra deja de compilar.
export type { AgentUIMessage };

type Success<T> = Exclude<Awaited<T>, { error: string }>;

export type AgentToolName = keyof AgentUITools;

export type AgentToolData<N extends AgentToolName> = Extract<
  AgentUITools[N]["output"],
  { ok: true }
>["data"];

export type BudgetTotalsCardData =
  | AgentToolData<"calculateBudget">
  | AgentToolData<"solveForTargetPrice">
  | AgentToolData<"getBudget">;

export type ProposalCardData = AgentToolData<"proposeCreateBudget">;

export type EmailCardData = AgentToolData<"draftEmail">;

export type FinanceCardData = AgentToolData<"getFinancialSnapshot">;

export type FinanceTrendCardData = AgentToolData<"getFinancialTrend">;

export type ProfitabilityCardData = AgentToolData<"getJobProfitability">;

export type PayrollCardData = AgentToolData<"getPayrollSummary">;

export type OfficialSearchCardData = AgentToolData<"searchOfficialBudgets">;

export type OfficialBudgetCardData = AgentToolData<"getOfficialBudget">;

// Las tres tools de listas (presupuestos, oficiales y operaciones) comparten
// la tarjeta; cada tipo trae columnas distintas.
export type ListCardData = {
  kind: string;
  total: number;
  truncated: boolean;
  rows: Record<string, unknown>[];
  month?: string;
  recordedTotal?: number;
};

export type AgentConversationItem = Success<
  ReturnType<typeof listAgentConversations>
>["conversations"][number];

export type AgentSettings = Success<ReturnType<typeof getAgentSettings>>;

export type AgentConversationCost = Success<ReturnType<typeof getAgentConversationCost>>["cost"];

export type AgentMonthlyCost = Success<ReturnType<typeof getAgentMonthlyCost>>["cost"];
