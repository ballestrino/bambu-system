import type { AiEnv } from "@/lib/ai/model-spec";
import type { AgentReasoning } from "@/lib/ai/modes";
import { estimateUsageCost, type UsageCost } from "@/lib/ai/pricing";
import { sumUsage, type NormalizedUsage } from "@/lib/ai/usage";

// Junta el consumo de un turno: cada paso del modelo principal (TURN), las
// llamadas anidadas como draftEmail (SKILL) y el título (TITLE). Puro: la
// persistencia está en usage-store.ts.
export type AgentUsageKind = "TURN" | "SKILL" | "TITLE";

export type UsageEntry = {
  kind: AgentUsageKind;
  modelId: string;
  // El razonamiento pedido: "Costos de IA" separa Luna 6 Extra alto de Medio.
  reasoning: AgentReasoning;
  usage: NormalizedUsage;
  gatewayCostUsd: number | null;
};

export const createUsageCollector = () => {
  const entries: UsageEntry[] = [];
  return {
    add: (entry: UsageEntry) => {
      entries.push(entry);
    },
    entries: () => [...entries],
  };
};

export type AgentUsageCollector = ReturnType<typeof createUsageCollector>;

// El costo que informa el gateway gana sobre la estimación. Un override de
// precio mal escrito no puede tirar el turno: el uso queda sin precio.
export const priceUsageEntry = (entry: UsageEntry, env?: AiEnv): UsageCost => {
  if (entry.gatewayCostUsd !== null) return { costUsd: entry.gatewayCostUsd, priced: true };
  try {
    return estimateUsageCost(entry.modelId, entry.usage, env);
  } catch (error) {
    console.error("Agent usage pricing failed:", error);
    return { costUsd: null, priced: false };
  }
};

export type PricedUsageGroup = {
  kind: AgentUsageKind;
  modelId: string;
  reasoning: AgentReasoning;
  usage: NormalizedUsage;
  costUsd: number | null;
  priced: boolean;
};

const roundUsd = (value: number) => Math.round(value * 1_000_000) / 1_000_000;

// Un registro por tipo, modelo y razonamiento: los pasos de un turno se suman.
export const groupUsageEntries = (entries: UsageEntry[], env?: AiEnv) => {
  const groups = new Map<string, PricedUsageGroup>();
  entries.forEach((entry) => {
    const key = `${entry.kind}:${entry.modelId}:${entry.reasoning}`;
    const cost = priceUsageEntry(entry, env);
    const current = groups.get(key);
    if (!current) {
      const { kind, modelId, reasoning, usage } = entry;
      groups.set(key, { kind, modelId, reasoning, usage, ...cost });
      return;
    }
    current.usage = sumUsage(current.usage, entry.usage);
    current.priced = current.priced && cost.priced;
    current.costUsd =
      current.costUsd === null && cost.costUsd === null
        ? null
        : roundUsd((current.costUsd ?? 0) + (cost.costUsd ?? 0));
  });
  return [...groups.values()];
};

export type TurnUsageSummary = {
  modelId: string | null;
  tokens: NormalizedUsage & { total: number };
  costUsd: number | null;
  priced: boolean;
};

// Lo que muestra la línea de uso de cada respuesta: todo el turno, con las
// llamadas anidadas incluidas. Si algo no tiene precio, priced es false y
// costUsd suma solo lo que sí lo tiene.
export const summarizeUsage = (entries: UsageEntry[], env?: AiEnv): TurnUsageSummary => {
  const groups = groupUsageEntries(entries, env);
  const usage = sumUsage(...groups.map((group) => group.usage));
  const pricedCosts = groups.flatMap((group) => (group.costUsd === null ? [] : [group.costUsd]));
  return {
    modelId: entries.find((entry) => entry.kind === "TURN")?.modelId ?? entries[0]?.modelId ?? null,
    tokens: { ...usage, total: usage.inputTokens + usage.outputTokens },
    costUsd: pricedCosts.length ? roundUsd(pricedCosts.reduce((sum, cost) => sum + cost, 0)) : null,
    priced: groups.length > 0 && groups.every((group) => group.priced),
  };
};
