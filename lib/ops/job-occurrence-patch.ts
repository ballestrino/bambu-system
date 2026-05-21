import "server-only";

import type { JobOccurrence } from "@prisma/client";

import { CreateJobOccurrenceSchema } from "@/schemas/ops";
import type {
  DetachJobOccurrenceInput,
  UpdateJobOccurrenceInput,
} from "@/schemas/ops";
import { getPatchedValue, hasOwnKey } from "@/lib/ops/patch";

type JobOccurrencePatch = DetachJobOccurrenceInput | UpdateJobOccurrenceInput;
type JobOccurrenceRulePatch = JobOccurrencePatch & {
  scheduleRuleId?: string | null;
};

const getPatchedNullableValue = <T extends object, K extends keyof T, V>(
  patch: T,
  key: K,
  currentValue: V | null
): T[K] | V | null => {
  if (!hasOwnKey(patch, key) || patch[key] === undefined) {
    return currentValue ?? null;
  }

  return patch[key] ?? null;
};

export const buildResolvedJobOccurrence = (
  existingOccurrence: JobOccurrence,
  patch: JobOccurrenceRulePatch,
  overrides?: Partial<
    Pick<JobOccurrence, "isDetached" | "scheduleRuleId">
  >
) => {
  const hasScheduleRuleOverride = overrides
    ? "scheduleRuleId" in overrides
    : false;

  return {
    jobId: existingOccurrence.jobId,
    scheduleRuleId: hasScheduleRuleOverride
      ? overrides?.scheduleRuleId ?? undefined
      : hasOwnKey(patch, "scheduleRuleId")
        ? patch.scheduleRuleId ?? undefined
        : existingOccurrence.scheduleRuleId ?? undefined,
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
    actualStartAt: getPatchedNullableValue(
      patch,
      "actualStartAt",
      existingOccurrence.actualStartAt
    ),
    actualEndAt: getPatchedNullableValue(
      patch,
      "actualEndAt",
      existingOccurrence.actualEndAt
    ),
    status: getPatchedValue(patch, "status", existingOccurrence.status),
    isDetached:
      overrides?.isDetached ??
      ("isDetached" in patch && patch.isDetached !== undefined
        ? patch.isDetached
        : existingOccurrence.isDetached),
    notes: getPatchedValue(patch, "notes", existingOccurrence.notes ?? null),
  };
};

export const validateResolvedJobOccurrence = (
  occurrence: ReturnType<typeof buildResolvedJobOccurrence>
) =>
  CreateJobOccurrenceSchema.safeParse({
    ...occurrence,
    scheduleRuleId: occurrence.scheduleRuleId ?? undefined,
    actualStartAt: occurrence.actualStartAt ?? undefined,
    actualEndAt: occurrence.actualEndAt ?? undefined,
    notes: occurrence.notes ?? undefined,
  });
