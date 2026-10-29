import { Layers } from "lucide-react";

import { AgentCard, CardNote } from "@/components/agent/cards/agent-card";
import { AgentOpenBudgetButton } from "@/components/agent/cards/agent-open-budget-button";
import { formatMoney } from "@/components/agent/format";
import type { BudgetRequestsCardData } from "@/components/agent/types";

type Group = BudgetRequestsCardData["groups"][number];

const optionLabel = (hasProducts: boolean) => (hasProducts ? "Con productos" : "Sin productos");

function GroupPrice({ group }: { group: Group }) {
  const suggestion = group.suggestion;
  if (!suggestion) return <CardNote tone="warning">Sin precio oficial ni guardado igual: hay que calcularlo.</CardNote>;
  return (
    <div className="space-y-0.5 text-xs">
      {suggestion.options.map((option) => (
        <p key={String(option.hasProducts)} className="flex items-baseline justify-between gap-3">
          <span className="text-ops-text-muted">{optionLabel(option.hasProducts)}</span>
          <span className="text-right tabular-nums">
            <span className="font-semibold">{formatMoney(option.net)} + IVA</span>
            {"profit" in option && typeof option.profit === "number" && (
              <span className="text-ops-bamboo-strong"> · ganancia {formatMoney(option.profit)}</span>
            )}
          </span>
        </p>
      ))}
      <p className="text-ops-text-muted">
        {suggestion.source === "official" ? (
          `Precio oficial: ${suggestion.name} v${suggestion.version}`
        ) : (
          <>
            Guardado igual:{" "}
            <AgentOpenBudgetButton slug={suggestion.slug} variant="text" className="inline">
              {suggestion.name}
            </AgentOpenBudgetButton>
          </>
        )}
      </p>
    </div>
  );
}

// Los pedidos de presupuesto de los correos, agrupados por servicio idéntico,
// con el precio sugerido de cada grupo y de dónde sale.
export function AgentBudgetRequestsCard({ data }: { data: BudgetRequestsCardData }) {
  return (
    <AgentCard
      collapsed={data.groups.length > 1}
      icon={Layers}
      title="Pedidos de presupuesto"
      subtitle={`${data.requests} ${data.requests === 1 ? "pedido" : "pedidos"} · ${
        data.identicalGroups === 1 ? "1 grupo idéntico" : `${data.identicalGroups} grupos idénticos`
      }`}
    >
      <ul className="divide-y">
        {data.groups.map((group) => (
          <li key={group.label} className="space-y-1.5 py-2 first:pt-0 last:pb-0">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xs font-medium">{group.label}</p>
              {group.count > 1 && (
                <span className="shrink-0 rounded-full bg-ops-bamboo-soft px-2 py-0.5 text-[11px] font-semibold text-ops-bamboo-strong">
                  {group.count} iguales
                </span>
              )}
            </div>
            <p className="text-xs break-words text-ops-text-muted">
              {group.requests.map((request) => request.client ?? request.emailRef ?? "Sin nombre").join(", ")}
            </p>
            <GroupPrice group={group} />
          </li>
        ))}
      </ul>
      {data.truncated && <CardNote>Hay más grupos: pedile al asistente que siga con el resto.</CardNote>}
    </AgentCard>
  );
}
