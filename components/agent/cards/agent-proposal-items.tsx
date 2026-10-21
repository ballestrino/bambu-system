import type { ProposalSummary } from "@/lib/agent/proposals";

// La lista de un lote (las visitas de CREATE_VISITS): cada fila con su
// horario y, si hay, un detalle a la derecha.
export function AgentProposalItems({ items }: { items: NonNullable<ProposalSummary["items"]> }) {
  return (
    <ol className="overflow-hidden rounded-[10px] border border-ops-border text-[13px] tabular-nums">
      {items.map((item, index) => (
        <li
          key={`${index}-${item.label}`}
          className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-ops-border px-3 py-2 last:border-b-0"
        >
          <span className="font-medium">{item.label}</span>
          {item.detail && <span className="text-right text-xs text-amber-700 dark:text-amber-300">{item.detail}</span>}
        </li>
      ))}
    </ol>
  );
}
