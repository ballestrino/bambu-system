import { BadgeCheck, SearchCheck } from "lucide-react";
import Link from "next/link";

import { AgentCard, CardNote } from "@/components/agent/cards/agent-card";
import { formatDate, formatHours, formatMoney, formatVisits } from "@/components/agent/format";
import type { OfficialBudgetCardData, OfficialSearchCardData } from "@/components/agent/types";
import { getOfficialBudgetUrl } from "@/lib/agent/proposals";

const SEARCH_STATUS: Record<OfficialSearchCardData["status"], string> = {
  exact: "Precio exacto: se puede citar",
  partial: "Coincidencia parcial: no se puede citar",
  ambiguous: "Más de una coincidencia: falta un dato",
  incomplete: "Faltan datos para buscar",
  no_result: "Sin presupuesto oficial para ese servicio",
};

const FIELD_NAMES: Record<string, string> = {
  service: "servicio",
  frequency: "frecuencia",
  visits: "visitas",
  hoursPerVisit: "horas por visita",
  employees: "empleadas",
};

type Prices = { net: number; ivaAmount: number; final: number; hourlyNet: number };

function PriceLine({ label, prices, href }: { label: string; prices: Prices; href?: string }) {
  return (
    <li className="flex items-baseline justify-between gap-3 py-1 text-xs">
      {href ? (
        <Link href={href} className="min-w-0 truncate underline-offset-4 hover:underline">
          {label}
        </Link>
      ) : (
        <span className="min-w-0 truncate">{label}</span>
      )}
      <span className="shrink-0 text-right tabular-nums">
        <span className="font-semibold">{formatMoney(prices.final)}</span>
        <span className="block text-[10px] text-muted-foreground">
          {formatMoney(prices.net)} + IVA · {formatMoney(prices.hourlyNet)}/h
        </span>
      </span>
    </li>
  );
}

// Búsqueda de precio de lista: solo un resultado exacto habilita citarlo.
export function AgentOfficialSearchCard({ data }: { data: OfficialSearchCardData }) {
  return (
    <AgentCard icon={SearchCheck} title="Precios oficiales" subtitle={SEARCH_STATUS[data.status]}>
      {data.missingFields.length > 0 && (
        <CardNote tone="warning">
          Falta: {data.missingFields.map((field) => FIELD_NAMES[field] ?? field).join(", ")}.
        </CardNote>
      )}
      {data.matches.length > 0 && (
        <ul className="divide-y">
          {data.matches.map((match) => (
            <PriceLine
              key={match.sourceOptionId}
              label={`${match.name} v${match.version} · ${match.hasProducts ? "con" : "sin"} productos`}
              prices={match.prices}
              href={getOfficialBudgetUrl(match.officialBudgetId)}
            />
          ))}
        </ul>
      )}
    </AgentCard>
  );
}

export function AgentOfficialBudgetCard({ data }: { data: OfficialBudgetCardData }) {
  const archived = data.status !== "ACTIVE";
  return (
    <AgentCard
      icon={BadgeCheck}
      title={`${data.name} · versión ${data.version}`}
      subtitle={`${data.serviceName} · publicada el ${formatDate(data.publishedAt)}`}
      aside={
        <Link href={getOfficialBudgetUrl(data.id)} className="shrink-0 text-xs text-primary underline-offset-4 hover:underline">
          Abrir
        </Link>
      }
    >
      {archived && <CardNote tone="warning">Archivado: sus precios no se pueden citar.</CardNote>}
      <ul className="divide-y">
        {data.options.map((option) => (
          <PriceLine
            key={option.sourceOptionId}
            label={`${option.hasProducts ? "Con" : "Sin"} productos · ${formatVisits(option.visits, option.visitType)} · ${formatHours(option.hoursPerVisit)}`}
            prices={option.prices}
          />
        ))}
      </ul>
    </AgentCard>
  );
}
