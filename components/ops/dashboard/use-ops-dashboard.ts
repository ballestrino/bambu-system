"use client";

import { useMemo } from "react";
import type { PaymentStatus } from "@prisma/client";

import { summarizeHomeWeek } from "@/lib/ops/home-week";
import { getScheduleWeek } from "@/lib/ops/schedule-week";
import { summarizeVisitDays } from "@/lib/ops/visit-day";
import { getDashboardFinancials } from "@/components/ops/dashboard/dashboard-financials";
import { useEmployees } from "@/components/ops/hooks/useEmployees";
import { useEmployeePayments } from "@/components/ops/hooks/useEmployeePayments";
import { useJobClientPayments } from "@/components/ops/hooks/useJobClientPayments";
import { useJobOccurrences } from "@/components/ops/hooks/useJobOccurrences";
import { useJobProfitability } from "@/components/ops/hooks/useJobProfitability";
import { useJobs } from "@/components/ops/hooks/useJobs";
import { useOperationalCosts } from "@/components/ops/hooks/useOperationalCosts";
import { useOpsCostSettings } from "@/components/ops/hooks/useOpsCostSettings";
import { usePendingVisits } from "@/components/ops/hooks/usePendingVisits";
import { useOpsSelectedMonth } from "@/components/ops/shared";

// Inicio: pendientes de registro (todas las fechas), la semana actual para la
// agenda y el equipo, y los importes del mes elegido.
export const useOpsDashboard = () => {
  const { month, monthKey, monthRange } = useOpsSelectedMonth();
  const financialDateFilters = useMemo<{
    endDate: Date;
    startDate: Date;
    statuses: PaymentStatus[];
  }>(
    () => ({
      endDate: monthRange.end,
      startDate: monthRange.start,
      statuses: ["RECORDED"],
    }),
    [monthRange.end, monthRange.start]
  );
  const weekRange = useMemo(() => getScheduleWeek(new Date()), []);

  const pending = usePendingVisits();
  const week = useJobOccurrences(
    { endDate: weekRange.end, includeArchived: false, startDate: weekRange.start },
    `dashboard-week-${weekRange.startKey}`
  );
  const employees = useEmployees({ includeArchived: false, isActive: true });
  const jobs = useJobs({ includeArchived: false });
  const clientPayments = useJobClientPayments(
    financialDateFilters,
    `dashboard-recorded-payments-${monthKey}`
  );
  const employeePayments = useEmployeePayments(
    { assignedMonth: month, statuses: ["RECORDED"] },
    `dashboard-recorded-employee-payments-${monthKey}`
  );
  const costs = useOperationalCosts(
    financialDateFilters,
    `dashboard-recorded-costs-${monthKey}`
  );
  const settings = useOpsCostSettings();
  const profitability = useJobProfitability({ mode: "MONTH", month });

  const todayKey = pending.todayKey;
  const weekSummary = useMemo(
    () =>
      summarizeHomeWeek({
        employees: employees.employees.map(({ id, name }) => ({ id, name })),
        todayKey: todayKey ?? "",
        visits: week.occurrences,
      }),
    [employees.employees, todayKey, week.occurrences]
  );
  const weekTotals = useMemo(() => summarizeVisitDays(week.occurrences), [week.occurrences]);
  const financials = useMemo(
    () =>
      getDashboardFinancials({
        bpsEstimatePercent: Number(settings.settings?.bpsEstimatePercent ?? 0),
        clientPayments: clientPayments.payments,
        employeePayments: employeePayments.payments,
        jobs: jobs.jobs,
        operationalCosts: costs.costs,
      }),
    [clientPayments.payments, costs.costs, employeePayments.payments, jobs.jobs, settings.settings?.bpsEstimatePercent]
  );

  const refreshWeek = () => Promise.all([week.refetch(), employees.refetch()]);
  const refreshFinancials = () =>
    Promise.all([
      costs.refetch(),
      employeePayments.refetch(),
      jobs.refetch(),
      clientPayments.refetch(),
      settings.refetch(),
    ]);
  const refreshDashboard = () =>
    Promise.all([pending.refetch(), refreshWeek(), refreshFinancials(), profitability.refetch()]);

  return {
    employees,
    financialError:
      costs.error ?? employeePayments.error ?? jobs.error ??
      clientPayments.error ?? settings.error,
    financials,
    isFinancialsLoading:
      costs.isLoading || employeePayments.isLoading || jobs.isLoading ||
      clientPayments.isLoading || settings.isLoading,
    isRefreshing:
      costs.isFetching || employeePayments.isFetching || employees.isFetching ||
      jobs.isFetching || week.isFetching || clientPayments.isFetching ||
      settings.isFetching || pending.isFetching || profitability.isFetching,
    isWeekLoading: week.isLoading || employees.isLoading || !todayKey,
    month,
    pending,
    profitability,
    refreshDashboard,
    refreshFinancials,
    refreshWeek,
    todayKey,
    week,
    weekError: week.error ?? employees.error,
    weekSummary,
    weekTotals,
  };
};

export type OpsDashboard = ReturnType<typeof useOpsDashboard>;
