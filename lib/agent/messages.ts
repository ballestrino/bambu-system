import type { InferUITools, UIDataTypes, UIMessage } from "ai";

import type { AgentSkillId } from "@/lib/agent/skills/types";
import type { AgentTools } from "@/lib/agent/tools";
import type { TurnUsageSummary } from "@/lib/agent/usage-collector";
import type { AgentMode } from "@/lib/ai/modes";

// El UIMessage del agente y su conversión a fila de AgentMessage. Solo tipos
// del SDK: lo usan la ruta y, más adelante, el cliente.
export type AgentMessageMetadata = {
  mode?: AgentMode;
  skill?: AgentSkillId;
  createdAt?: string;
  usage?: TurnUsageSummary;
  // La respuesta se detuvo antes de terminar (Stop o pedido cortado).
  stopped?: boolean;
};

export type AgentUITools = InferUITools<AgentTools>;

export type AgentUIMessage = UIMessage<AgentMessageMetadata, UIDataTypes, AgentUITools>;

export type AgentMessageRole = "USER" | "ASSISTANT" | "SYSTEM";

const ROLE_TO_UI = { USER: "user", ASSISTANT: "assistant", SYSTEM: "system" } as const;

const ROLE_TO_DB = { user: "USER", assistant: "ASSISTANT", system: "SYSTEM" } as const;

export const toDbMessageRole = (role: AgentUIMessage["role"]): AgentMessageRole =>
  ROLE_TO_DB[role];

export type AgentMessageRow = {
  id: string;
  role: AgentMessageRole;
  parts: unknown;
  metadata: unknown;
};

export const rowToAgentMessage = (row: AgentMessageRow): AgentUIMessage => ({
  id: row.id,
  role: ROLE_TO_UI[row.role],
  parts: (Array.isArray(row.parts) ? row.parts : []) as AgentUIMessage["parts"],
  metadata: (row.metadata ?? undefined) as AgentMessageMetadata | undefined,
});

// El texto plano del mensaje, para títulos, búsquedas y vistas previas.
export const getMessageText = (message: Pick<AgentUIMessage, "parts">) =>
  message.parts
    .flatMap((part) => (part.type === "text" ? [part.text] : []))
    .join("\n\n")
    .trim();
