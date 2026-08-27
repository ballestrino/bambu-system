import { BookOpen, ExternalLink } from "lucide-react";
import Link from "next/link";

import type { MailDraftSourceDetail } from "@/components/mail/types";
import { Badge } from "@/components/ui/badge";

const money = new Intl.NumberFormat("es-UY", {
  style: "currency",
  currency: "UYU",
  maximumFractionDigits: 2,
});

const usedAt = new Intl.DateTimeFormat("es-UY", {
  dateStyle: "medium",
  timeStyle: "short",
});

const frequencyLabel = { days: "por día", week: "por semana", month: "por mes" };

export function MailSourceBibliography({
  sources,
}: {
  sources: MailDraftSourceDetail[];
}) {
  if (!sources.length) return null;
  return (
    <details className="rounded-md border bg-background/70 p-3 text-xs">
      <summary className="flex cursor-pointer items-center gap-2 font-medium">
        <BookOpen className="size-4 text-[#53985E]" />
        Bibliografía interna · {sources.length} fuente{sources.length === 1 ? "" : "s"}
      </summary>
      <div className="mt-3 space-y-3">
        {sources.map((source) => {
          const version = source.officialBudgetVersion;
          const budget = version.officialBudget;
          const option = source.officialBudgetOption;
          return (
            <div key={source.id} className="space-y-1 border-t pt-3 first:border-t-0 first:pt-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/dashboard/official-budgets/${budget.id}`}
                  className="font-semibold text-[#3f7d49] hover:underline dark:text-[#8bc995]"
                >
                  {budget.sourceBudgetName} <ExternalLink className="inline size-3" />
                </Link>
                <Badge variant="outline">v{version.version}</Badge>
                <Badge variant="secondary">
                  {option.hasProducts ? "Con productos" : "Sin productos"}
                </Badge>
              </div>
              <p>
                {option.visits} {frequencyLabel[option.visitType]} · {Number(option.hoursPerVisit)} h · {option.employees} empleado{option.employees === 1 ? "" : "s"}
              </p>
              <p>
                Neto {money.format(Number(option.netPrice))} · IVA {money.format(Number(option.ivaAmount))} · Final {money.format(Number(option.finalPrice))} · Hora neta {money.format(Number(option.hourlyPrice))}
              </p>
              <p className="text-muted-foreground">
                Carga mensual {Number(option.monthlyWorkload)} h
                {option.visitType === "week" ? ` · cálculo semanal × ${Number(option.weeklyMultiplier)}` : ""}
                {` · usada ${usedAt.format(source.usedAt)}`}
              </p>
              <p className="text-muted-foreground">
                Origen generador: {budget.sourceBudgetId ? budget.sourceBudgetSlug : `${budget.sourceBudgetSlug} (archivado)`}
              </p>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-muted-foreground">
        Esta bibliografía es interna y no se agrega al correo del cliente.
      </p>
    </details>
  );
}
