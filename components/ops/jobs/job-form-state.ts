import type { OpsJobDetail, OpsJobListItem } from "@/components/ops/types";
import { toDateInputValue } from "@/components/ops/utils";
import type { JobType } from "@prisma/client";

export type EditableJob = {
  id: string;
  name: string;
  description?: string | null;
  serviceAddress?: string | null;
  serviceLocation?: string | null;
  operationalNotes?: string | null;
  status: string;
  jobType?: JobType;
  punctualStartDate?: Date | string | null;
  punctualEndDate?: Date | string | null;
  budgetIncludesIva?: boolean;
  sourceBudgetId?: string | null;
  sourceBudgetOptionId?: string | null;
};

export type JobFormJob = EditableJob | OpsJobListItem | OpsJobDetail;

export const getInitialJobFormState = (job?: EditableJob) => ({
  budgetIncludesIva: job?.budgetIncludesIva ?? true,
  description: job?.description ?? "",
  jobType: job?.jobType ?? "ONGOING",
  name: job?.name ?? "",
  operationalNotes: job?.operationalNotes ?? "",
  punctualEndDate: toDateInputValue(job?.punctualEndDate),
  punctualStartDate: toDateInputValue(job?.punctualStartDate),
  serviceAddress: job?.serviceAddress ?? "",
  serviceLocation: job?.serviceLocation ?? "",
  sourceBudgetId: job?.sourceBudgetId ?? "",
  sourceBudgetOptionId: job?.sourceBudgetOptionId ?? "",
  status: job?.status ?? "ACTIVE",
});
