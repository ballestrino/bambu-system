import { Loader2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { AgentProposalDto, AgentProposalStatus, ProposalResult } from "@/lib/agent/proposals";
import { getBudgetUrl, getOfficialBudgetUrl } from "@/lib/agent/proposals";
import { cn } from "@/lib/utils";

// El estado que se muestra: una EXECUTING vieja no se presenta como en curso.
export type ProposalDisplayStatus = AgentProposalStatus | "UNKNOWN";

export const getDisplayStatus = (
  live: Pick<AgentProposalDto, "status" | "unknownOutcome"> | undefined,
  stored: AgentProposalStatus
): ProposalDisplayStatus => {
  if (!live) return stored;
  return live.unknownOutcome ? "UNKNOWN" : live.status;
};

const BADGES: Record<ProposalDisplayStatus, { label: string; className: string }> = {
  PENDING: { label: "Pendiente", className: "border-amber-500/40 text-amber-700 dark:text-amber-400" },
  EXECUTING: { label: "Ejecutando", className: "border-sky-500/40 text-sky-700 dark:text-sky-400" },
  CONFIRMED: { label: "Confirmada", className: "border-emerald-500/40 text-emerald-700 dark:text-emerald-400" },
  REJECTED: { label: "Rechazada", className: "text-muted-foreground" },
  EXPIRED: { label: "Vencida", className: "text-muted-foreground" },
  FAILED: { label: "Falló", className: "border-destructive/40 text-destructive" },
  UNKNOWN: { label: "Resultado desconocido", className: "border-destructive/40 text-destructive" },
};

export function ProposalStatusBadge({ status }: { status: ProposalDisplayStatus }) {
  const badge = BADGES[status];
  return (
    <Badge variant="outline" className={cn("shrink-0", badge.className)}>
      {status === "EXECUTING" && <Loader2 className="animate-spin" aria-hidden />}
      {badge.label}
    </Badge>
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
      <Link href={result.url} className="font-medium text-primary underline-offset-4 hover:underline">
        {result.label}
      </Link>
      {officialUrl && result.officialVersion && (
        <>
          {" "}· publicó la{" "}
          <Link href={officialUrl} className="text-primary underline-offset-4 hover:underline">
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
    return <p className="text-xs text-muted-foreground">Se está guardando…</p>;
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
      <p className={cn("text-xs", status === "FAILED" ? "text-destructive" : "text-muted-foreground")}>
        {live?.error ?? "Venció: pedile al asistente una nueva."}
      </p>
    );
  }
  if (status === "REJECTED") return <p className="text-xs text-muted-foreground">No se guardó nada.</p>;
  return null;
}
