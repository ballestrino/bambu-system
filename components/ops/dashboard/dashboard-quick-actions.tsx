"use client";

import { EmployeeFormDialog } from "@/components/ops/employees/employee-form-dialog";
import { JobOccurrenceDialog } from "@/components/ops/jobs/job-occurrence-dialog";
import { JobFormDialog } from "@/components/ops/jobs/job-form-dialog";

export const DashboardQuickActions = () => (
  <div className="flex flex-wrap gap-2">
    <JobFormDialog />
    <JobOccurrenceDialog triggerLabel="Nueva visita" />
    <EmployeeFormDialog />
  </div>
);
