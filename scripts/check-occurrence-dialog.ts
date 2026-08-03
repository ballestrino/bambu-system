import {
  getJobOccurrenceEmployeeOptions,
  updateOccurrenceDateTimeRange,
} from "@/components/ops/jobs/job-occurrence-dialog-utils";

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

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

console.log("Occurrence dialog checks passed.");
