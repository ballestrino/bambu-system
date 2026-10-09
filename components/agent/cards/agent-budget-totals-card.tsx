import { Calculator, FileText } from "lucide-react";

import type { BudgetEditorTarget } from "@/components/agent/hooks/use-budget-editor";
import { AgentBudgetActions } from "@/components/agent/cards/agent-budget-actions";
import { AgentCard, CardNote, CardOpenLink, CardRow } from "@/components/agent/cards/agent-card";
import { formatHours, formatMoney, formatPercent, formatVisits } from "@/components/agent/format";
import type { BudgetTotalsCardData } from "@/components/agent/types";
import type { BudgetCalculation } from "@/lib/agent/budget-calculation";
import { valuesFromInputs } from "@/lib/agent/budget-draft";
import { FIELD_LABELS } from "@/lib/agent/proposal-summary";
import { getBudgetUrl } from "@/lib/agent/proposals";

const BASE_LABELS = {
  context: "Presupuesto en contexto",
  form: "Formulario sin guardar",
  budget: "Presupuesto",
  defaults: "Valores por defecto",
} as const;

type Inputs = BudgetTotalsCardData["inputs"];

type CalculationData = Exclude<BudgetTotalsCardData, { card: "budget" }>;

// Lo que abre el editor desde un cálculo. Se guarda como un presupuesto
// nuevo: si partió de uno guardado (o de los valores por defecto) el nombre
// queda vacío, para no chocar con el que ya existe. Una salida anterior a
// values se arma con sus insumos.
const calculationTarget = (data: CalculationData, toolCallId: string): BudgetEditorTarget => {
  const values = ("values" in data && data.values) || valuesFromInputs(data.inputs, data.base.name);
  const savedBase = data.base.source === "context" || data.base.source === "budget";
  return {
    toolCallId,
    source: "calculation",
    title: `Cálculo · ${data.base.name}`,
    values: data.base.source === "form" ? values : { ...values, name: "" },
    basedOn: savedBase ? data.base.name : null,
  };
};

const describeInputs = (inputs: Inputs) =>
  [
    formatVisits(inputs.visits, inputs.visitType),
    `${formatHours(inputs.hoursPerVisit)} por visita`,
    `${inputs.employees} ${inputs.employees === 1 ? "empleada" : "empleadas"}`,
    `margen ${formatPercent(inputs.revenuePercent)}`,
  ].join(" · ");

