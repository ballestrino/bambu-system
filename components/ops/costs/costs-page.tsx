"use client";

import { useMemo, useState } from "react";
import type { PaymentStatus } from "@prisma/client";

import { BpsSettingsPanel } from "@/components/ops/costs/bps-settings-panel";
import { CostCategoriesPanel } from "@/components/ops/costs/cost-categories-panel";
import { CostDialog } from "@/components/ops/costs/cost-dialog";
import { CostsFilters, type CostsFilterState } from "@/components/ops/costs/costs-filters";
import { CostsList } from "@/components/ops/costs/costs-list";
import { CostsSummary } from "@/components/ops/costs/costs-summary";
import { getCostsSummary } from "@/components/ops/costs/cost-utils";
import { useEmployees } from "@/components/ops/hooks/useEmployees";
import { useJobClientPayments } from "@/components/ops/hooks/useJobClientPayments";
import { useJobs } from "@/components/ops/hooks/useJobs";
import { useOperationalCostCategories } from "@/components/ops/hooks/useOperationalCostCategories";
import { useOperationalCostMutations } from "@/components/ops/hooks/useOperationalCostMutations";
import { useOperationalCosts } from "@/components/ops/hooks/useOperationalCosts";
import { useOpsCostSettings } from "@/components/ops/hooks/useOpsCostSettings";
import { useEmployeePayments } from "@/components/ops/hooks/useEmployeePayments";
import { OpsPageHeader, OpsPageShell, OpsSection } from "@/components/ops/shared";
import { EmployeePaymentList } from "@/components/ops/payroll/employee-payment-list";
import { useEmployeePaymentMutations } from "@/components/ops/hooks/useEmployeePaymentMutations";
import { getMonthRange, toDateInputValue } from "@/components/ops/utils";

const getDefaultFilters = (): CostsFilterState => {
  const currentMonth = getMonthRange(new Date());
  return {
    categoryId: "ALL",
    employeeId: "ALL",
    endDate: toDateInputValue(currentMonth.end),
    jobId: "ALL",
    startDate: toDateInputValue(currentMonth.start),
    status: "ALL",
  };
};

export const CostsPage = () => {
  const [filters, setFilters] = useState<CostsFilterState>(getDefaultFilters);
  const rangeFilters = {
    startDate: filters.startDate ? new Date(`${filters.startDate}T00:00:00`) : undefined,
    endDate: filters.endDate ? new Date(`${filters.endDate}T23:59:59`) : undefined,
  };
  const selectedStatus =
    filters.status === "ALL" ? undefined : [filters.status as PaymentStatus];
  const selectedCategoryId =
    filters.categoryId === "ALL" ? undefined : filters.categoryId;
  const selectedEmployeeId =
    filters.employeeId === "ALL" ? undefined : filters.employeeId;
  const selectedJobId = filters.jobId === "ALL" ? undefined : filters.jobId;

  const categoriesQuery = useOperationalCostCategories({ isActive: true });
  const employeesQuery = useEmployees({ includeArchived: true });
  const jobsQuery = useJobs({ includeArchived: false });
  const settingsQuery = useOpsCostSettings();
  const paymentsQuery = useJobClientPayments(
    { jobId: selectedJobId, ...rangeFilters, statuses: selectedStatus },
    `costs-revenue-${filters.jobId}-${filters.startDate}-${filters.endDate}-${filters.status}`
  );
  const employeePaymentsQuery = useEmployeePayments(
    {
      basis: "PAYMENT_DATE",
      employeeId: selectedEmployeeId,
      ...rangeFilters,
      statuses: selectedStatus,
    },
    `costs-payroll-${filters.employeeId}-${filters.startDate}-${filters.endDate}-${filters.status}`
  );
  const costsQuery = useOperationalCosts(
    {
      categoryId: selectedCategoryId,
      employeeId: selectedEmployeeId,
      jobId: selectedJobId,
      ...rangeFilters,
      statuses: selectedStatus,
    },
    `costs-${filters.categoryId}-${filters.employeeId}-${filters.jobId}-${filters.startDate}-${filters.endDate}-${filters.status}`
  );
  const { voidCostAsync } = useOperationalCostMutations();
  const { voidPaymentAsync } = useEmployeePaymentMutations();

  const bpsEstimatePercent = Number(
    settingsQuery.settings?.bpsEstimatePercent ?? 0
  );
  const summary = useMemo(
    () =>
      getCostsSummary({
        bpsEstimatePercent,
        clientPayments: paymentsQuery.payments,
        employeePayments: employeePaymentsQuery.payments,
        operationalCosts: costsQuery.costs,
      }),
    [
      bpsEstimatePercent,
      costsQuery.costs,
      employeePaymentsQuery.payments,
      paymentsQuery.payments,
    ]
  );
  const isRefreshing =
    categoriesQuery.isFetching ||
    costsQuery.isFetching ||
    employeePaymentsQuery.isFetching ||
    employeesQuery.isFetching ||
    jobsQuery.isFetching ||
    paymentsQuery.isFetching ||
    settingsQuery.isFetching;

  const refreshData = async () => {
    await Promise.all([
      categoriesQuery.refetch(),
      costsQuery.refetch(),
      employeePaymentsQuery.refetch(),
      employeesQuery.refetch(),
      jobsQuery.refetch(),
      paymentsQuery.refetch(),
      settingsQuery.refetch(),
    ]);
  };

  return (
    <OpsPageShell>
      <OpsPageHeader
        title="Costes"
        description="Ganancia real por mes de caja: cobros menos pagos y costes registrados."
        actions={
          <CostDialog
            categories={categoriesQuery.categories}
            employees={employeesQuery.employees}
            jobs={jobsQuery.jobs}
          />
        }
      />
      <CostsFilters
        categories={categoriesQuery.categories}
        employees={employeesQuery.employees}
        filters={filters}
        isRefreshing={isRefreshing}
        jobs={jobsQuery.jobs}
        onChange={(values) => setFilters((current) => ({ ...current, ...values }))}
        onClear={() => setFilters(getDefaultFilters())}
        onRefresh={refreshData}
      />
      <CostsSummary {...summary} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
        <OpsSection title="Costes registrados">
          <CostsList
            categories={categoriesQuery.categories}
            costs={costsQuery.costs}
            employees={employeesQuery.employees}
            isLoading={costsQuery.isLoading}
            jobs={jobsQuery.jobs}
            onVoid={async (costId) => {
              await voidCostAsync(costId);
            }}
          />
        </OpsSection>
        <div className="grid gap-5">
          <BpsSettingsPanel settings={settingsQuery.settings} />
          <CostCategoriesPanel categories={categoriesQuery.categories} />
        </div>
      </div>
      <EmployeePaymentList
        employees={employeesQuery.employees}
        isLoading={employeePaymentsQuery.isLoading}
        payments={employeePaymentsQuery.payments}
        onVoid={async (paymentId) => {
          await voidPaymentAsync(paymentId);
        }}
      />
    </OpsPageShell>
  );
};
