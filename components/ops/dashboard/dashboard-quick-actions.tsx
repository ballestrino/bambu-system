"use client";

import { EmployeeFormDialog } from "@/components/ops/employees/employee-form-dialog";
import { JobOccurrenceDialog } from "@/components/ops/jobs/job-occurrence-dialog";
import { JobFormDialog } from "@/components/ops/jobs/job-form-dialog";
import { OpsRefreshButton } from "@/components/ops/shared";

export const DashboardQuickActions = ({
  isRefreshing,
  onRefresh,
}: {
  isRefreshing?: boolean;
  onRefresh: () => Promise<unknown> | void;
}) => (
  <div className="flex flex-wrap gap-2">
    <JobOccurrenceDialog triggerLabel="Nueva visita" />
    <JobFormDialog triggerVariant="outline" />
    <EmployeeFormDialog triggerVariant="outline" />
    <OpsRefreshButton isRefreshing={isRefreshing} onRefresh={onRefresh} />
  </div>
);
