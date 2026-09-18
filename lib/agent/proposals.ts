import type { BudgetCalculation, describeBudgetInputs } from "@/lib/agent/budget-calculation";
import type { ParsedProposal } from "@/schemas/agent-proposals";

// Propuestas del agente: escrituras que se preparan durante el turno y se
// ejecutan solo cuando quien conversa las confirma. Puro: lo usan las tools,
// las acciones, el prompt, el check y la tarjeta de la UI.
export const AGENT_PROPOSAL_KINDS = [
  "CREATE_BUDGET",
  "UPDATE_BUDGET",
  "DUPLICATE_BUDGET",
  "PUBLISH_OFFICIAL_BUDGET",
] as const;

export type AgentProposalKind = (typeof AGENT_PROPOSAL_KINDS)[number];

export const AGENT_PROPOSAL_STATUSES = [
  "PENDING",
  "EXECUTING",
  "CONFIRMED",
  "REJECTED",
  "EXPIRED",
  "FAILED",
] as const;

export type AgentProposalStatus = (typeof AGENT_PROPOSAL_STATUSES)[number];

export const PROPOSAL_STATUS_LABELS: Record<AgentProposalStatus, string> = {
  PENDING: "pendiente de confirmar",
  EXECUTING: "ejecutándose",
  CONFIRMED: "confirmada",
  REJECTED: "rechazada",
  EXPIRED: "vencida",
  FAILED: "falló",
};

// A las 24 horas vence: el presupuesto y los precios pueden haber cambiado, y
// confirmar algo viejo sorprende.
export const PROPOSAL_TTL_MS = 24 * 60 * 60 * 1000;

export const getProposalExpiry = (from: Date) => new Date(from.getTime() + PROPOSAL_TTL_MS);

type StatusSource = { status: AgentProposalStatus; expiresAt: Date | string };

export const isProposalExpired = (proposal: StatusSource, now = new Date()) =>
  proposal.status === "PENDING" && new Date(proposal.expiresAt).getTime() <= now.getTime();

// El estado que se muestra: una pendiente vencida se ve vencida aunque nadie
// la haya marcado todavía (las lecturas no escriben).
export const resolveProposalStatus = (proposal: StatusSource, now = new Date()) =>
  isProposalExpired(proposal, now) ? "EXPIRED" : proposal.status;

export const getBudgetUrl = (slug: string) => `/dashboard/budgets/budget/${slug}`;

export const getOfficialBudgetUrl = (id: string) => `/dashboard/official-budgets/${id}`;

export type ProposalValue = string | number | boolean | null;

export type ProposalChange = {
  field: string;
  label: string;
  before: ProposalValue;
  after: ProposalValue;
};

export type StoredOptionPrice = { hasProducts: boolean; net: number; iva: number; final: number };

// Lo que muestra la tarjeta. Se guarda con la propuesta: nada se recalcula
// al mostrarla.
export type ProposalSummary = {
  title: string;
  name: string;
  slug: string | null;
  changes: ProposalChange[];
  inputs: ReturnType<typeof describeBudgetInputs> | null;
  before: BudgetCalculation | null;
  after: BudgetCalculation | null;
  stored: StoredOptionPrice[];
  warnings: string[];
};

export type ProposalResult = {
  label: string;
  url: string;
  budgetId: string | null;
  slug: string | null;
  officialBudgetId: string | null;
  officialVersion: number | null;
};

export const proposalSelect = {
  id: true,
  kind: true,
  status: true,
  summary: true,
  result: true,
  error: true,
  toolCallId: true,
  conversationId: true,
  expiresAt: true,
  resolvedAt: true,
  createdAt: true,
} as const;

export type ProposalRow = {
  id: string;
  kind: AgentProposalKind;
  status: AgentProposalStatus;
  summary: unknown;
  result: unknown;
  error: string | null;
  toolCallId: string;
  conversationId: string;
  expiresAt: Date;
  resolvedAt: Date | null;
  createdAt: Date;
};

export const serializeProposal = (row: ProposalRow, now = new Date()) => ({
  id: row.id,
  kind: row.kind,
  status: resolveProposalStatus(row, now),
  summary: row.summary as ProposalSummary,
  result: (row.result ?? null) as ProposalResult | null,
  error: row.error,
  toolCallId: row.toolCallId,
  conversationId: row.conversationId,
  expiresAt: row.expiresAt.toISOString(),
  resolvedAt: row.resolvedAt?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
});

export type AgentProposalDto = ReturnType<typeof serializeProposal>;

const CONFIRM_ERRORS: Record<AgentProposalStatus, string> = {
  PENDING: "La propuesta sigue pendiente.",
  EXECUTING: "La propuesta se está ejecutando.",
  CONFIRMED: "La propuesta ya estaba confirmada.",
  REJECTED: "La propuesta fue rechazada.",
  EXPIRED: "La propuesta venció: pedile al asistente una nueva.",
  FAILED: "La propuesta no se pudo ejecutar.",
};

const REJECT_ERRORS: Record<AgentProposalStatus, string> = {
  ...CONFIRM_ERRORS,
  CONFIRMED: "La propuesta ya se confirmó: no se puede rechazar.",
  EXPIRED: "La propuesta ya venció.",
  FAILED: "La propuesta ya falló: no queda nada por rechazar.",
};

// Lo que devuelven las acciones según el estado guardado. Repetir una
// confirmación o un rechazo devuelve el mismo resultado: son idempotentes.
export const describeConfirmOutcome = (proposal: AgentProposalDto) =>
  proposal.status === "CONFIRMED"
    ? { success: "Propuesta confirmada", proposal }
    : { error: (proposal.status === "FAILED" && proposal.error) || CONFIRM_ERRORS[proposal.status], proposal };

export const describeRejectOutcome = (proposal: AgentProposalDto) =>
  proposal.status === "REJECTED"
    ? { success: "Propuesta rechazada", proposal }
    : { error: REJECT_ERRORS[proposal.status], proposal };

export const PROPOSAL_STALE_MESSAGE =
  "El presupuesto cambió desde la propuesta: pedile al asistente una nueva.";

export type ProposalBudgetState = {
  userId: string;
  updatedAt: Date;
  officialBudget: { id: string } | null;
};

export const getProposalBudgetId = (proposal: ParsedProposal) => {
  if (proposal.kind === "CREATE_BUDGET") return null;
  if (proposal.kind === "PUBLISH_OFFICIAL_BUDGET") return proposal.payload.sourceBudgetId;
  return proposal.payload.budgetId;
};

// Se re-valida al confirmar, contra una lectura fresca: el presupuesto tiene
// que ser el mismo que mostró la tarjeta. null = se puede ejecutar.
export const checkProposalPreconditions = (
  proposal: ParsedProposal,
  state: ProposalBudgetState | null,
  actorId: string
) => {
  if (proposal.kind === "CREATE_BUDGET") return null;
  if (!state) return "El presupuesto ya no existe.";
  if (state.updatedAt.toISOString() !== proposal.payload.baseUpdatedAt) return PROPOSAL_STALE_MESSAGE;
  if (proposal.kind === "UPDATE_BUDGET") {
    return (state.officialBudget?.id ?? null) === proposal.payload.officialBudgetId
      ? null
      : PROPOSAL_STALE_MESSAGE;
  }
  if (proposal.kind === "DUPLICATE_BUDGET") {
    return state.userId === actorId ? null : "Solo quien creó el presupuesto puede duplicarlo.";
  }
  return state.officialBudget ? "El presupuesto ya está publicado como oficial." : null;
};
