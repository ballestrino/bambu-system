import "server-only";

import { createBudgetTools } from "@/lib/agent/tools/budgets";
import { createBusinessTools } from "@/lib/agent/tools/business";
import { createCalculationTools } from "@/lib/agent/tools/calculations";
import type { AgentToolContext } from "@/lib/agent/tools/context";
import { createEmailTools } from "@/lib/agent/tools/email";
import { createFinanceTools } from "@/lib/agent/tools/finance";
import { createOfficialBudgetTools } from "@/lib/agent/tools/official-budgets";
import { createOperationsTools } from "@/lib/agent/tools/operations";
import { createPayrollTools } from "@/lib/agent/tools/payroll";
import { createProposalTools } from "@/lib/agent/tools/proposals";

export type { AgentToolContext };

// Todas las tools del agente, siempre registradas: la habilidad del turno
// elige cuáles están activas (activeTools). Los nombres tienen que coincidir
// con AGENT_TOOL_CATALOG; check:agent-tools lo verifica.
export const createAgentTools = (ctx: AgentToolContext) => ({
  ...createBusinessTools(),
  ...createOfficialBudgetTools(ctx),
  ...createBudgetTools(ctx),
  ...createCalculationTools(ctx),
  ...createFinanceTools(),
  ...createPayrollTools(),
  ...createOperationsTools(),
  ...createEmailTools(ctx),
  ...createProposalTools(ctx),
});

export type AgentTools = ReturnType<typeof createAgentTools>;
