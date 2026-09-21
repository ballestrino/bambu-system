import { BudgetPriceTable } from "@/components/agent/cards/agent-budget-totals-card";
import { formatChangeValue, formatMoney } from "@/components/agent/format";
import type { BudgetCalculation } from "@/lib/agent/budget-calculation";
import type { ProposalSummary } from "@/lib/agent/proposals";

// Qué cambia campo por campo.
function ChangesTable({ changes }: { changes: ProposalSummary["changes"] }) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-muted-foreground">
          <th className="py-1 text-left font-normal">Campo</th>
          <th className="py-1 text-right font-normal">Antes</th>
          <th className="py-1 text-right font-normal">Después</th>
        </tr>
      </thead>
      <tbody className="tabular-nums">
        {changes.map((change) => (
          <tr key={change.field}>
            <td className="py-0.5">{change.label}</td>
            <td className="py-0.5 text-right text-muted-foreground">{formatChangeValue(change.field, change.before)}</td>
            <td className="py-0.5 text-right font-medium">{formatChangeValue(change.field, change.after)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const optionRows = (calculation: BudgetCalculation) => [
  { label: "Final sin productos", value: calculation.withoutProducts.final },
  { label: "Hora sin IVA", value: calculation.withoutProducts.hourlyNet },
  ...(calculation.withProducts
    ? [{ label: "Final con productos", value: calculation.withProducts.final }]
    : []),
];

// Antes → después de los precios que cambian al guardar.
function BeforeAfter({ before, after }: { before: BudgetCalculation; after: BudgetCalculation }) {
  const previous = new Map(optionRows(before).map((row) => [row.label, row.value]));
  return (
    <div className="space-y-0.5 text-xs tabular-nums">
      {optionRows(after).map((row) => (
        <div key={row.label} className="flex items-baseline justify-between gap-3">
          <span className="text-muted-foreground">{row.label}</span>
          <span className="text-right">
            <span className="text-muted-foreground">{formatMoney(previous.get(row.label))}</span>
            {" → "}
            <span className="font-semibold">{formatMoney(row.value)}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

// Los precios guardados que copian duplicar y publicar.
function StoredPrices({ stored }: { stored: ProposalSummary["stored"] }) {
  return (
    <div className="space-y-0.5 text-xs tabular-nums">
      {stored.map((option) => (
        <div key={String(option.hasProducts)} className="flex items-baseline justify-between gap-3">
          <span className="text-muted-foreground">{option.hasProducts ? "Con productos" : "Sin productos"}</span>
          <span className="text-right">
            {formatMoney(option.net)} + IVA = <span className="font-semibold">{formatMoney(option.final)}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export function AgentProposalDetails({ summary }: { summary: ProposalSummary }) {
  return (
    <>
      {summary.changes.length > 0 && <ChangesTable changes={summary.changes} />}
      {summary.before && summary.after && <BeforeAfter before={summary.before} after={summary.after} />}
      {!summary.before && summary.after && <BudgetPriceTable calculation={summary.after} />}
      {!summary.after && summary.stored.length > 0 && <StoredPrices stored={summary.stored} />}
    </>
  );
}