// Sin y con productos lado a lado: es lo primero que se compara.
export function BudgetPriceTable({ calculation }: { calculation: BudgetCalculation }) {
  const options = [
    { label: "Sin productos", prices: calculation.withoutProducts },
    ...(calculation.withProducts ? [{ label: "Con productos", prices: calculation.withProducts }] : []),
  ];
  const rows = [
    { label: "Sin IVA", key: "net" },
    { label: `IVA ${formatPercent(calculation.ivaPercent)}`, key: "iva" },
    { label: "Final", key: "final" },
    { label: "Hora sin IVA", key: "hourlyNet" },
  ] as const;
  return (
    <table className="w-full text-sm tabular-nums">
      <thead>
        <tr className="text-xs text-ops-text-muted">
          <th className="py-1 text-left font-normal">Precio mensual</th>
          {options.map((option) => (
            <th key={option.label} className="py-1 text-right font-normal">{option.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key} className={row.key === "final" ? "font-semibold" : undefined}>
            <td className="py-0.5 text-ops-text-muted">{row.label}</td>
            {options.map((option) => (
              <td key={option.label} className="py-0.5 text-right">{formatMoney(option.prices[row.key])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// El precio mensual final grande, con su base sin IVA y el IVA debajo; con
// productos, también esa opción. A la derecha, qué cambió respecto de la base.
function FinalPrice({ calculation, changed }: { calculation: BudgetCalculation; changed: string[] }) {
  const { withoutProducts, withProducts } = calculation;
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-0.5 tabular-nums">
        <span className="text-xs text-ops-text-muted">Precio mensual final{withProducts ? " sin productos" : ""}</span>
        <span className="text-2xl leading-tight font-semibold tracking-tight">{formatMoney(withoutProducts.final)}</span>
        <span className="text-xs text-ops-text-muted">
          {formatMoney(withoutProducts.net)} sin IVA · IVA {formatPercent(calculation.ivaPercent)} {formatMoney(withoutProducts.iva)}
        </span>
        {withProducts && (
          <span className="text-xs text-ops-text-muted">
            Con productos: <span className="font-semibold text-ops-text">{formatMoney(withProducts.final)}</span> ·{" "}
            {formatMoney(withProducts.net)} sin IVA
          </span>
        )}
      </div>
      {changed.length > 0 && (
        <span className="inline-flex items-center rounded-full border border-ops-bamboo/35 bg-ops-bamboo-soft px-2.5 py-0.5 text-xs font-medium text-ops-bamboo-strong">
          Cambia: {changed.join(", ")}
        </span>
      )}
    </div>
  );
}

function CostBreakdown({ calculation }: { calculation: BudgetCalculation }) {
  return (
    <div className="grid gap-x-5 gap-y-1 rounded-[10px] bg-ops-canvas px-3 py-2.5 text-xs sm:grid-cols-2">
      <CardRow label="Hora sin IVA" value={formatMoney(calculation.withoutProducts.hourlyNet)} />
      <CardRow label="Horas del mes" value={formatHours(calculation.totalHours)} />
      <CardRow label="Costo laboral" value={formatMoney(calculation.laborCost)} />
      <CardRow label="Aportes" value={formatMoney(calculation.contributions)} />
      <CardRow label="Transporte" value={formatMoney(calculation.transport)} />
      {calculation.products > 0 && <CardRow label="Productos" value={formatMoney(calculation.products)} />}
      <CardRow label="Margen del servicio" value={formatPercent(calculation.revenuePercent)} />
    </div>
  );
}

export function AgentBudgetTotalsCard({ data, toolCallId }: { data: BudgetTotalsCardData; toolCallId: string }) {
  const saved = data.card === "budget";
  const name = saved ? data.name : data.base.name;
  const slug = saved ? data.slug : data.base.slug;
  const labels: Record<string, string> = FIELD_LABELS;
  const changed = saved ? [] : data.changedFields.map((field) => labels[field] ?? field);
  const target = "target" in data ? data : null;
  // Las salidas anteriores a las reglas de precio no traen rounding.
  const rounding = "rounding" in data ? data.rounding : null;

  return (
    <AgentCard
      icon={saved ? FileText : Calculator}
      title={saved ? name : `Cálculo · ${name}`}
      subtitle={saved ? describeInputs(data.inputs) : `${BASE_LABELS[data.base.source]} · ${describeInputs(data.inputs)}`}
      aside={slug ? <CardOpenLink href={getBudgetUrl(slug)} /> : null}
    >
      <FinalPrice calculation={data.calculation} changed={changed} />
      {rounding && (
        <CardNote>
          Precio redondeado: {formatMoney(rounding.from)} → {formatMoney(rounding.to)} sin IVA, con margen{" "}
          {formatPercent(rounding.revenuePercentTo)} (era {formatPercent(rounding.revenuePercentFrom)}).
        </CardNote>
      )}
      {target && (
        <CardNote tone={target.wasClamped ? "warning" : "muted"}>
          {target.wasClamped
            ? `El objetivo no cubre el costo: el margen queda en 0 %. Mínimo sin IVA: ${formatMoney(target.minimumHourlyPrice)} por hora.`
            : `Margen necesario: ${formatPercent(target.revenuePercent)}.`}
        </CardNote>
      )}
      <CostBreakdown calculation={data.calculation} />
      {data.card === "budget-totals" && <AgentBudgetActions target={calculationTarget(data, toolCallId)} showSaved />}
    </AgentCard>
  );
}
