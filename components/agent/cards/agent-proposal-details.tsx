import { BudgetPriceTable } from "@/components/agent/cards/agent-budget-totals-card";
import { formatChangeValue, formatMoney } from "@/components/agent/format";
import type { BudgetCalculation } from "@/lib/agent/budget-calculation";
import type { ProposalSummary } from "@/lib/agent/proposals";

type DiffRow = { key: string; label: string; before: React.ReactNode; after: React.ReactNode };

// Qué cambia campo por campo y, si hay cálculo, los precios antes → después,
// en una misma lista con bordes.
function DiffRows({ rows }: { rows: DiffRow[] }) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-ops-border text-[13px] tabular-nums">
      {rows.map((row) => (
        <div
          key={row.key}
          className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-ops-border px-3 py-2 last:border-b-0"
        >
          <span className="text-ops-text-muted">{row.label}</span>
          <span className="text-right">
            <span className="text-ops-text-muted">{row.before}</span>
            {" → "}
            <strong className="font-semibold">{row.after}</strong>
          </span>
        </div>
      ))}
    </div>
  );
}

const optionRows = (calculation: BudgetCalculation) => [
  { label: "Final sin productos", value: calculation.withoutProducts.final },
  { label: "Hora sin IVA", value: calculation.withoutProducts.hourlyNet },
  ...(calculation.withProducts
    ? [{ label: "Final con productos", value: calculation.withProducts.final }]
    : []),
];

const changeRows = (changes: ProposalSummary["changes"]): DiffRow[] =>
  changes.map((change) => ({
    key: change.field,
    label: change.label,
    before: formatChangeValue(change.field, change.before),
    after: formatChangeValue(change.field, change.after),
  }));

// Antes → después de los precios que cambian al guardar.
const priceRows = (before: BudgetCalculation, after: BudgetCalculation): DiffRow[] => {
  const previous = new Map(optionRows(before).map((row) => [row.label, row.value]));
  return optionRows(after).map((row) => ({
    key: `price-${row.label}`,
    label: row.label,
    before: formatMoney(previous.get(row.label)),
    after: formatMoney(row.value),
  }));
};

// Los precios guardados que copian duplicar y publicar.
function StoredPrices({ stored }: { stored: ProposalSummary["stored"] }) {
  return (
    <div className="space-y-0.5 text-xs tabular-nums">
      {stored.map((option) => (
        <div key={String(option.hasProducts)} className="flex items-baseline justify-between gap-3">
          <span className="text-ops-text-muted">{option.hasProducts ? "Con productos" : "Sin productos"}</span>
          <span className="text-right">
            {formatMoney(option.net)} + IVA = <span className="font-semibold">{formatMoney(option.final)}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export function AgentProposalDetails({ summary }: { summary: ProposalSummary }) {
  const rows = [
    ...changeRows(summary.changes),
    ...(summary.before && summary.after ? priceRows(summary.before, summary.after) : []),
  ];
  return (
    <>
      {rows.length > 0 && <DiffRows rows={rows} />}
      {!summary.before && summary.after && <BudgetPriceTable calculation={summary.after} />}
      {!summary.after && summary.stored.length > 0 && <StoredPrices stored={summary.stored} />}
    </>
  );
}
