import "server-only";

import { db } from "@/lib/db";
import {
  createMissingOccurrences,
} from "@/lib/ops/job-occurrence-generation-create";
import {
  getGenerationHorizonEnd,
  getGenerationStart,
  getGenerationWindow,
} from "@/lib/ops/job-occurrence-recurrence";

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
      job: {
        archivedAt: null,
      },
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
