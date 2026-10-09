import { Loader2 } from "lucide-react";
import Link from "next/link";

import type { ProposalDisplayStatus } from "@/lib/agent/proposal-outcome";
import type { AgentProposalDto, ProposalResult } from "@/lib/agent/proposals";
import { getBudgetUrl, getOfficialBudgetUrl } from "@/lib/agent/proposals";
import { cn } from "@/lib/utils";

// El estado de la tarjeta sale de getDisplayStatus (lib/agent/proposal-outcome):
// una EXECUTING vieja no se presenta como en curso.
const AMBER = "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200";
const RED = "border-red-300 bg-red-50 text-red-800 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-200";
const MUTED = "border-ops-border bg-ops-surface-muted text-ops-text-muted";

const BADGES: Record<ProposalDisplayStatus, { label: string; className: string }> = {
  PENDING: { label: "Pendiente", className: AMBER },
  EXECUTING: { label: "Ejecutando", className: "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-200" },
  CONFIRMED: { label: "Confirmada", className: "border-ops-bamboo/35 bg-ops-bamboo-soft text-ops-bamboo-strong" },
  REJECTED: { label: "Rechazada", className: MUTED },
  EXPIRED: { label: "Vencida", className: MUTED },
  FAILED: { label: "Falló", className: RED },
  UNKNOWN: { label: "Resultado desconocido", className: RED },
};

// Una píldora con un punto del color del estado (o girando, si se ejecuta).
export function ProposalStatusBadge({ status }: { status: ProposalDisplayStatus }) {
  const badge = BADGES[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        badge.className
      )}
    >
      {status === "EXECUTING" ? (
        <Loader2 className="size-3 animate-spin" aria-hidden />
      ) : (
        <span className="size-1.5 rounded-full bg-current opacity-75" aria-hidden />
      )}
      {badge.label}
    </span>
  );
}

function ResultLinks({ result }: { result: ProposalResult }) {
  const officialUrl =
    result.officialBudgetId && !result.url.includes("/official-budgets/")
      ? getOfficialBudgetUrl(result.officialBudgetId)
      : null;
  return (
    <p className="text-xs">
      Quedó en{" "}
      <Link href={result.url} className="font-medium text-ops-bamboo-strong underline-offset-4 hover:underline">
        {result.label}
      </Link>
      {officialUrl && result.officialVersion && (
        <>
          {" "}· publicó la{" "}
          <Link href={officialUrl} className="text-ops-bamboo-strong underline-offset-4 hover:underline">
            versión oficial {result.officialVersion}
          </Link>
        </>
      )}
      .
    </p>
  );
}

// El pie de una propuesta ya resuelta (o en curso): qué pasó y dónde quedó.
export function ProposalOutcome({
  status,
  live,
  slug,
}: {
  status: ProposalDisplayStatus;
  live: AgentProposalDto | undefined;
  slug: string | null;
}) {
  if (status === "CONFIRMED" && live?.result) return <ResultLinks result={live.result} />;
  if (status === "EXECUTING") {
    return <p className="text-xs text-ops-text-muted">Se está guardando…</p>;
  }
  if (status === "UNKNOWN") {
    return (
      <p className="text-xs text-destructive">
        Se cortó mientras se ejecutaba y no se sabe si llegó a guardarse.{" "}
        {slug ? (
          <Link href={getBudgetUrl(slug)} className="underline underline-offset-4">
            Revisá el presupuesto
          </Link>
        ) : (
          "Revisá los presupuestos"
        )}{" "}
        antes de pedirla de nuevo.
      </p>
    );
  }
  if (status === "FAILED" || status === "EXPIRED") {
    return (
      <p className={cn("text-xs", status === "FAILED" ? "text-destructive" : "text-ops-text-muted")}>
        {live?.error ?? "Venció: pedile al asistente una nueva."}
      </p>
    );
  }
  if (status === "REJECTED") return <p className="text-xs text-ops-text-muted">No se guardó nada.</p>;
  return null;
}
