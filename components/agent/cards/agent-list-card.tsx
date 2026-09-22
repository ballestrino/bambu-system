import { List } from "lucide-react";
import Link from "next/link";

import { AgentCard, CardNote } from "@/components/agent/cards/agent-card";
import { formatMoney } from "@/components/agent/format";
import type { ListCardData } from "@/components/agent/types";
import { getBudgetUrl, getOfficialBudgetUrl } from "@/lib/agent/proposals";

type Row = Record<string, unknown>;

const text = (value: unknown) => (typeof value === "string" && value ? value : null);

const joined = (...parts: unknown[]) => parts.map(text).filter(Boolean).join(" · ");

// El precio sin IVA guardado de una opción de findMatchingBudgets.
const storedNet = (row: Row, hasProducts: boolean) =>
  Array.isArray(row.prices)
    ? (row.prices as { hasProducts: boolean; net: number }[]).find((price) => price.hasProducts === hasProducts)?.net
    : undefined;

const isActiveOfficial = (row: Row) => (row.official as { status?: string } | null)?.status === "ACTIVE";

// Cómo se muestra cada tipo de lista: título, detalle, importe y a dónde lleva.
const KINDS: Record<
  string,
  {
    title: string;
    primary: (row: Row) => string | null;
    href?: (row: Row) => string | null;
    detail: (row: Row) => string;
    amount?: (row: Row) => unknown;
  }
> = {
  budgets: {
    title: "Presupuestos",
    primary: (row) => text(row.name),
    href: (row) => (text(row.slug) ? getBudgetUrl(String(row.slug)) : null),
    detail: (row) => joined(row.description, Array.isArray(row.categories) ? row.categories.join(", ") : null),
  },
  matchingBudgets: {
    title: "Presupuestos iguales · sin IVA",
    primary: (row) => text(row.name),
    href: (row) => (text(row.slug) ? getBudgetUrl(String(row.slug)) : null),
    detail: (row) => {
      const withProducts = storedNet(row, true);
      return joined(
        withProducts === undefined ? "Sin opción con productos" : `Con productos ${formatMoney(withProducts)}`,
        isActiveOfficial(row) ? "Precio oficial vigente" : null
      );
    },
    amount: (row) => storedNet(row, false),
  },
  officialBudgets: {
    title: "Presupuestos oficiales",
    primary: (row) => text(row.name),
    href: (row) => (text(row.id) ? getOfficialBudgetUrl(String(row.id)) : null),
    detail: (row) => `Versión ${row.version} · ${row.status === "ACTIVE" ? "vigente" : "archivado"}`,
  },
  jobs: {
    title: "Trabajos",
    primary: (row) => text(row.name),
    href: (row) => `/dashboard/jobs/${row.id}`,
    detail: (row) => joined(row.status, row.location, row.sourceBudget),
  },
  employees: {
    title: "Empleadas",
    primary: (row) => text(row.name),
    href: (row) => `/dashboard/employees/${row.id}`,
    detail: (row) => (row.isActive ? "Activa" : "Inactiva"),
    amount: (row) => row.hourlyRate,
  },
  visits: {
    title: "Visitas",
    primary: (row) => text(row.job),
    detail: (row) =>
      joined(row.scheduledStart, row.status, Array.isArray(row.employees) ? row.employees.join(", ") : null),
  },
  clientPayments: {
    title: "Cobros",
    primary: (row) => text(row.job),
    detail: (row) => joined(row.paymentDate, row.status, row.reference),
    amount: (row) => row.amount,
  },
  operationalCosts: {
    title: "Costes",
    primary: (row) => text(row.category),
    detail: (row) => joined(row.costDate, row.job, row.employee, row.status),
    amount: (row) => row.amount,
  },
  employeePayments: {
    title: "Pagos a empleadas",
    primary: (row) => text(row.employee),
    detail: (row) => joined(row.paymentDate, row.status),
    amount: (row) => row.amount,
  },
};

const SHOWN_ROWS = 10;

export function AgentListCard({ data }: { data: ListCardData }) {
  const kind = KINDS[data.kind] ?? { title: "Resultados", primary: () => null, detail: () => "" };
  const shown = data.rows.slice(0, SHOWN_ROWS);
  const hidden = data.total - shown.length;
  return (
    <AgentCard
      icon={List}
      title={kind.title}
      subtitle={`${data.total} ${data.total === 1 ? "resultado" : "resultados"}${data.month ? ` · ${data.month}` : ""}`}
    >
      {shown.length === 0 ? (
        <CardNote>No hay resultados.</CardNote>
      ) : (
        <ul className="divide-y">
          {shown.map((row, index) => {
            const label = kind.primary(row) ?? "Sin nombre";
            const href = kind.href?.(row);
            return (
              <li key={String(row.id ?? index)} className="flex items-baseline justify-between gap-3 py-1.5 text-xs">
                <div className="min-w-0">
                  {href ? (
                    <Link href={href} className="block truncate font-medium underline-offset-4 hover:underline">
                      {label}
                    </Link>
                  ) : (
                    <p className="truncate font-medium">{label}</p>
                  )}
                  <p className="truncate text-muted-foreground">{kind.detail(row) || "—"}</p>
                </div>
                {kind.amount && <span className="shrink-0 tabular-nums">{formatMoney(kind.amount(row))}</span>}
              </li>
            );
          })}
        </ul>
      )}
      {typeof data.recordedTotal === "number" && (
        <CardNote>Total registrado: {formatMoney(data.recordedTotal)}</CardNote>
      )}
      {(hidden > 0 || data.truncated) && (
        <CardNote>
          {hidden > 0 ? `Y ${hidden} más.` : "Hay más resultados."} Pedile al asistente que filtre.
        </CardNote>
      )}
    </AgentCard>
  );
}

