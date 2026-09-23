import { getCalculationAmounts, type BudgetCalculation } from "@/lib/agent/budget-calculation";
import { getSummaryAmounts } from "@/lib/agent/proposal-summary";
import {
  PROPOSAL_STATUS_LABELS,
  type AgentProposalDto,
  type ProposalChange,
} from "@/lib/agent/proposals";

// Lo que el modelo ve de las propuestas. La salida guardada de una tool
// propose* dice PENDING para siempre: en la prueba real el modelo dio por
// pendientes propuestas ya confirmadas, rechazadas o vencidas. Y una guardada
// desde el editor de la 43 tiene otro resumen: el de lo editado. Puro.
export type ProposalPromptItem = Pick<AgentProposalDto, "status" | "summary" | "result" | "error"> & {
  unknownOutcome?: boolean;
};

type LiveProposal = Pick<AgentProposalDto, "id" | "status" | "result" | "error" | "summary">;

const money = new Intl.NumberFormat("es-UY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Los finales de lo que quedó guardado, que pueden no ser los de la tool.
const describeSaved = (after: BudgetCalculation | null | undefined) => {
  if (!after) return "";
  const withProducts = after.withProducts ? ` y $ ${money.format(after.withProducts.final)} con productos` : "";
  return `, con $ ${money.format(after.withoutProducts.final)} sin productos${withProducts} (finales con IVA)`;
};

const formatValue = (value: ProposalChange["before"]) => {
  if (value === null) return "—";
  if (typeof value === "boolean") return value ? "sí" : "no";
  if (typeof value === "number") return value.toLocaleString("es-UY", { maximumFractionDigits: 3 });
  return `"${value}"`;
};

const MAX_CHANGES = 3;

// "(Margen del servicio 45 → 40)": dos propuestas sobre el mismo presupuesto
// tienen el mismo título y sin esto no se distinguen.
const describeChanges = (changes: ProposalChange[] = []) => {
  if (!changes.length) return "";
  const listed = changes
    .slice(0, MAX_CHANGES)
    .map((change) => `${change.label} ${formatValue(change.before)} → ${formatValue(change.after)}`);
  const rest = changes.length > MAX_CHANGES ? ` y ${changes.length - MAX_CHANGES} más` : "";
  return ` (${listed.join(", ")}${rest})`;
};

// Una línea por propuesta con su estado vivo. Una que quedó ejecutándose
// cuando se cortó el servidor tiene resultado desconocido: repetirla podría
// escribir dos veces.
export const formatProposalsForPrompt = (proposals: ProposalPromptItem[]) =>
  proposals
    .map(({ status, summary, result, error, unknownOutcome }) => {
      const label = unknownOutcome ? "resultado desconocido" : PROPOSAL_STATUS_LABELS[status];
      const line = `- ${summary.title}${describeChanges(summary.changes)}: ${label}`;
      if (unknownOutcome) return `${line} (se cortó mientras se ejecutaba: revisá el presupuesto antes de proponerla de nuevo).`;
      if (status === "CONFIRMED" && result) return `${line}. Quedó en ${result.url}${describeSaved(summary.after)}.`;
      if ((status === "FAILED" || status === "EXPIRED") && error) return `${line} (${error}).`;
      return `${line}.`;
    })
    .join("\n");

// Lo guardado al confirmar se puede citar: un cálculo guardado desde el
// editor no tiene una salida propose* que lo diga.
export const getConfirmedAmounts = (proposals: Pick<AgentProposalDto, "status" | "summary">[]) =>
  proposals.flatMap(({ status, summary }) =>
    status === "CONFIRMED" && summary.after ? getCalculationAmounts(summary.after) : []
  );

type ToolPart = { type: string; state?: string; output?: unknown };

type ProposalOutput = { ok?: boolean; data?: Record<string, unknown> };

// El historial que se manda al modelo, con el estado y el resumen vivos en la
// salida de cada tool propose*, y los importes citables de ese resumen. No se
// guarda: la base conserva la salida original.
export const withLiveProposals = <M extends { parts: unknown[] }>(
  messages: M[],
  proposals: LiveProposal[]
) => {
  const byId = new Map(proposals.map((proposal) => [proposal.id, proposal]));
  const patch = (part: unknown) => {
    const tool = part as ToolPart;
    if (!tool.type?.startsWith("tool-propose") || tool.state !== "output-available") return part;
    const output = tool.output as ProposalOutput | undefined;
    const proposalId = output?.ok ? output.data?.proposalId : undefined;
    const live = typeof proposalId === "string" ? byId.get(proposalId) : undefined;
    if (!live || !output?.data) return part;
    return {
      ...tool,
      output: {
        ...output,
        data: {
          ...output.data,
          status: live.status,
          result: live.result,
          error: live.error,
          summary: live.summary,
          grounding: { amounts: getSummaryAmounts(live.summary) },
        },
      },
    };
  };
  return messages.map((message) => ({ ...message, parts: message.parts.map(patch) }) as M);
};
