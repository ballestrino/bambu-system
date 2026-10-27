import { Checkbox } from "@/components/ui/checkbox";
import type { ProposalSummary } from "@/lib/agent/proposals";
import { cn } from "@/lib/utils";

type Items = NonNullable<ProposalSummary["items"]>;

// Pendiente: una casilla por visita para sacar las que no van. Ya confirmado:
// done dice cuáles se agendaron o cambiaron y las otras se ven tachadas.
// skippedLabel: lo que dice una sacada ("No se agendó", "Sin cambios").
export type ProposalItemsSelection = { skippedLabel: string } & (
  | { checked: boolean[]; disabled: boolean; onToggle: (index: number) => void }
  | { done: number[] }
);

function ItemText({ item, skipped }: { item: Items[number]; skipped: string | null }) {
  return (
    <>
      <span className={cn("font-medium", skipped && "text-ops-text-muted line-through")}>{item.label}</span>
      {skipped ? (
        <span className="text-right text-xs text-ops-text-muted">{skipped}</span>
      ) : (
        item.detail && <span className="text-right text-xs text-amber-700 dark:text-amber-300">{item.detail}</span>
      )}
    </>
  );
}

const ROW = "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-ops-border px-3 py-2 last:border-b-0";

// La lista de un lote (las visitas de CREATE_VISITS): cada fila con su
// horario y, si hay, un detalle a la derecha.
export function AgentProposalItems({ items, selection }: { items: Items; selection?: ProposalItemsSelection }) {
  const editable = selection && "checked" in selection ? selection : null;
  const done = selection && "done" in selection ? new Set(selection.done) : null;
  const skippedLabel = selection?.skippedLabel ?? null;
  return (
    <ol className="overflow-hidden rounded-[10px] border border-ops-border text-[13px] tabular-nums">
      {items.map((item, index) => {
        const key = `${index}-${item.label}`;
        if (!editable) {
          return (
            <li key={key} className={ROW}>
              <ItemText item={item} skipped={done && !done.has(index) ? skippedLabel : null} />
            </li>
          );
        }
        const checked = editable.checked[index] ?? true;
        return (
          <li key={key} className="border-b border-ops-border last:border-b-0">
            <label
              className={cn(
                "grid min-h-11 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 sm:min-h-0",
                editable.disabled ? "cursor-not-allowed" : "cursor-pointer hover:bg-ops-surface-muted"
              )}
            >
              <Checkbox
                checked={checked}
                disabled={editable.disabled}
                onCheckedChange={() => editable.onToggle(index)}
                aria-label={`Incluir ${item.label}`}
              />
              <ItemText item={item} skipped={checked ? null : skippedLabel} />
            </label>
          </li>
        );
      })}
    </ol>
  );
}
