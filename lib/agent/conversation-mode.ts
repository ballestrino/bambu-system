import type { AgentMode as DbAgentMode } from "@prisma/client";

import type { AgentMode, RecordedAgentMode } from "@/lib/ai/modes";

// El modo en la base es el enum de Prisma (BAJO, MEDIO, ALTO); en el código y
// en la UI, el de lib/ai/modes. Solo tipos de Prisma: sirve en el cliente.
export const toDbAgentMode = (mode: AgentMode) => mode.toUpperCase() as DbAgentMode;

// Tal como se registró: el historial de costos.
export const fromDbRecordedMode = (mode: DbAgentMode) => mode.toLowerCase() as RecordedAgentMode;

// Los tres modos de la base están activos y conservan su selección.
export const fromDbAgentMode = (mode: DbAgentMode): AgentMode => fromDbRecordedMode(mode);
