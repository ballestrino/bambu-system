import Link from "next/link";
import { History, Link2, TriangleAlert } from "lucide-react";

import { formatDetailDate } from "@/components/budgets/budget-details/budget-detail-model";
import { formatBudgetMoney } from "@/components/budgets/create-budget/budget-summary-model";
import { pickOfficialOptions } from "@/components/official-budgets/official-budget-model";
import type { OfficialBudgetDetailDto, OfficialBudgetVersionDto } from "@/components/official-budgets/types";
import { cn } from "@/lib/utils";

type OfficialVersionsBandProps = {
  budget: OfficialBudgetDetailDto;
  selected: OfficialBudgetVersionDto;
  onSelect: (version: number) => void;
};

const mainNet = (version: OfficialBudgetVersionDto) => pickOfficialOptions(version.options).first?.netPrice ?? 0;

const delta = (current: number, previous: number | null) => {
  if (previous === null) return "Primera versión";
  if (!previous) return "";
  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? "+" : "−"} ${Math.abs(change).toLocaleString("es-UY", { maximumFractionDigits: 1 })}%`;
};

// Las versiones publicadas (la vigente primero) y de qué generador salen.
export const OfficialVersionsBand = ({ budget, selected, onSelect }: OfficialVersionsBandProps) => {
  const isCurrent = selected.version === budget.currentVersion;
  const author = selected.publishedBy.name || selected.publishedBy.email || "un administrador";

  return (
    <section className="flex flex-col gap-4 rounded-[var(--ops-radius-panel)] border border-ops-bamboo/25 bg-ops-bamboo-soft p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-ops-bamboo-strong">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 flex-none place-items-center rounded-full bg-ops-surface">
            <History className="size-5" />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-xs font-semibold tracking-[0.04em] uppercase">Versiones</span>
            <span className="text-[15px] font-semibold">
              Versión {selected.version} publicada el {formatDetailDate(selected.publishedAt)} por {author}
            </span>
          </div>
        </div>
        {budget.sourceBudget ? (
          <Link
            className="inline-flex min-h-11 items-center gap-1.5 text-[13.5px] font-semibold text-ops-text hover:text-ops-bamboo-strong"
            href={`/dashboard/budgets/budget/${budget.sourceBudget.slug}`}
          >
            <Link2 className="size-4" />
            Generador: {budget.sourceBudget.name}
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[12.5px] font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
            Generador desvinculado: los cambios ya no se publican desde ahí
          </span>
        )}
      </div>
      <div aria-label="Versión" className="flex flex-wrap gap-2" role="radiogroup">
        {budget.versions.map((version, index) => {
          const active = version.version === selected.version;
          const previous = budget.versions[index + 1];

          return (
            <button
              aria-checked={active}
              className={cn(
                "flex min-h-11 flex-col items-start rounded-[10px] border px-3 py-1.5 text-left",
                active ? "border-ops-bamboo-strong bg-ops-surface shadow-[0_1px_3px_rgb(24_37_29/0.14)]" : "border-ops-border bg-ops-surface/60 hover:bg-ops-surface"
              )}
              key={version.id}
              onClick={() => onSelect(version.version)}
              role="radio"
              type="button"
            >
              <span className="text-[13px] font-semibold text-ops-text">
                v{version.version} · {formatBudgetMoney(mainNet(version))}
              </span>
              <span className="text-xs text-ops-text-muted">
                {new Date(version.publishedAt).toLocaleDateString("es-UY", { day: "numeric", month: "short", year: "numeric" })} ·{" "}
                {delta(mainNet(version), previous ? mainNet(previous) : null)}
              </span>
            </button>
          );
        })}
      </div>
      {isCurrent ? null : (
        <p className="flex items-center gap-2 text-[13.5px] font-medium text-amber-800 dark:text-amber-200">
          <TriangleAlert className="size-4 flex-none" />
          Estás viendo la versión {selected.version}. La {budget.status === "ACTIVE" ? "vigente" : "última"} es la{" "}
          {budget.currentVersion}.
        </p>
      )}
    </section>
  );
};
