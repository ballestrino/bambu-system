import "server-only";

import { generateText, Output } from "ai";

import { summarizeUsage, type UsageEntry } from "@/lib/agent/usage-collector";
import { persistUsageEntries } from "@/lib/agent/usage-store";
import { buildAgentCallSettings } from "@/lib/ai/call-settings";
import { resolveModelSpec } from "@/lib/ai/model-spec";
import type { AgentMode } from "@/lib/ai/modes";
import { normalizeUsage, readGatewayCost } from "@/lib/ai/usage";
import { db } from "@/lib/db";
import {
  buildCvClassificationPrompt,
  CV_CLASSIFICATION_INSTRUCTIONS,
  cvClassificationOutputSchema,
  pickCvIds,
} from "@/lib/web-forms/cv-classification";

// Haiku, el modelo barato: alcanza para separar pedidos de postulaciones.
const MODE: AgentMode = "haiku_high";
// Una sola llamada: los nuevos más recientes.
const MAX_CANDIDATES = 100;

export type ClassifyOutcome = { success: string; moved: number; reviewed: number; costUsd: number | null } | { error: string };

// Lee los pedidos de servicio nuevos, le pide a Haiku los que son currículums y
// los pasa a Currículums. Lo único que cambia es el tipo; el consumo queda como
// SKILL sin conversación (como "Revisar con IA" de Facturación).
export const classifyNewRequestsWithAi = async (actorId: string): Promise<ClassifyOutcome> => {
  const candidates = await db.webFormSubmission.findMany({
    where: { kind: "CONTACT", status: "NEW" },
    orderBy: { createdAt: "desc" },
    take: MAX_CANDIDATES,
    select: { id: true, name: true, service: true, location: true, message: true },
  });
  if (!candidates.length) return { success: "No hay pedidos nuevos para revisar", moved: 0, reviewed: 0, costUsd: null };

  const spec = resolveModelSpec(MODE);
  const result = await generateText({
    ...buildAgentCallSettings(spec, { actorId }),
    instructions: CV_CLASSIFICATION_INSTRUCTIONS,
    prompt: buildCvClassificationPrompt(candidates),
    output: Output.object({ schema: cvClassificationOutputSchema, name: "clasificacion" }),
    maxOutputTokens: 8_000,
  });

  const entries: UsageEntry[] = [
    {
      kind: "SKILL",
      modelId: spec.modelId,
      reasoning: spec.reasoning,
      usage: normalizeUsage(result.totalUsage),
      gatewayCostUsd: readGatewayCost(result.providerMetadata),
    },
  ];
  await persistUsageEntries({ conversationId: null, entries, messageId: null, mode: MODE });

  const ids = pickCvIds(candidates, result.output);
  const { count } = ids.length
    ? await db.webFormSubmission.updateMany({ where: { id: { in: ids }, kind: "CONTACT" }, data: { kind: "JOB_APPLICATION" } })
    : { count: 0 };
  const reviewed = candidates.length;
  const success =
    count === 0
      ? `Revisé ${reviewed === 1 ? "1 pedido nuevo" : `${reviewed} pedidos nuevos`}: ninguno era un currículum`
      : `${count === 1 ? "1 pedido era un currículum y pasó" : `${count} pedidos eran currículums y pasaron`} a Currículums`;
  return { success, moved: count, reviewed, costUsd: summarizeUsage(entries).costUsd };
};
