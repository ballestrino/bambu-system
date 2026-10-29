import { formatDate } from "@/components/agent/format";
import { MEMORY_KIND_LABELS } from "@/lib/agent/memory";
import type { ProposalSummary } from "@/lib/agent/proposals";

type Memory = NonNullable<ProposalSummary["memory"]>;

// Lo que se va a recordar: el texto nuevo y, si reemplaza una memoria, el de
// antes tachado.
export function AgentMemoryDetails({ memory }: { memory: Memory }) {
  return (
    <div className="space-y-2 rounded-[10px] border border-ops-border px-3 py-2.5 text-[13px] leading-snug">
      <p className="text-xs text-ops-text-muted">
        {MEMORY_KIND_LABELS[memory.kind]}
        {memory.expiresAt ? ` · vale hasta el ${formatDate(memory.expiresAt)}` : " · sin fecha de fin"}
      </p>
      {memory.previousText && (
        <p className="text-ops-text-muted line-through decoration-ops-text-muted/60">{memory.previousText}</p>
      )}
      <p className="font-medium">{memory.text}</p>
    </div>
  );
}
