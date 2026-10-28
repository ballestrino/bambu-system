"use client";

import { useMemo, useState } from "react";

import { useJobProfitability } from "@/components/ops/hooks/useJobProfitability";
import { useJobScheduleRules } from "@/components/ops/hooks/useJobScheduleRules";
import { useJobs } from "@/components/ops/hooks/useJobs";
import {
  buildJobRows,
  jobSortAccessors,
  jobStatusTabs,
  matchesJobRow,
  type JobRuleSummary,
  type JobStatusTab,
  type JobsSortKey,
} from "@/components/ops/jobs/jobs-table-model";
import {
  useOpsFlushableDebouncedValue,
  useOpsPersistedState,
  useOpsSelectedMonth,
} from "@/components/ops/shared";
import { getNextSort, sortRows, type SortState } from "@/lib/ops/table-query";
import type { JobFilters } from "@/schemas/ops";

export type JobVisibility = "DEFAULT" | "PUNCTUAL" | "ALL";

export type JobsTableFilters = {
  attentionOnly: boolean;
  includeArchived: boolean;
  query: string;
  status: JobStatusTab;
  visibility: JobVisibility;
};

export const defaultJobsTableFilters: JobsTableFilters = {
  attentionOnly: false,
  includeArchived: false,
  query: "",
  status: "all",
  visibility: "DEFAULT",
};

const activeRulesFilter = { isActive: true };

// Datos y estado de la tabla de Trabajos: filtros guardados, filas con la
// rentabilidad del mes elegido, conteos por pestaña, orden y selección.
export const useJobsTable = () => {
  const { month } = useOpsSelectedMonth();
  const [filters, setFilters] = useOpsPersistedState(
    "bambu:ops:jobs:table-filters",
    defaultJobsTableFilters
  );
  const [debouncedQuery, flushQuery] = useOpsFlushableDebouncedValue(
    filters.query,
    // Vaciar el buscador vuelve al listado completo, que ya está en caché.
    filters.query.trim() ? 350 : 0
  );
  const [sort, setSort] = useState<SortState<JobsSortKey>>({ direction: "asc", key: "name" });
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  const serverFilters: JobFilters = {
    includeArchived: filters.includeArchived,
    query: debouncedQuery || undefined,
    visibility: filters.visibility,
  };
  const jobsQuery = useJobs(serverFilters);
  const profitabilityQuery = useJobProfitability({ mode: "MONTH", month });
  const rulesQuery = useJobScheduleRules(activeRulesFilter);

  const rows = useMemo(
    () =>
      buildJobRows(
        jobsQuery.jobs,
        new Map(profitabilityQuery.profitability.map((result) => [result.jobId, result])),
        rulesQuery.scheduleRules as JobRuleSummary[]
      ),
    [jobsQuery.jobs, profitabilityQuery.profitability, rulesQuery.scheduleRules]
  );

  const tabs = jobStatusTabs(filters.includeArchived).map(([key, label]) => ({
    count: rows.filter((row) =>
      matchesJobRow(row, { attentionOnly: filters.attentionOnly, status: key })
    ).length,
    key,
    label,
  }));
  const attentionCount = rows.filter((row) => row.needsAttention).length;

  const visibleRows = useMemo(
    () =>
      sortRows(
        rows.filter((row) => matchesJobRow(row, filters)),
        jobSortAccessors,
        sort
      ),
    [filters, rows, sort]
  );
  const selectedRows = visibleRows.filter((row) => selected.has(row.job.id));
  const allSelected = visibleRows.length > 0 && selectedRows.length === visibleRows.length;

  const updateFilters = (values: Partial<JobsTableFilters>) =>
    setFilters((current) => ({ ...current, ...values }));

  return {
    attentionCount,
    error: jobsQuery.error ?? profitabilityQuery.error,
    filters,
    flushQuery,
    isFetching: jobsQuery.isFetching || profitabilityQuery.isFetching || rulesQuery.isFetching,
    isLoading: jobsQuery.isLoading || profitabilityQuery.isLoading,
    isSearching: jobsQuery.isFetching,
    month,
    refetch: () =>
      Promise.all([jobsQuery.refetch(), profitabilityQuery.refetch(), rulesQuery.refetch()]),
    selection: {
      allSelected,
      clear: () => setSelected(new Set()),
      isSelected: (jobId: string) => selected.has(jobId),
      rows: selectedRows,
      toggle: (jobId: string) =>
        setSelected((current) => {
          const next = new Set(current);
          if (next.has(jobId)) next.delete(jobId);
          else next.add(jobId);
          return next;
        }),
      toggleAll: () =>
        setSelected(allSelected ? new Set() : new Set(visibleRows.map((row) => row.job.id))),
    },
    sort,
    tabs,
    toggleSort: (key: JobsSortKey) =>
      setSort((current) => getNextSort(current, key, key === "price" ? "desc" : "asc")),
    updateFilters,
    clearFilters: () => setFilters(defaultJobsTableFilters),
    visibleRows,
  };
};

export type JobsTableState = ReturnType<typeof useJobsTable>;
