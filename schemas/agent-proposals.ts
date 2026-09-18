import { z } from "zod";

import type { AgentProposalKind } from "@/lib/agent/proposals";
import { BudgetSchema } from "@/schemas/BudgetSchema";

// Payloads de las propuestas del agente. Se validan al proponer y otra vez al
// confirmar: lo guardado en la base no se ejecuta sin pasar por acá.
// Visitas y empleadas son enteros en la base (BudgetOption).
export const proposalBudgetValuesSchema = BudgetSchema.extend({
  visits: z.number().int().min(0),
  employees: z.number().int().min(1),
});

const idSchema = z.string().trim().min(1).max(64);

// updatedAt del presupuesto cuando se propuso: si cambió, la propuesta ya no
// describe lo que se va a guardar.
const baseUpdatedAtSchema = z.iso.datetime();

export const proposalPayloadSchemas = {
  CREATE_BUDGET: z.object({ values: proposalBudgetValuesSchema }),
  UPDATE_BUDGET: z.object({
    budgetId: idSchema,
    newSlug: z.string().trim().min(1).max(200),
    values: proposalBudgetValuesSchema,
    baseUpdatedAt: baseUpdatedAtSchema,
    officialBudgetId: idSchema.nullable(),
  }),
  DUPLICATE_BUDGET: z.object({ budgetId: idSchema, baseUpdatedAt: baseUpdatedAtSchema }),
  PUBLISH_OFFICIAL_BUDGET: z.object({
    sourceBudgetId: idSchema,
    baseUpdatedAt: baseUpdatedAtSchema,
  }),
} satisfies Record<AgentProposalKind, z.ZodType>;

export type ProposalPayloads = {
  [K in AgentProposalKind]: z.infer<(typeof proposalPayloadSchemas)[K]>;
};

export type ParsedProposal = {
  [K in AgentProposalKind]: { kind: K; payload: ProposalPayloads[K] };
}[AgentProposalKind];

export const parseProposalPayload = (
  kind: AgentProposalKind,
  payload: unknown
): ParsedProposal | null => {
  const parsed = proposalPayloadSchemas[kind].safeParse(payload);
  return parsed.success ? ({ kind, payload: parsed.data } as ParsedProposal) : null;
};

export const agentProposalIdSchema = idSchema;
