import type { JobScheduleRule } from "@prisma/client";

import { MINUTE } from "@/lib/ops/job-occurrence-recurrence";

// Pure rules for replacing generated visits: generation and
// replacement decide a visit's team the same way.
export type AssignmentWindow = {
  assignedFrom: Date;
  assignedTo: Date | null;
  employeeId: string;
};

// The employees a job's assignments put on a visit that starts at that time.
export const resolveEmployeeIds = (assignments: AssignmentWindow[], scheduledStartAt: Date) =>
  Array.from(
    new Set(
      assignments
        .filter(
          (assignment) =>
            assignment.assignedFrom.getTime() <= scheduledStartAt.getTime() &&
            (!assignment.assignedTo ||
              assignment.assignedTo.getTime() >= scheduledStartAt.getTime())
        )
        .map((assignment) => assignment.employeeId)
    )
  );

export type ReplacementReason = "duration" | "inactiveRule" | "schedule" | "team";

export const replacementReasonLabels: Record<ReplacementReason, string> = {
  duration: "duración",
  inactiveRule: "regla inactiva",
  schedule: "día u horario",
  team: "equipo",
};

const sameIds = (left: string[], right: string[]) =>
  left.length === right.length && left.every((id) => right.includes(id));

// Why a visit no longer matches its rule: its day or time is not one the rule
// produces now, its duration changed, or its team is not the job's current
// one. A visit of an inactive rule never matches.
export const getReplacementReasons = ({
  assignments,
  candidateTimes,
  occurrence,
  rule,
}: {
  assignments: AssignmentWindow[];
  candidateTimes: Set<number>;
  occurrence: { employeeIds: string[]; scheduledEndAt: Date; scheduledStartAt: Date };
  rule: Pick<JobScheduleRule, "durationMinutes" | "isActive">;
}): ReplacementReason[] => {
  if (!rule.isActive) return ["inactiveRule"];

  const start = occurrence.scheduledStartAt.getTime();
  const reasons: ReplacementReason[] = [];
  if (!candidateTimes.has(start)) reasons.push("schedule");
  if ((occurrence.scheduledEndAt.getTime() - start) / MINUTE !== rule.durationMinutes) {
    reasons.push("duration");
  }
  if (!sameIds(occurrence.employeeIds, resolveEmployeeIds(assignments, occurrence.scheduledStartAt))) {
    reasons.push("team");
  }

  return reasons;
};

// A visit can be replaced only if nobody touched it: still scheduled, never
// edited (moving it in the schedule also edits it), no real times, no hours.
export const isUntouchedOccurrence = (occurrence: {
  actualEndAt: Date | null;
  actualStartAt: Date | null;
  timeEntryCount: number;
  updatedById: string | null;
}) =>
  occurrence.updatedById === null &&
  occurrence.actualStartAt === null &&
  occurrence.actualEndAt === null &&
  occurrence.timeEntryCount === 0;
