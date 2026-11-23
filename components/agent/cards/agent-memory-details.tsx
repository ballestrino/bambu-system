import { formatDate } from "@/components/agent/format";
import { MEMORY_KIND_LABELS } from "@/lib/agent/memory";
import type { ProposalSummary } from "@/lib/agent/proposals";

type Memory = NonNullable<ProposalSummary["memory"]>;

// El subtítulo de una memoria: de qué es y hasta cuándo vale. El texto va
// como título de la tarjeta.
export const memoryLine = (memory: Memory) =>
  `${MEMORY_KIND_LABELS[memory.kind]}${memory.expiresAt ? ` · vale hasta el ${formatDate(memory.expiresAt)}` : " · vale hasta que lo cambies"}`;

// Si reemplaza una memoria, la de antes tachada.
export function AgentMemoryDetails({ memory }: { memory: Memory }) {
  if (!memory.previousText) return null;
  return (
    <p className="rounded-[10px] border border-ops-border px-3 py-2.5 text-[13px] leading-snug text-ops-text-muted">
      <span className="block text-xs">Reemplaza a</span>
      <span className="line-through decoration-ops-text-muted/60">{memory.previousText}</span>
    </p>
  );
}
