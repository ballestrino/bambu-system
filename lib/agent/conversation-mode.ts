import type { AgentMode as DbAgentMode } from "@prisma/client";

import type { AgentMode } from "@/lib/ai/modes";

// El modo en la base es el enum de Prisma (BAJO, MEDIO, ALTO); en el código y
// en la UI, el de lib/ai/modes. Solo tipos de Prisma: sirve en el cliente.
export const toDbAgentMode = (mode: AgentMode) => mode.toUpperCase() as DbAgentMode;

export const fromDbAgentMode = (mode: DbAgentMode) => mode.toLowerCase() as AgentMode;
