"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Calculator, RefreshCw } from "lucide-react";

import { BudgetsLoading } from "@/components/budgets/list/budgets-list-states";
import { useOfficialBudgetList } from "@/components/official-budgets/hooks/use-official-budgets";
import { OfficialBudgetsCards } from "@/components/official-budgets/list/official-budgets-cards";
import { OfficialBudgetsTable } from "@/components/official-budgets/list/official-budgets-table";
import { OfficialBudgetsToolbar } from "@/components/official-budgets/list/official-budgets-toolbar";
import type { OfficialBudgetStatus } from "@/components/official-budgets/types";
import { cn } from "@/lib/utils";

const outlineButton =
  "inline-flex h-11 items-center justify-center gap-[7px] whitespace-nowrap rounded-[10px] border border-ops-border bg-ops-surface px-3.5 text-[13.5px] font-semibold text-ops-text hover:bg-ops-surface-muted disabled:opacity-50";

const StateMessage = ({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) => (
  <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
    <p className="text-[15px] font-semibold text-ops-text">{title}</p>
    <p className="max-w-md text-[13.5px] text-ops-text-muted">{description}</p>
    {action ? <div className="mt-2">{action}</div> : null}
  </div>
);

// Presupuestos oficiales como la lista del generador: pestañas por estado,
// buscador y una fila por oficial con los precios de su versión vigente.
export const OfficialBudgetsPage = () => {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const status: OfficialBudgetStatus = params.get("status") === "ARCHIVED" ? "ARCHIVED" : "ACTIVE";
  const query = params.get("query")?.trim() ?? "";
  const result = useOfficialBudgetList({ status, query: query || undefined });
  const rows = result.data?.rows ?? [];

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}${next.size ? `?${next.toString()}` : ""}`);
  };

  return (
    <div className="container flex w-full flex-col gap-5 pb-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold text-ops-bamboo-strong">Precios</span>
          <h1 className="text-[28px] leading-[1.15] font-semibold tracking-tight text-ops-text">Presupuestos oficiales</h1>
          <p className="text-sm text-ops-text-muted">Precios comerciales publicados, versionados y auditables.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button aria-label="Refrescar" className={`${outlineButton} w-11 px-0`} disabled={result.isFetching} onClick={() => void result.refetch()} type="button">
            <RefreshCw className={cn("size-4", result.isFetching && "animate-spin")} />
          </button>
          <Link className={outlineButton} href="/dashboard/budgets?status=official">
            <Calculator className="size-4" />
            Ir al generador
          </Link>
        </div>
      </header>

      <section className="flex flex-col rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface">
        <div className="border-b border-ops-border p-3.5 md:p-4">
          <OfficialBudgetsToolbar
            counts={result.data?.counts}
            isFetching={result.isFetching}
            onQueryChange={(term) => setParam("query", term || null)}
            onStatusChange={(next) => setParam("status", next === "ARCHIVED" ? "ARCHIVED" : null)}
            query={query}
            status={status}
          />
        </div>

        {result.isLoading ? (
          <BudgetsLoading />
        ) : result.isError && !rows.length ? (
          <StateMessage
            action={<button className={outlineButton} onClick={() => void result.refetch()} type="button">Reintentar</button>}
            description="Revisá la conexión y volvé a intentar."
            title="No pudimos cargar los presupuestos oficiales"
          />
        ) : !rows.length ? (
          <StateMessage
            description={
              query
                ? "Probá con otra búsqueda."
                : status === "ACTIVE"
                  ? "Publicá uno desde el generador y aparece acá con su versión."
                  : "Cuando archives un oficial, queda acá con su historial."
            }
            title={query ? "Ningún oficial coincide" : status === "ACTIVE" ? "Todavía no hay oficiales activos" : "No hay oficiales archivados"}
          />
        ) : (
          <>
            <div className="hidden md:block">
              <OfficialBudgetsTable budgets={rows} />
            </div>
            <div className="md:hidden">
              <OfficialBudgetsCards budgets={rows} />
            </div>
          </>
        )}

        <div className="border-t border-ops-border px-4 py-3 text-[13px] text-ops-text-muted">
          {rows.length ? `${rows.length} ${rows.length === 1 ? "presupuesto oficial" : "presupuestos oficiales"}` : "Sin presupuestos oficiales"}
        </div>
      </section>
    </div>
  );
};
