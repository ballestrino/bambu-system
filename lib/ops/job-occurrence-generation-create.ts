import "server-only";

import type { JobScheduleRule } from "@prisma/client";

import { db } from "@/lib/db";
import { createOccurrenceEmployeeRows } from "@/lib/ops/job-occurrence-employees";
import { MINUTE } from "@/lib/ops/job-occurrence-recurrence";
import {
  resolveEmployeeIds,
  type AssignmentWindow,
} from "@/lib/ops/occurrence-replacement";

export type RuleForGeneration = JobScheduleRule & {
  job: {
    assignments: AssignmentWindow[];
  };
};

// The candidate starts of a rule that have no visit yet. A visit archived or
// moved by hand still counts, so generating again never brings it back.
export const findMissingStarts = async (
  rule: RuleForGeneration,
  starts: Date[]
) => {
  if (!starts.length) return [];

  const existing = await db.jobOccurrence.findMany({
    where: {
      jobId: rule.jobId,
      scheduledStartAt: { in: starts },
    },
    select: { scheduledStartAt: true },
  });
  const existingTimes = new Set(
    existing.map((occurrence) => occurrence.scheduledStartAt.getTime())
  );

  return starts.filter((start) => !existingTimes.has(start.getTime()));
};

const buildOccurrenceCandidates = (
  rule: RuleForGeneration,
  starts: Date[],
  userId: string
) =>
  starts.map((scheduledStartAt) => {
    const employeeIds = resolveEmployeeIds(rule.job.assignments, scheduledStartAt);

    return {
      data: {
        createdById: userId,
        isDetached: false,
        jobId: rule.jobId,
        scheduleRuleId: rule.id,
        scheduledEndAt: new Date(
          scheduledStartAt.getTime() + rule.durationMinutes * MINUTE
        ),
        scheduledStartAt,
        status: "SCHEDULED" as const,
      },
      employeeIds,
    };
  });

export const persistOccurrences = async (
  rule: RuleForGeneration,
  missingStarts: Date[],
  userId: string
) => {
  const candidates = buildOccurrenceCandidates(rule, missingStarts, userId);
  if (!candidates.length) {
    return 0;
  }

  const result = await db.jobOccurrence.createMany({
    data: candidates.map((candidate) => candidate.data),
    skipDuplicates: true,
  });

  const employeesByStart = new Map(
    candidates.map((candidate) => [
      candidate.data.scheduledStartAt.getTime(),
      candidate.employeeIds,
    ])
  );
  const occurrences = await db.jobOccurrence.findMany({
    where: {
      jobId: rule.jobId,
      scheduledStartAt: {
        in: candidates.map((candidate) => candidate.data.scheduledStartAt),
      },
    },
    select: { id: true, scheduledStartAt: true },
  });

  await createOccurrenceEmployeeRows(
    db,
    occurrences.flatMap((occurrence) =>
      (employeesByStart.get(occurrence.scheduledStartAt.getTime()) ?? []).map(
        (employeeId) => ({ employeeId, jobOccurrenceId: occurrence.id })
      )
    )
  );

  return result.count;
};
