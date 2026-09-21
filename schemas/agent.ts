import { z } from "zod";

import { AGENT_SKILL_IDS } from "@/lib/agent/skills/types";
import { AGENT_MODE_IDS } from "@/lib/ai/modes";
import { BudgetSchema } from "@/schemas/BudgetSchema";

// Pedido de /api/agent/chat. El cliente manda solo el último mensaje: el
// historial se lee de la base, así nadie puede reescribirlo desde el navegador.
export const agentModeSchema = z.enum(AGENT_MODE_IDS);

export const agentSkillSchema = z.enum(AGENT_SKILL_IDS);

// Los ids de conversación y de mensaje los genera el AI SDK en el cliente.
export const agentClientIdSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{8,64}$/, "Id inválido");

// Valores del formulario sin guardar: pueden venir incompletos y sin nombre.
export const agentFormContextValuesSchema = BudgetSchema.partial().extend({
  name: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
});

export type AgentFormContextValues = z.infer<typeof agentFormContextValuesSchema>;

export const agentBudgetContextSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("saved"), budgetId: z.string().min(1).max(64) }),
  z.object({ kind: z.literal("form"), values: agentFormContextValuesSchema }),
]);

export type AgentBudgetContextInput = z.infer<typeof agentBudgetContextSchema>;

export const agentUserMessageSchema = z.object({
  id: agentClientIdSchema,
  role: z.literal("user"),
  parts: z
    .array(z.object({ type: z.literal("text"), text: z.string().trim().min(1).max(8000) }))
    .min(1)
    .max(8),
});

export const agentChatRequestSchema = z.object({
  id: agentClientIdSchema,
  message: agentUserMessageSchema,
  mode: agentModeSchema,
  skill: agentSkillSchema.default("general"),
  context: agentBudgetContextSchema.optional(),
  trigger: z.enum(["submit-message", "regenerate-message"]).default("submit-message"),
  messageId: agentClientIdSchema.optional(),
});

export type AgentChatRequest = z.infer<typeof agentChatRequestSchema>;

export const agentConversationTitleSchema = z.string().trim().min(1).max(120);
