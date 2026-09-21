import { z } from "zod";

import type { AgentProposalKind } from "@/lib/agent/proposals";
import { agentClientIdSchema } from "@/schemas/agent";
import { BudgetSchema } from "@/schemas/BudgetSchema";

// Payloads de las propuestas del agente. Se validan al proponer y otra vez al
// confirmar: lo guardado en la base no se ejecuta sin pasar por acá.
// Visitas y empleadas son enteros en la base (BudgetOption). El IVA es mayor
// que 0: el cálculo toma el 0 como 22 y las acciones guardan el IVA crudo, así
// que con 0 lo guardado no sería lo que mostró la tarjeta.
export const proposalBudgetValuesSchema = BudgetSchema.extend({
  visits: z.number().int().min(0),
  employees: z.number().int().min(1),
  iva: z.number().positive("El IVA tiene que ser mayor que 0"),
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

// El formulario del editor del chat: el del generador con los límites de una
// propuesta y los mensajes en castellano. Convierte los números (los inputs
// dan texto): lo que sale de acá ya se puede mandar a guardar.
export const agentBudgetEditorSchema = BudgetSchema.extend({
  name: z.string().trim().min(1, "Poné un nombre para guardarlo en el generador."),
  visits: z.coerce.number().int("Las visitas van sin decimales.").min(0, "Las visitas no pueden ser negativas."),
  employees: z.coerce.number().int("Las empleadas van sin decimales.").min(1, "Tiene que haber al menos una empleada."),
  iva: z.coerce.number().positive("El IVA tiene que ser mayor que 0."),
});

// Guardar desde el chat un presupuesto que armó el agente: la llamada a tool
// que lo armó y los valores, quizás editados.
export const agentSaveBudgetSchema = z.object({
  conversationId: agentClientIdSchema,
  toolCallId: z.string().trim().min(1).max(128),
  values: proposalBudgetValuesSchema,
});
