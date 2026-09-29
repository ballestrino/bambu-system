import { readFileSync } from "node:fs";

import {
  getInitialOccurrenceState,
  getJobOccurrenceEmployeeOptions,
  updateOccurrenceDateTimeRange,
  updateOccurrenceScheduledTime,
} from "@/components/ops/jobs/job-occurrence-dialog-utils";
import { occurrenceStatusInputClass } from "@/components/ops/jobs/job-occurrence-status-field";
import {
  getVisitActionLabel,
  getVisitDialogIntent,
} from "@/components/ops/calendar/calendar-utils";
import type { OpsOccurrence } from "@/components/ops/types";

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

const statusInputClassTokens = new Set(occurrenceStatusInputClass.split(/\s+/));

assert(
  ["absolute", "inset-0", "h-full", "w-full", "opacity-0"].every((token) =>
    statusInputClassTokens.has(token)
  ),
  "Status radio does not cover its visible card"
);
assert(
  !statusInputClassTokens.has("sr-only"),
  "Status radio still uses a clipped focus target"
);

const synchronized = updateOccurrenceDateTimeRange({
  startValue: "",
  endValue: "",
  field: "start",
  part: "date",
  nextPart: "2026-08-10",
});

assert(synchronized.startValue === "2026-08-10T", "Start date was not set");
assert(synchronized.endValue === "2026-08-10T", "Empty end date was not synchronized");

const preserved = updateOccurrenceDateTimeRange({
  startValue: "",
  endValue: "2026-08-11T14:00",
  field: "start",
  part: "date",
  nextPart: "2026-08-10",
});

assert(preserved.endValue === "2026-08-11T14:00", "Existing end date was overwritten");

const shiftedDay = updateOccurrenceDateTimeRange({
  startValue: "2026-08-06T09:00",
  endValue: "2026-08-06T11:00",
  field: "start",
  part: "date",
  nextPart: "2026-08-05",
});

assert(shiftedDay.startValue === "2026-08-05T09:00", "Start day was not shifted");
assert(shiftedDay.endValue === "2026-08-05T11:00", "Same-day end was not shifted");

const occurrence = {
  actualEndAt: null,
  actualStartAt: null,
  employees: [{ employee: { id: "employee" } }],
  jobId: "job",
  notes: null,
  scheduleRuleId: null,
  scheduledEndAt: new Date("2026-08-06T14:00:00Z"),
  scheduledStartAt: new Date("2026-08-06T12:00:00Z"),
  status: "SCHEDULED",
} as unknown as OpsOccurrence;
const completionState = getInitialOccurrenceState(occurrence, "complete");

assert(
  getVisitDialogIntent(occurrence) === "complete" &&
    getVisitActionLabel(occurrence) === "Registrar horario",
  "Assigned visit without real times is not offered to register them"
);
assert(completionState.status === "DONE", "Register timing did not complete the visit");
assert(
  completionState.actualStartAt === completionState.scheduledStartAt &&
    completionState.actualEndAt === completionState.scheduledEndAt,
  "Register timing did not prefill actual times"
);

// Scheduling keeps the visit as it is: no real times, same status.
const scheduleState = getInitialOccurrenceState(occurrence, "schedule");

assert(
  scheduleState.status === "SCHEDULED" &&
    scheduleState.actualStartAt === "" &&
    scheduleState.actualEndAt === "",
  "Scheduling changed the status or prefilled actual times"
);
assert(
  getVisitDialogIntent({ ...occurrence, employees: [] }) === "schedule",
  "A visit without team was opened to complete"
);
assert(
  getVisitDialogIntent({
    ...occurrence,
    actualEndAt: occurrence.scheduledEndAt,
    actualStartAt: occurrence.scheduledStartAt,
  }) === "schedule",
  "A registered visit was opened to complete again"
);

// Completing a visit that is no longer scheduled keeps its status.
assert(
  getInitialOccurrenceState({ ...occurrence, status: "CANCELED" }, "complete").status ===
    "CANCELED",
  "Completing overwrote a non-scheduled status"
);

const shiftedStart = updateOccurrenceScheduledTime({
  field: "scheduledStartAt",
  formState: completionState,
  occurrence,
  value: "2026-08-05T09:00",
});
const shiftedCompletion = updateOccurrenceScheduledTime({
  field: "scheduledEndAt",
  formState: shiftedStart,
  occurrence,
  value: "2026-08-05T11:00",
});

assert(
  shiftedCompletion.actualStartAt === "2026-08-05T09:00" &&
    shiftedCompletion.actualEndAt === "2026-08-05T11:00",
  "Actual times that mirrored the schedule were not shifted"
);

const customActualTime = updateOccurrenceScheduledTime({
  field: "scheduledStartAt",
  formState: { ...completionState, actualStartAt: "2026-08-06T09:15" },
  occurrence,
  value: "2026-08-05T09:00",
});

assert(
  customActualTime.actualStartAt === "2026-08-06T09:15",
  "A custom actual time was overwritten"
);

const activeEmployee = {
  archivedAt: null,
  id: "active",
  isActive: true,
  name: "Rosa",
};
const archivedAssignedEmployee = {
  archivedAt: new Date("2026-08-01T00:00:00Z"),
  id: "archived",
  isActive: false,
  name: "María",
};
const employeeOptions = getJobOccurrenceEmployeeOptions(
  [activeEmployee],
  [activeEmployee, archivedAssignedEmployee]
);

assert(employeeOptions.length === 2, "Assigned archived employee was not merged");
assert(employeeOptions[1]?.id === "archived", "Archived employee is not removable");

// Every caller says what the dialog is for; the old flag is gone.
const callers = [
  "components/ops/calendar/calendar-agenda-panel.tsx",
  "components/ops/dashboard/dashboard-quick-actions.tsx",
  "components/ops/jobs/job-occurrences-page.tsx",
  "components/ops/jobs/job-occurrences-panel.tsx",
  "components/ops/jobs/pending-visits-panel.tsx",
  "components/ops/schedules/schedule-board.tsx",
  "components/ops/visits/visit-item-actions.tsx",
  "components/ops/visits/visits-page.tsx",
];

for (const file of callers) {
  const source = readFileSync(file, "utf8");
  // Each opening tag up to its self-closing end, props spread over lines.
  const dialogs = source.split("<JobOccurrenceDialog").slice(1);

  assert(dialogs.length > 0, `${file} no longer renders the visit dialog`);
  assert(
    dialogs.every((dialog) => /\bintent=/.test(dialog.split("/>")[0])),
    `${file} opens the visit dialog without an intent`
  );
  assert(!source.includes("completeOnSave"), `${file} still passes completeOnSave`);
}

assert(
  readFileSync(callers[5], "utf8").includes('intent="schedule"'),
  "The schedule board does not schedule"
);

console.log("Occurrence dialog checks passed.");
