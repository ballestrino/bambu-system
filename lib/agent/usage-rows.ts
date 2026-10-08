import type { AgentUsageKind } from "@/lib/agent/usage-collector";

// Filas de "Costos de IA" del mes. Puro: lo prueba el check.
export type UsageCostSums = {
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
  cacheWriteTokens: number;
  reasoningTokens: number;
  // Segundos de audio de los dictados; 0 en el resto.
  audioSeconds: number;
  costUsd: number;
  // Algún registro del grupo tenía precio (Postgres no suma los NULL).
  priced: boolean;
  events: number;
};

type MonthlyGroup<Mode> = UsageCostSums & {
  kind: AgentUsageKind;
  modelId: string;
  mode: Mode;
  reasoning: string | null;
};

// La tarea de la fila: los títulos y los dictados van aparte de los turnos,
// son otro modelo o se cobran distinto.
export type MonthlyCostTask = "chat" | "titles" | "transcriptions";

export type MonthlyCostRow<Mode> = UsageCostSums & {
  modelId: string;
  mode: Mode;
  reasoning: string | null;
  task: MonthlyCostTask;
  eventsByKind: Partial<Record<AgentUsageKind, number>>;
};

const TASK_BY_KIND: Record<AgentUsageKind, MonthlyCostTask> = {
  TURN: "chat",
  SKILL: "chat",
  TITLE: "titles",
  TRANSCRIPTION: "transcriptions",
};

const roundUsd = (value: number) => Math.round(value * 1_000_000) / 1_000_000;

// Una fila por modelo, razonamiento, modo y tarea. Los borradores de
// draftEmail se suman a los turnos (mismo modelo y razonamiento); los títulos
// y los dictados van aparte.
export const buildMonthlyCostRows = <Mode extends string>(groups: MonthlyGroup<Mode>[]) => {
  const rows = new Map<string, MonthlyCostRow<Mode>>();
  groups.forEach(({ kind, ...group }) => {
    const task = TASK_BY_KIND[kind];
    const key = [group.modelId, group.reasoning, group.mode, task].join(":");
    const current = rows.get(key);
    if (!current) {
      rows.set(key, { ...group, task, eventsByKind: { [kind]: group.events } });
      return;
    }
    current.inputTokens += group.inputTokens;
    current.outputTokens += group.outputTokens;
    current.cachedInputTokens += group.cachedInputTokens;
    current.cacheWriteTokens += group.cacheWriteTokens;
    current.reasoningTokens += group.reasoningTokens;
    current.audioSeconds += group.audioSeconds;
    current.costUsd = roundUsd(current.costUsd + group.costUsd);
    current.priced ||= group.priced;
    current.events += group.events;
    current.eventsByKind[kind] = (current.eventsByKind[kind] ?? 0) + group.events;
  });
  return [...rows.values()];
};
