import assert from "node:assert/strict";

import {
  getVisitExactDateAnchor,
  getVisitExactDateRange,
  getVisitFeedAnchor,
  getVisitWeekRange,
} from "../lib/ops/visit-feed";
import { VisitFeedFiltersSchema } from "../schemas/ops/visit-feed";

const timeZone = "America/Montevideo";
const now = new Date("2026-08-01T15:00:00.000Z");
const currentMonth = new Date("2026-08-01T15:00:00.000Z");
const previousMonth = new Date("2026-07-01T15:00:00.000Z");

assert.equal(
  getVisitFeedAnchor(currentMonth, now, timeZone).toISOString(),
  now.toISOString(),
  "El mes actual debe comenzar en la semana de hoy"
);
assert.equal(
  getVisitFeedAnchor(previousMonth, now, timeZone).toISOString(),
  "2026-07-31T15:00:00.000Z",
  "Un mes historico debe anclarse en su ultimo dia local"
);

const historicalWeek = getVisitWeekRange(
  getVisitFeedAnchor(previousMonth, now, timeZone),
  timeZone
);
assert.equal(historicalWeek.start.toISOString(), "2026-07-27T03:00:00.000Z");
assert.equal(historicalWeek.end.toISOString(), "2026-08-03T02:59:59.999Z");

const exactDateRange = getVisitExactDateRange("2026-08-06", timeZone);
assert.equal(exactDateRange.start.toISOString(), "2026-08-06T03:00:00.000Z");
assert.equal(exactDateRange.end.toISOString(), "2026-08-07T02:59:59.999Z");
assert.equal(
  getVisitExactDateAnchor("2026-08-06", timeZone).toISOString(),
  "2026-08-06T15:00:00.000Z"
);

const combinedFilters = VisitFeedFiltersSchema.safeParse({
  attentionOnly: true,
  cursor: now,
  employeeId: "UNASSIGNED",
  exactDate: "2026-08-06",
  jobId: "ALL",
  status: "SKIPPED",
});
assert.equal(combinedFilters.success, true, "Los filtros deben poder combinarse");
assert.equal(
  VisitFeedFiltersSchema.safeParse({ cursor: now, exactDate: "2026-02-30" }).success,
  false,
  "Una fecha exacta invalida debe rechazarse"
);
assert.equal(
  VisitFeedFiltersSchema.safeParse({ cursor: now, employeeId: "invalid" }).success,
  false,
  "Una seleccion de empleada invalida debe rechazarse"
);

console.log("Visit feed checks passed");
