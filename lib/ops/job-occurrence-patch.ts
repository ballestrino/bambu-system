import "server-only";

import type { JobOccurrence } from "@prisma/client";

import { CreateJobOccurrenceSchema } from "@/schemas/ops";
import type {
  DetachJobOccurrenceInput,
  UpdateJobOccurrenceInput,
} from "@/schemas/ops";
import { getPatchedValue } from "@/lib/ops/patch";

type JobOccurrencePatch = DetachJobOccurrenceInput | UpdateJobOccurrenceInput;

export const buildResolvedJobOccurrence = (
  existingOccurrence: JobOccurrence,
  patch: JobOccurrencePatch,
  overrides?: Partial<
    Pick<JobOccurrence, "isDetached" | "scheduleRuleId">
  >
) => ({
  jobId: existingOccurrence.jobId,
  scheduleRuleId:
    overrides?.scheduleRuleId ?? existingOccurrence.scheduleRuleId ?? undefined,
  scheduledStartAt: getPatchedValue(
    patch,
    "scheduledStartAt",
    existingOccurrence.scheduledStartAt
  ),
  scheduledEndAt: getPatchedValue(
    patch,
    "scheduledEndAt",
    existingOccurrence.scheduledEndAt
  ),
  actualStartAt: getPatchedValue(
    patch,
    "actualStartAt",
    existingOccurrence.actualStartAt ?? null
  ),
  actualEndAt: getPatchedValue(
    patch,
    "actualEndAt",
    existingOccurrence.actualEndAt ?? null
  ),
  status: getPatchedValue(patch, "status", existingOccurrence.status),
  isDetached:
    overrides?.isDetached ??
    ("isDetached" in patch && patch.isDetached !== undefined
      ? patch.isDetached
      : existingOccurrence.isDetached),
  notes: getPatchedValue(patch, "notes", existingOccurrence.notes ?? null),
});

export const validateResolvedJobOccurrence = (
  occurrence: ReturnType<typeof buildResolvedJobOccurrence>
) =>
  CreateJobOccurrenceSchema.safeParse({
    ...occurrence,
    actualStartAt: occurrence.actualStartAt ?? undefined,
    actualEndAt: occurrence.actualEndAt ?? undefined,
    notes: occurrence.notes ?? undefined,
  });
