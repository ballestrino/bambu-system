import { AgentBudgetTotalsCard } from "@/components/agent/cards/agent-budget-totals-card";
import { AgentEmailCard } from "@/components/agent/cards/agent-email-card";
import { AgentFinanceCard, AgentFinanceTrendCard } from "@/components/agent/cards/agent-finance-card";
import { AgentListCard } from "@/components/agent/cards/agent-list-card";
import { AgentOfficialBudgetCard, AgentOfficialSearchCard } from "@/components/agent/cards/agent-official-card";
import { AgentPayrollCard } from "@/components/agent/cards/agent-payroll-card";
import { AgentProfitabilityCard } from "@/components/agent/cards/agent-profitability-card";
import { AgentProposalCard } from "@/components/agent/cards/agent-proposal-card";
import type { AgentToolData, AgentToolName, ListCardData } from "@/components/agent/types";

// La tarjeta de una salida de tool según su discriminador `card`. Los datos
// del negocio (card "business") no llevan tarjeta: alcanza con el chip.
export function AgentToolCard({ data }: { data: AgentToolData<AgentToolName> }) {
  switch (data.card) {
    case "budget":
    case "budget-totals":
      return <AgentBudgetTotalsCard data={data} />;
    case "proposal":
      return <AgentProposalCard data={data} />;
    case "email":
      return <AgentEmailCard data={data} />;
    case "finance":
      return <AgentFinanceCard data={data} />;
    case "finance-trend":
      return <AgentFinanceTrendCard data={data} />;
    case "payroll":
      return <AgentPayrollCard data={data} />;
    case "profitability":
      return <AgentProfitabilityCard data={data} />;
    case "official-search":
      return <AgentOfficialSearchCard data={data} />;
    case "official-budget":
      return <AgentOfficialBudgetCard data={data} />;
    case "list":
      return <AgentListCard data={data as ListCardData} />;
    default:
      return null;
  }
}
