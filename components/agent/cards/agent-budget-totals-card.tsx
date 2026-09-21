import { Calculator, FileText } from "lucide-react";
import Link from "next/link";

import { AgentCard, CardNote, CardRow } from "@/components/agent/cards/agent-card";
import { formatHours, formatMoney, formatPercent, formatVisits } from "@/components/agent/format";
import type { BudgetTotalsCardData } from "@/components/agent/types";
import type { BudgetCalculation } from "@/lib/agent/budget-calculation";
import { FIELD_LABELS } from "@/lib/agent/proposal-summary";
import { getBudgetUrl } from "@/lib/agent/proposals";

const BASE_LABELS = {
  context: "Presupuesto en contexto",
  form: "Formulario sin guardar",
  budget: "Presupuesto",
  defaults: "Valores por defecto",
} as const;

type Inputs = BudgetTotalsCardData["inputs"];

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
        <tr className="text-xs text-muted-foreground">
          <th className="py-1 text-left font-normal">Precio mensual</th>
          {options.map((option) => (
            <th key={option.label} className="py-1 text-right font-normal">{option.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key} className={row.key === "final" ? "font-semibold" : undefined}>
            <td className="py-0.5 text-muted-foreground">{row.label}</td>
            {options.map((option) => (
              <td key={option.label} className="py-0.5 text-right">{formatMoney(option.prices[row.key])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CostBreakdown({ calculation }: { calculation: BudgetCalculation }) {
  return (
    <div className="grid gap-x-6 gap-y-0.5 text-xs sm:grid-cols-2">
      <CardRow label="Horas del mes" value={formatHours(calculation.totalHours)} />
      <CardRow label="Costo laboral" value={formatMoney(calculation.laborCost)} />
      <CardRow label="Aportes" value={formatMoney(calculation.contributions)} />
      <CardRow label="Transporte" value={formatMoney(calculation.transport)} />
      {calculation.products > 0 && <CardRow label="Productos" value={formatMoney(calculation.products)} />}
      <CardRow label="Margen del servicio" value={formatPercent(calculation.revenuePercent)} />
    </div>
  );
}

export function AgentBudgetTotalsCard({ data }: { data: BudgetTotalsCardData }) {
  const saved = data.card === "budget";
  const name = saved ? data.name : data.base.name;
  const slug = saved ? data.slug : data.base.slug;
  const labels: Record<string, string> = FIELD_LABELS;
  const changed = saved ? [] : data.changedFields.map((field) => labels[field] ?? field);
  const target = "target" in data ? data : null;

  return (
    <AgentCard
      icon={saved ? FileText : Calculator}
      title={saved ? name : `Cálculo · ${name}`}
      subtitle={saved ? describeInputs(data.inputs) : `${BASE_LABELS[data.base.source]} · ${describeInputs(data.inputs)}`}
      aside={
        slug ? (
          <Link href={getBudgetUrl(slug)} className="shrink-0 text-xs text-primary underline-offset-4 hover:underline">
            Abrir
          </Link>
        ) : null
      }
    >
      {changed.length > 0 && <CardNote>Cambia: {changed.join(", ")}.</CardNote>}
      {target && (
        <CardNote tone={target.wasClamped ? "warning" : "muted"}>
          {target.wasClamped
            ? `El objetivo no cubre el costo: el margen queda en 0 %. Mínimo sin IVA: ${formatMoney(target.minimumHourlyPrice)} por hora.`
            : `Margen necesario: ${formatPercent(target.revenuePercent)}.`}
        </CardNote>
      )}
      <BudgetPriceTable calculation={data.calculation} />
      <CostBreakdown calculation={data.calculation} />
    </AgentCard>
  );
}
