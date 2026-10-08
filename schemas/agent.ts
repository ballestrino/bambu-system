import { z } from "zod";

import {
  AGENT_IMAGE_MAX_DIMENSION,
  AGENT_IMAGE_MEDIA_TYPES,
  AGENT_MAX_IMAGES,
  AGENT_MAX_RECORDING_SECONDS,
  parseAgentAttachmentId,
  TOO_MANY_IMAGES_MESSAGE,
} from "@/lib/agent/attachment-rules";
import { AGENT_CLIENT_ID_PATTERN } from "@/lib/agent/client-id";
import { AGENT_SKILL_IDS } from "@/lib/agent/skills/types";
import { AGENT_MODE_IDS } from "@/lib/ai/modes";
import { BudgetSchema } from "@/schemas/BudgetSchema";

// Pedido de /api/agent/chat. El cliente manda solo el último mensaje: el
// historial se lee de la base, así nadie puede reescribirlo desde el navegador.
export const agentModeSchema = z.enum(AGENT_MODE_IDS);

export const agentSkillSchema = z.enum(AGENT_SKILL_IDS);

// Los ids de conversación y de mensaje los genera el AI SDK en el cliente.
export const agentClientIdSchema = z.string().regex(AGENT_CLIENT_ID_PATTERN, "Id inválido");

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

const agentTextPartSchema = z.object({ type: z.literal("text"), text: z.string().trim().min(1).max(8000) });

// Una imagen ya subida: el mensaje lleva su dirección, no los bytes.
const agentImagePartSchema = z.object({
  type: z.literal("file"),
  mediaType: z.enum(AGENT_IMAGE_MEDIA_TYPES),
  url: z.string().refine((url) => parseAgentAttachmentId(url) !== null, "Imagen inválida"),
  filename: z.string().max(200).optional(),
});

// Texto, imágenes o las dos cosas: una captura sola también es un pedido.
export const agentUserMessageSchema = z.object({
  id: agentClientIdSchema,
  role: z.literal("user"),
  parts: z
    .array(z.discriminatedUnion("type", [agentTextPartSchema, agentImagePartSchema]))
    .min(1)
    .max(8 + AGENT_MAX_IMAGES)
    .superRefine((parts, ctx) => {
      const images = parts.filter((part) => part.type === "file");
      if (images.length > AGENT_MAX_IMAGES) ctx.addIssue({ code: "custom", message: TOO_MANY_IMAGES_MESSAGE });
      if (new Set(images.map((part) => part.url)).size !== images.length) {
        ctx.addIssue({ code: "custom", message: "Una imagen está repetida" });
      }
      if (parts.length - images.length > 8) ctx.addIssue({ code: "custom", message: "Demasiados textos" });
    }),
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

// Campos del dictado (multipart, junto al audio). La duración la mide el
// navegador: se usa para el costo si OpenAI no la informa.
export const agentTranscriptionFieldsSchema = z.object({
  mode: agentModeSchema,
  conversationId: agentClientIdSchema.optional(),
  durationSeconds: z.coerce.number().min(0).max(AGENT_MAX_RECORDING_SECONDS + 5),
});

// Campos de una imagen subida (multipart). Las medidas son las que dejó el
// navegador al achicarla: sirven para mostrarla sin saltos.
export const agentAttachmentFieldsSchema = z.object({
  width: z.coerce.number().int().min(1).max(AGENT_IMAGE_MAX_DIMENSION),
  height: z.coerce.number().int().min(1).max(AGENT_IMAGE_MAX_DIMENSION),
  filename: z.string().trim().max(200).optional(),
});

export const agentConversationTitleSchema = z.string().trim().min(1).max(120);

// Filtro del historial: las de un presupuesto, las sin presupuesto
// (budgetId null) o, con all, todas las del usuario (la página del agente).
export const agentConversationListSchema = z.object({
  budgetId: z.string().min(1).max(64).nullable().optional(),
  all: z.boolean().optional(),
  query: z.string().trim().max(120).optional(),
});
