"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Hourglass, Repeat, UserX } from "lucide-react";

import { formatDayMonth, type PendingSummary } from "@/lib/ops/pending-visits";
import type { PendingFilters } from "@/lib/ops/pending-visit-groups";
import { opsSurface, opsToneClasses, type OpsTone } from "@/components/ops/shared";
import { cn } from "@/lib/utils";

const cardButton =
  "inline-flex h-10 items-center gap-1.5 self-start rounded-[10px] border border-ops-border bg-ops-surface px-3 text-[13px] font-semibold text-ops-text hover:bg-ops-surface-muted";

const Card = ({
  children,
  icon: Icon,
  title,
  tone,
}: {
  children: ReactNode;
  icon: typeof UserX;
  title: string;
  tone: OpsTone;
}) => (
  <article className={cn(opsSurface.panel, "flex flex-col gap-2.5 p-4")}>
    <div className="flex items-center gap-2.5">
      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-[9px] border", opsToneClasses[tone])}>
        <Icon className="size-4" />
      </span>
      <h3 className="text-[15px] font-semibold text-ops-text">{title}</h3>
    </div>
    {children}
  </article>
);

// "Para empezar": los grupos que suelen ser visitas generadas de mas.
export const PendingQuickCards = ({
  jobScoped,
  onFilter,
  summary,
}: {
  jobScoped: boolean;
  onFilter: (changes: Partial<PendingFilters>) => void;
  summary: PendingSummary;
}) => {
  const top = summary.topJobs.filter((job) => job.count > 1);
  const topTotal = top.reduce((total, job) => total + job.count, 0);
  if (!summary.unassigned && !summary.ages.old && top.length < 2) return null;

  return (
    <div className={cn("grid gap-3", jobScoped ? "@3xl/pending:grid-cols-2" : "@3xl/pending:grid-cols-3")}>
      {summary.unassigned ? (
        <Card icon={UserX} title={`${summary.unassigned} sin equipo asignado`} tone="warning">
          <p className="text-[13px] leading-normal text-ops-text-muted">
            Sin empleada no se pueden registrar ni pagar. Si alguien fue, asignala; si nadie fue, cancelalas.
          </p>
          <button className={cardButton} onClick={() => onFilter({ age: "all", search: "", team: "none" })} type="button">
            Ver {summary.unassigned === 1 ? "la" : `las ${summary.unassigned}`}
            <ArrowRight className="size-3.5" />
          </button>
        </Card>
      ) : null}
      {summary.ages.old ? (
        <Card icon={Hourglass} title={`${summary.ages.old} con más de 30 días`} tone="money">
          <p className="text-[13px] leading-normal text-ops-text-muted">
            {summary.oldestDayKey ? `Vienen desde el ${formatDayMonth(summary.oldestDayKey)}. ` : ""}
            Si se hicieron, registralas con el horario programado; si no, marcalas omitidas.
          </p>
          <button className={cardButton} onClick={() => onFilter({ age: "old", search: "", team: "all" })} type="button">
            Ver {summary.ages.old === 1 ? "la" : `las ${summary.ages.old}`}
            <ArrowRight className="size-3.5" />
          </button>
        </Card>
      ) : null}
      {top.length >= 2 ? (
        <Card icon={Repeat} title={`${top.length} trabajos suman ${topTotal}`} tone="active">
          <p className="text-[13px] leading-normal text-ops-text-muted">
            Si el servicio cambió, ajustá la regla del cronograma del trabajo para que no se sigan generando.
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[13px]">
            {top.map((job) => (
              <Link className="font-semibold text-ops-bamboo-strong underline-offset-[3px] hover:underline" href={`/dashboard/jobs/${job.jobId}`} key={job.jobId}>
                {job.name} ({job.count})
              </Link>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
};
