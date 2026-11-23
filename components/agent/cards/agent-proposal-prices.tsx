import { changesLine } from "@/components/agent/cards/proposal-copy";
import { formatChangeValue, formatMoney, formatPercent } from "@/components/agent/format";
import type { BudgetCalculation } from "@/lib/agent/budget-calculation";
import { calculationProfit } from "@/lib/agent/budget-profit";
import type { ProposalSummary } from "@/lib/agent/proposals";

type Box = { label: string; net: number; note: string };
type DiffRow = { key: string; label: string; before: React.ReactNode; after: React.ReactNode };

// "antes $ 23.200 · baja $ 800": cómo se mueve un precio al guardar.
const movement = (before: number | undefined, after: number) => {
  if (before === undefined) return "opción nueva";
  const delta = Math.round((after - before) * 100) / 100;
  const word = delta < 0 ? `baja ${formatMoney(-delta)}` : delta > 0 ? `sube ${formatMoney(delta)}` : "igual";
  return `antes ${formatMoney(before)} · ${word}`;
};

const calculationBoxes = (after: BudgetCalculation, before: BudgetCalculation | null): Box[] => {
  const options = [
    { label: "Sin productos", now: after.withoutProducts, was: before?.withoutProducts },
    ...(after.withProducts ? [{ label: "Con productos", now: after.withProducts, was: before?.withProducts ?? undefined }] : []),
  ];
  return options.map(({ label, now, was }) => ({
    label,
    net: now.net,
    note: before ? movement(was?.net, now.net) : `con IVA ${formatMoney(now.final)}`,
  }));
};

// Sin y con productos lado a lado: es lo primero que se compara.
function PriceBoxes({ boxes }: { boxes: Box[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {boxes.map((box) => (
        <div key={box.label} className="min-w-0 rounded-[10px] bg-ops-canvas px-3 py-2.5">
          <p className="text-xs text-ops-text-muted">{box.label}</p>
          <p className="mt-0.5 text-base leading-tight font-semibold tracking-tight tabular-nums @md/thread:text-lg">
            {formatMoney(box.net)}{" "}
            <span className="text-xs font-medium tracking-normal whitespace-nowrap text-ops-text-muted">+ IVA</span>
          </p>
          <p className="mt-0.5 text-xs text-ops-text-muted tabular-nums">{box.note}</p>
        </div>
      ))}
    </div>
  );
}

// "Ganancia $ 7.200 al mes" en verde y, al lado, la hora y el margen.
function ProfitLine({ profit, detail }: { profit: number | null | undefined; detail: string | null }) {
  if (typeof profit !== "number" && !detail) return null;
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[12.5px] text-ops-text-muted tabular-nums">
      {typeof profit === "number" && (
        <span className="rounded-full bg-ops-bamboo-soft px-2.5 py-0.5 font-semibold text-ops-bamboo-strong">
          Ganancia {formatMoney(profit)} al mes
        </span>
      )}
      {detail && <span>{detail}</span>}
    </p>
  );
}

// Antes → después, en una lista con bordes.
export function DiffRows({ rows }: { rows: DiffRow[] }) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-ops-border text-[13px] tabular-nums">
      {rows.map((row) => (
        <div key={row.key} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-ops-border px-3 py-2 last:border-b-0">
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

const changeRows = (summary: ProposalSummary): DiffRow[] =>
  summary.changes.map((change) => ({
    key: change.field,
    label: change.label,
    before: formatChangeValue(change.field, change.before),
    after: formatChangeValue(change.field, change.after),
  }));

// Lo que cambia además del precio: ganancia, hora y precio con IVA.
const priceRows = (before: BudgetCalculation, after: BudgetCalculation): DiffRow[] => [
  { key: "profit", label: "Ganancia al mes", before: formatMoney(calculationProfit(before).withoutProducts), after: formatMoney(calculationProfit(after).withoutProducts) },
  { key: "hourly", label: "Hora sin IVA", before: formatMoney(before.withoutProducts.hourlyNet), after: formatMoney(after.withoutProducts.hourlyNet) },
  { key: "final", label: "Con IVA, sin productos", before: formatMoney(before.withoutProducts.final), after: formatMoney(after.withoutProducts.final) },
];

// Los precios de una propuesta de presupuesto: el cálculo (crear y cambiar)
// o los precios guardados que copian duplicar y publicar. Al cambiar, lo que
// cambia (si no entra en el subtítulo) y los precios antes → después.
export function AgentProposalPrices({ summary }: { summary: ProposalSummary }) {
  const { before, after } = summary;
  if (after) {
    const extraChanges = changesLine(summary) ? [] : changeRows(summary);
    return (
      <>
        <PriceBoxes boxes={calculationBoxes(after, before)} />
        {before ? (
          <DiffRows rows={[...extraChanges, ...priceRows(before, after)]} />
        ) : (
          <ProfitLine
            profit={calculationProfit(after).withoutProducts}
            detail={`Hora ${formatMoney(after.withoutProducts.hourlyNet)} + IVA · margen ${formatPercent(after.revenuePercent)}`}
          />
        )}
      </>
    );
  }
  if (summary.changes.length) return changesLine(summary) ? null : <DiffRows rows={changeRows(summary)} />;
  if (!summary.stored.length) return null;
  const stored = [...summary.stored].sort((a, b) => Number(a.hasProducts) - Number(b.hasProducts));
  return (
    <>
      <PriceBoxes
        boxes={stored.map((option) => ({
          label: option.hasProducts ? "Con productos" : "Sin productos",
          net: option.net,
          note: `con IVA ${formatMoney(option.final)}`,
        }))}
      />
      <ProfitLine profit={stored[0].profit} detail={null} />
    </>
  );
}
