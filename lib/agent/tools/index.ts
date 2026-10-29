import "server-only";

import { createBudgetRequestTools } from "@/lib/agent/tools/budget-requests";
import { createBudgetTools } from "@/lib/agent/tools/budgets";
import { createBusinessTools } from "@/lib/agent/tools/business";
import { createCalculationTools } from "@/lib/agent/tools/calculations";
import type { AgentToolContext } from "@/lib/agent/tools/context";
import { createEmailTools } from "@/lib/agent/tools/email";
import { createFinanceTools } from "@/lib/agent/tools/finance";
import { createInstructionTools } from "@/lib/agent/tools/instructions";
import { createMailboxTools } from "@/lib/agent/tools/mailbox";
import { createMemoryTools } from "@/lib/agent/tools/memory";
import { createOfficialBudgetTools } from "@/lib/agent/tools/official-budgets";
import { createOperationsTools } from "@/lib/agent/tools/operations";
import { createPayrollTools } from "@/lib/agent/tools/payroll";
import { createProposalTools } from "@/lib/agent/tools/proposals";
import { createVisitBatchTools } from "@/lib/agent/tools/visit-batch";
import { createVisitTools } from "@/lib/agent/tools/visits";

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
  ...createMailboxTools(),
  ...createBudgetRequestTools(ctx),
  ...createEmailTools(ctx),
  ...createProposalTools(ctx),
  ...createVisitTools(ctx),
  ...createVisitBatchTools(ctx),
  ...createMemoryTools(ctx),
  ...createInstructionTools(ctx),
});

export type AgentTools = ReturnType<typeof createAgentTools>;
