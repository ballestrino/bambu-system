import { List } from "lucide-react";
import Link from "next/link";

import { AgentCard, CardNote } from "@/components/agent/cards/agent-card";
import { AgentOpenBudgetButton } from "@/components/agent/cards/agent-open-budget-button";
import { formatMoney } from "@/components/agent/format";
import type { ListCardData } from "@/components/agent/types";
import { getOfficialBudgetUrl } from "@/lib/agent/proposals";

type Row = Record<string, unknown>;

const text = (value: unknown) => (typeof value === "string" && value ? value : null);

const joined = (...parts: unknown[]) => parts.map(text).filter(Boolean).join(" · ");

type StoredPrice = { hasProducts: boolean; net: number; profit?: number | null };

// Una opción guardada de findMatchingBudgets: su precio sin IVA y su ganancia.
const storedOption = (row: Row, hasProducts: boolean) =>
  Array.isArray(row.prices)
    ? (row.prices as StoredPrice[]).find((price) => price.hasProducts === hasProducts)
    : undefined;

const profitText = (option: StoredPrice | undefined) =>
  typeof option?.profit === "number" ? `Ganancia ${formatMoney(option.profit)}` : null;

const isActiveOfficial = (row: Row) => (row.official as { status?: string } | null)?.status === "ACTIVE";

// Cómo se muestra cada tipo de lista: título, detalle, importe y a dónde lleva.
// Un presupuesto guardado (budget) se abre en el Sheet del chat; el resto, con
// un link (href).
const KINDS: Record<
  string,
  {
    title: string;
    primary: (row: Row) => string | null;
    href?: (row: Row) => string | null;
    budget?: (row: Row) => string | null;
    detail: (row: Row) => string;
    amount?: (row: Row) => unknown;
  }
> = {
  budgets: {
    title: "Presupuestos",
    primary: (row) => text(row.name),
    budget: (row) => text(row.slug),
    detail: (row) => joined(row.description, Array.isArray(row.categories) ? row.categories.join(", ") : null),
  },
  matchingBudgets: {
    title: "Presupuestos iguales · sin IVA",
    primary: (row) => text(row.name),
    budget: (row) => text(row.slug),
    detail: (row) => {
      const withProducts = storedOption(row, true);
      return joined(
        profitText(storedOption(row, false)),
        withProducts === undefined ? "Sin opción con productos" : `Con productos ${formatMoney(withProducts.net)} + IVA`,
        isActiveOfficial(row) ? "Precio oficial vigente" : null
      );
    },
    amount: (row) => storedOption(row, false)?.net,
  },
  emails: {
    title: "Correos",
    primary: (row) => `${row.unread ? "● " : ""}${text(row.subject) ?? "(Sin asunto)"}`,
    detail: (row) => joined(row.from, row.when, `${row.mailbox}@`, row.answered ? "Respondido" : null),
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
      collapsed
      icon={List}
      title={kind.title}
      subtitle={`${data.total} ${data.total === 1 ? "resultado" : "resultados"}${data.day ?? data.month ? ` · ${data.day ?? data.month}` : ""}`}
    >
      {shown.length === 0 ? (
        <CardNote>No hay resultados.</CardNote>
      ) : (
        <ul className="divide-y">
          {shown.map((row, index) => {
            const label = kind.primary(row) ?? "Sin nombre";
            const href = kind.href?.(row);
            const budget = kind.budget?.(row);
            return (
              <li key={String(row.id ?? index)} className="flex items-baseline justify-between gap-3 py-1.5 text-xs">
                <div className="min-w-0">
                  {budget ? (
                    <AgentOpenBudgetButton slug={budget} variant="text" className="font-medium">
                      {label}
                    </AgentOpenBudgetButton>
                  ) : href ? (
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
      {data.warnings?.map((warning) => (
        <CardNote key={warning} tone="warning">
          {warning}
        </CardNote>
      ))}
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

