"use server";

import { getRecentMessageUsage } from "@/data/agent/usage-estimates";
import { toAgentErrorMessage } from "@/lib/agent/errors";
import { estimateMessageCost, type MessageUsageSample } from "@/lib/agent/message-cost-estimate";
import { isRecommendedMode } from "@/lib/ai/model-choices";
import { AGENT_MODE_IDS } from "@/lib/ai/modes";
import {
  PROVIDER_KEY_NAMES,
  hasProviderCredentials,
  resolveDefaultMode,
  resolveModelSpec,
} from "@/lib/ai/model-spec";
import {
  AdminAuthorizationError,
  requireAdminSession,
} from "@/lib/require-admin-session";

// Sin el uso reciente, los modos se muestran igual, sin costo estimado.
const readRecentUsage = async (): Promise<MessageUsageSample[]> => {
  try {
    return await getRecentMessageUsage();
  } catch (error) {
    console.error("Error reading agent usage for estimates:", error);
    return [];
  }
};

// Los modos como los resuelve el servidor: el modelo real de cada uno (con
// los overrides AI_MODEL_* y AI_REASONING_*), el costo estimado por mensaje,
// si su proveedor tiene clave (si no, la variable que falta) y el modo por
// defecto (AI_DEFAULT_MODE). El cliente no puede leer esas variables.
export const getAgentSettings = async () => {
  try {
    await requireAdminSession();
    const samples = await readRecentUsage();
    return {
      defaultMode: resolveDefaultMode(),
      modes: AGENT_MODE_IDS.map((mode) => {
        const spec = resolveModelSpec(mode);
        const available = hasProviderCredentials(spec.provider);
        return {
          id: mode,
          modelId: spec.modelId,
          reasoning: spec.reasoning,
          recommended: isRecommendedMode(mode),
          missingKey: available ? null : PROVIDER_KEY_NAMES[spec.provider],
          estimatedCostUsd: estimateMessageCost(spec, samples),
        };
      }),
    };
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return { error: error.message };
    console.error("Error reading agent settings:", error);
    // Un AI_* mal escrito se muestra tal cual: dice qué variable arreglar.
    return { error: toAgentErrorMessage(error) };
  }
};
