import type { AgentMode as DbAgentMode } from "@prisma/client";

import { RETIRED_AGENT_MODES, isAgentMode, type AgentMode, type RecordedAgentMode } from "@/lib/ai/modes";

// El modo en la base es el enum de Prisma (BAJO, MEDIO, ALTO); en el código y
// en la UI, el de lib/ai/modes. Solo tipos de Prisma: sirve en el cliente.
export const toDbAgentMode = (mode: AgentMode) => mode.toUpperCase() as DbAgentMode;

// Tal como se registró, retirados incluidos: el historial de costos.
export const fromDbRecordedMode = (mode: DbAgentMode) => mode.toLowerCase() as RecordedAgentMode;

// El modo de una conversación: una en un modo retirado sigue en el que lo
// reemplazó y lo guarda en su próximo turno.
export const fromDbAgentMode = (mode: DbAgentMode): AgentMode => {
  const recorded = fromDbRecordedMode(mode);
  return isAgentMode(recorded) ? recorded : RETIRED_AGENT_MODES[recorded].replacedBy;
};
