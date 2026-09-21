import {
  PROPOSAL_STATUS_LABELS,
  type AgentProposalDto,
  type ProposalChange,
} from "@/lib/agent/proposals";

// Lo que el modelo ve de las propuestas. La salida guardada de una tool
// propose* dice PENDING para siempre: en la prueba real el modelo dio por
// pendientes propuestas ya confirmadas, rechazadas o vencidas. Puro.
export type ProposalPromptItem = Pick<AgentProposalDto, "status" | "summary" | "result" | "error"> & {
  unknownOutcome?: boolean;
};

type LiveProposal = Pick<AgentProposalDto, "id" | "status" | "result" | "error">;

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
      if (status === "CONFIRMED" && result) return `${line}. Quedó en ${result.url}.`;
      if ((status === "FAILED" || status === "EXPIRED") && error) return `${line} (${error}).`;
      return `${line}.`;
    })
    .join("\n");

type ToolPart = { type: string; state?: string; output?: unknown };

type ProposalOutput = { ok?: boolean; data?: Record<string, unknown> };

// El historial que se manda al modelo, con el estado vivo en la salida de
// cada tool propose*. No se guarda: la base conserva la salida original.
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
        data: { ...output.data, status: live.status, result: live.result, error: live.error },
      },
    };
  };
  return messages.map((message) => ({ ...message, parts: message.parts.map(patch) }) as M);
};
