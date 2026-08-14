"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, RefreshCw, Search, ShieldCheck } from "lucide-react";

import { ProfitabilityCard } from "@/components/ops/profitability/profitability-card";
import { ProfitabilityLoading } from "@/components/ops/profitability/profitability-loading";
import { profitabilityNeedsAttention } from "@/components/ops/profitability/profitability-status";
import { OpsScrollContainer, OpsSection } from "@/components/ops/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { JobProfitability, ProfitabilitySeverity } from "@/lib/ops/profitability";

type Filter = "ALL" | "ATTENTION" | ProfitabilitySeverity;

export const FinancialProfitabilitySection = ({
  error,
  isLoading,
  onRetry,
  results,
}: {
  error: unknown;
  isLoading: boolean;
  onRetry: () => Promise<unknown> | void;
  results: JobProfitability[];
}) => {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("ATTENTION");
  const [isExpanded, setIsExpanded] = useState(true);
  const visible = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");
    return results.filter((result) => {
      const matchesQuery = !normalizedQuery || result.jobName.toLocaleLowerCase("es").includes(normalizedQuery);
      const matchesFilter =
        filter === "ALL" ||
        (filter === "ATTENTION"
          ? profitabilityNeedsAttention(result.severity)
          : result.severity === filter);
      return matchesQuery && matchesFilter;
    });
  }, [filter, query, results]);

  return (
    <div className="scroll-mt-28" id="rentabilidad">
      <OpsSection
        actions={
          <div className="flex flex-col gap-2 sm:flex-row">
            {isExpanded ? (
              <>
                <label className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9 sm:w-64" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar servicio" value={query} />
                </label>
                <Select onValueChange={(value) => setFilter(value as Filter)} value={filter}>
                  <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATTENTION">Requiere atención</SelectItem>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="CRITICAL_LOSS">Pérdida crítica</SelectItem>
                    <SelectItem value="LOSS">Con pérdida</SelectItem>
                    <SelectItem value="LOW_PROFIT">Ganancia baja</SelectItem>
                    <SelectItem value="INCOMPLETE">Datos incompletos</SelectItem>
                    <SelectItem value="HEALTHY">En objetivo</SelectItem>
                    <SelectItem value="NO_ACTIVITY">Sin actividad</SelectItem>
                  </SelectContent>
                </Select>
              </>
            ) : null}
            <Button
              aria-controls="rentabilidad-contenido"
              aria-expanded={isExpanded}
              onClick={() => setIsExpanded((current) => !current)}
              type="button"
              variant="outline"
            >
              {isExpanded ? <EyeOff /> : <Eye />}
              {isExpanded ? "Ocultar" : "Mostrar"}
            </Button>
          </div>
        }
        description="Compara el presupuesto sin IVA con horas, boletos y costes directos vinculados. Los cobros se muestran como contexto."
        title="Rentabilidad por servicio"
      >
        <div hidden={!isExpanded} id="rentabilidad-contenido">
          {isLoading ? <ProfitabilityLoading /> : error ? (
            <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              <span>No pudimos calcular la rentabilidad.</span>
              <Button onClick={() => void onRetry()} size="sm" variant="outline"><RefreshCw /> Reintentar</Button>
            </div>
          ) : visible.length ? (
            <OpsScrollContainer>
              <div className="grid gap-3 xl:grid-cols-2">
                {visible.map((result) => <ProfitabilityCard key={result.jobId} result={result} />)}
              </div>
            </OpsScrollContainer>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
              <ShieldCheck className="h-5 w-5 text-emerald-600" /> No hay servicios para este filtro.
            </div>
          )}
        </div>
      </OpsSection>
    </div>
  );
};
