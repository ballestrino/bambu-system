"use server";

import { toAgentErrorMessage } from "@/lib/agent/errors";
import { AGENT_MODE_IDS, AGENT_MODES } from "@/lib/ai/modes";
import { resolveDefaultMode, resolveModelSpec } from "@/lib/ai/model-spec";
import {
  AdminAuthorizationError,
  requireAdminSession,
} from "@/lib/require-admin-session";

// Los modos como los resuelve el servidor: el modelo real de cada uno (con
// los overrides AI_MODEL_* y AI_REASONING_*) y el modo por defecto
// (AI_DEFAULT_MODE). El cliente no puede leer esas variables.
export const getAgentSettings = async () => {
  try {
    await requireAdminSession();
    return {
      defaultMode: resolveDefaultMode(),
      modes: AGENT_MODE_IDS.map((mode) => {
        const spec = resolveModelSpec(mode);
        return { id: mode, ...AGENT_MODES[mode], modelId: spec.modelId, reasoning: spec.reasoning };
      }),
    };
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return { error: error.message };
    console.error("Error reading agent settings:", error);
    // Un AI_* mal escrito se muestra tal cual: dice qué variable arreglar.
    return { error: toAgentErrorMessage(error) };
  }
};
