import "server-only";

import type { JobScheduleRule, Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import {
  createOccurrenceEmployeeRows,
  getUniqueEmployeeIds,
} from "@/lib/ops/job-occurrence-employees";
import {
  buildCandidateStarts,
  MINUTE,
  type GenerationRange,
} from "@/lib/ops/job-occurrence-recurrence";

type AssignmentWindow = Pick<
  Prisma.JobEmployeeAssignmentGetPayload<{
    select: { employeeId: true; assignedFrom: true; assignedTo: true };
  }>,
  "employeeId" | "assignedFrom" | "assignedTo"
>;

export type RuleForGeneration = JobScheduleRule & {
  job: {
    assignments: AssignmentWindow[];
  };
};

const resolveEmployeeIds = (
  assignments: AssignmentWindow[],
  scheduledStartAt: Date
) => {
  const activeAssignments = assignments.filter(
    (assignment) =>
      assignment.assignedFrom.getTime() <= scheduledStartAt.getTime() &&
      (!assignment.assignedTo ||
        assignment.assignedTo.getTime() >= scheduledStartAt.getTime())
  );

  return getUniqueEmployeeIds(
    activeAssignments.map((assignment) => assignment.employeeId)
  );
};

const getMissingStarts = async (rule: RuleForGeneration, starts: Date[]) => {
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

export const createMissingOccurrences = async (
  rule: RuleForGeneration,
  range: GenerationRange,
  userId: string
) => {
  const starts = buildCandidateStarts(rule, range);
  if (!starts.length) {
    return 0;
  }

  const missingStarts = await getMissingStarts(rule, starts);
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
