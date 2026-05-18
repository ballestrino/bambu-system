import "server-only";

import type { JobScheduleRule, Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import {
  buildCandidateStarts,
  getGenerationHorizonEnd,
  getGenerationStart,
  getGenerationWindow,
  MINUTE,
  type GenerationRange,
} from "@/lib/ops/job-occurrence-recurrence";

type AssignmentWindow = Pick<
  Prisma.JobEmployeeAssignmentGetPayload<{
    select: { employeeId: true; assignedFrom: true; assignedTo: true };
  }>,
  "employeeId" | "assignedFrom" | "assignedTo"
>;

type RuleForGeneration = JobScheduleRule & {
  job: {
    assignments: AssignmentWindow[];
  };
};

const resolveEmployeeId = (
  assignments: AssignmentWindow[],
  scheduledStartAt: Date
) => {
  const activeAssignments = assignments.filter(
    (assignment) =>
      assignment.assignedFrom.getTime() <= scheduledStartAt.getTime() &&
      (!assignment.assignedTo ||
        assignment.assignedTo.getTime() >= scheduledStartAt.getTime())
  );

  return activeAssignments.length === 1
    ? activeAssignments[0].employeeId
    : null;
};

const createMissingOccurrences = async (
  rule: RuleForGeneration,
  range: GenerationRange,
  userId: string
) => {
  const starts = buildCandidateStarts(rule, range);
  if (!starts.length) {
    return 0;
  }

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
  const data = starts
    .filter((start) => !existingTimes.has(start.getTime()))
    .map((scheduledStartAt) => ({
      createdById: userId,
      employeeId: resolveEmployeeId(rule.job.assignments, scheduledStartAt),
      isDetached: false,
      jobId: rule.jobId,
      scheduleRuleId: rule.id,
      scheduledEndAt: new Date(
        scheduledStartAt.getTime() + rule.durationMinutes * MINUTE
      ),
      scheduledStartAt,
      status: "SCHEDULED" as const,
    }));

  if (!data.length) {
    return 0;
  }

  const result = await db.jobOccurrence.createMany({
    data,
    skipDuplicates: true,
  });

  return result.count;
};

const getRulesForGeneration = async ({
  jobId,
  rangeStart,
  rangeEnd,
  scheduleRuleId,
}: {
  jobId?: string;
  rangeStart?: Date;
  rangeEnd?: Date;
  scheduleRuleId?: string;
}) => {
  const horizonEnd = getGenerationHorizonEnd();
  const requestedEnd =
    rangeEnd && rangeEnd.getTime() < horizonEnd.getTime()
      ? rangeEnd
      : horizonEnd;
  const assignmentStart = getGenerationStart(rangeStart);

  return db.jobScheduleRule.findMany({
    where: {
      id: scheduleRuleId,
      isActive: true,
      jobId,
      startDate: { lte: requestedEnd },
      OR: [{ endDate: null }, { endDate: { gte: assignmentStart } }],
    },
    include: {
      job: {
        select: {
          assignments: {
            where: {
              archivedAt: null,
              assignedFrom: { lte: requestedEnd },
              OR: [{ assignedTo: null }, { assignedTo: { gte: assignmentStart } }],
            },
            select: {
              assignedFrom: true,
              assignedTo: true,
              employeeId: true,
            },
          },
        },
      },
    },
  });
};

export const generateJobOccurrencesForRule = async ({
  rangeEnd,
  rangeStart,
  ruleId,
  userId,
}: {
  rangeEnd?: Date;
  rangeStart?: Date;
  ruleId: string;
  userId: string;
}) => {
  const rules = await getRulesForGeneration({
    rangeEnd,
    rangeStart,
    scheduleRuleId: ruleId,
  });
  const rule = rules[0];
  const range = rule ? getGenerationWindow(rule, rangeStart, rangeEnd) : null;

  return rule && range ? createMissingOccurrences(rule, range, userId) : 0;
};

export const ensureJobOccurrencesForRange = async ({
  jobId,
  rangeEnd,
  rangeStart,
  scheduleRuleId,
  userId,
}: {
  jobId?: string;
  rangeEnd?: Date;
  rangeStart?: Date;
  scheduleRuleId?: string;
  userId: string;
}) => {
  const rules = await getRulesForGeneration({
    jobId,
    rangeEnd,
    rangeStart,
    scheduleRuleId,
  });
  const counts = await Promise.all(
    rules.map((rule) => {
      const range = getGenerationWindow(rule, rangeStart, rangeEnd);
      return range ? createMissingOccurrences(rule, range, userId) : 0;
    })
  );

  return counts.reduce((total, count) => total + count, 0);
};
