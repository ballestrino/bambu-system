import "server-only";

import { db } from "@/lib/db";
import {
  buildCandidateStarts,
  getRuleGenerationWindow,
  type GenerationRange,
} from "@/lib/ops/job-occurrence-recurrence";
import type { OccurrenceGenerationFilters } from "@/lib/ops/occurrence-generation-range";
import {
  getReplacementReasons,
  isUntouchedOccurrence,
  type ReplacementReason,
} from "@/lib/ops/occurrence-replacement";

export type ReplaceableOccurrence = {
  endAt: Date;
  id: string;
  jobName: string;
  reasons: ReplacementReason[];
  // Its start is still one the rule produces: generating creates it again.
  recreated: boolean;
  startAt: Date;
};

// Every rule of the scope, active or not: a visit of a deactivated rule no
// longer matches either.
const getScopeRules = (
  range: GenerationRange,
  { jobId, scheduleRuleId }: OccurrenceGenerationFilters
) =>
  db.jobScheduleRule.findMany({
    where: { id: scheduleRuleId, jobId, job: { archivedAt: null } },
    include: {
      job: {
        select: {
          assignments: {
            where: {
              archivedAt: null,
              assignedFrom: { lte: range.end },
              OR: [{ assignedTo: null }, { assignedTo: { gte: range.start } }],
            },
            select: { assignedFrom: true, assignedTo: true, employeeId: true },
          },
        },
      },
    },
  });

// The scope's visits in the range that no longer match their rule. Only the
// ones that have not started: the past is history. Untouched ones can be
// replaced; edited ones are kept and only counted.
export const findReplaceableOccurrences = async (
  range: GenerationRange,
  filters: OccurrenceGenerationFilters,
  now = new Date()
) => {
  const from = new Date(Math.max(range.start.getTime(), now.getTime()));
  const rules = from.getTime() <= range.end.getTime() ? await getScopeRules(range, filters) : [];
  if (!rules.length) return { kept: 0, replaceable: [] as ReplaceableOccurrence[] };

  const occurrences = await db.jobOccurrence.findMany({
    where: {
      archivedAt: null,
      isDetached: false,
      scheduleRuleId: { in: rules.map((rule) => rule.id) },
      scheduledStartAt: { gte: from, lte: range.end },
      status: "SCHEDULED",
    },
    select: {
      _count: { select: { timeEntries: true } },
      actualEndAt: true,
      actualStartAt: true,
      employees: { select: { employeeId: true } },
      id: true,
      job: { select: { name: true } },
      scheduleRuleId: true,
      scheduledEndAt: true,
      scheduledStartAt: true,
      updatedById: true,
    },
    orderBy: { scheduledStartAt: "asc" },
  });

  const rulesById = new Map(rules.map((rule) => [rule.id, rule]));
  const candidateTimes = new Map(
    rules.map((rule) => {
      const window = getRuleGenerationWindow(rule, range);
      const starts = window ? buildCandidateStarts(rule, window) : [];
      return [rule.id, new Set(starts.map((start) => start.getTime()))];
    })
  );

  let kept = 0;
  const replaceable: ReplaceableOccurrence[] = [];
  for (const occurrence of occurrences) {
    const rule = occurrence.scheduleRuleId ? rulesById.get(occurrence.scheduleRuleId) : null;
    if (!rule) continue;
    const times = candidateTimes.get(rule.id) ?? new Set<number>();
    const reasons = getReplacementReasons({
      assignments: rule.job.assignments,
      candidateTimes: times,
      occurrence: {
        employeeIds: occurrence.employees.map((employee) => employee.employeeId),
        scheduledEndAt: occurrence.scheduledEndAt,
        scheduledStartAt: occurrence.scheduledStartAt,
      },
      rule,
    });
    if (!reasons.length) continue;

    if (!isUntouchedOccurrence({ ...occurrence, timeEntryCount: occurrence._count.timeEntries })) {
      kept += 1;
      continue;
    }
    replaceable.push({
      endAt: occurrence.scheduledEndAt,
      id: occurrence.id,
      jobName: occurrence.job.name,
      reasons,
      recreated: rule.isActive && times.has(occurrence.scheduledStartAt.getTime()),
      startAt: occurrence.scheduledStartAt,
    });
  }

  return { kept, replaceable };
};

// Deletes only the chosen visits that are still replaceable now: one edited
// between the preview and the confirmation stays.
export const deleteReplaceableOccurrences = async (
  range: GenerationRange,
  filters: OccurrenceGenerationFilters,
  ids: string[]
) => {
  if (!ids.length) return 0;

  const { replaceable } = await findReplaceableOccurrences(range, filters);
  const allowed = replaceable.map((occurrence) => occurrence.id).filter((id) => ids.includes(id));
  if (!allowed.length) return 0;

  const result = await db.jobOccurrence.deleteMany({
    where: {
      actualEndAt: null,
      actualStartAt: null,
      archivedAt: null,
      id: { in: allowed },
      status: "SCHEDULED",
      timeEntries: { none: {} },
      updatedById: null,
    },
  });

  return result.count;
};
