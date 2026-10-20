import assert from "node:assert/strict";

import { getVisitCandidates } from "../lib/ops/visit-availability";
import {
  formatDayLabel,
  formatWeekRange,
  getDefaultDayKey,
  getMonthGrid,
  getWeekDays,
  shiftDayKey,
} from "../lib/ops/visit-calendar";
import {
  buildDayColumns,
  formatHours,
  getTimeGridBox,
  getVisitDayKey,
  getVisitsOfDay,
  groupVisitsByHour,
  isAttentionVisit,
  isRegistrableVisit,
  summarizeVisitDays,
} from "../lib/ops/visit-day";

// Logica de la pagina de Visitas (feature 26). Montevideo es UTC-3: las horas
// se arman en UTC para que el resultado no dependa de la zona de la maquina.
const ana = { id: "ana", name: "Ana Rodríguez" };
const lucia = { id: "lucia", name: "Lucía Pereira" };
const visit = (
  id: string,
  day: string,
  start: string,
  end: string,
  team: { id: string; name: string }[],
  status: "SCHEDULED" | "DONE" | "SKIPPED" | "CANCELED" = "SCHEDULED"
) => {
  const at = (time: string) => {
    const [hour, minute] = time.split(":").map(Number);
    const [year, month, date] = day.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, date, hour + 3, minute));
  };
  return {
    actualEndAt: null,
    actualStartAt: null,
    employees: team.map((employee) => ({ employee })),
    id,
    job: { id: `job-${id}`, name: `Trabajo ${id}` },
    jobId: `job-${id}`,
    scheduledEndAt: at(end),
    scheduledStartAt: at(start),
    status,
  };
};

const v1 = visit("v1", "2026-10-09", "08:00", "10:30", [ana], "DONE");
const v2 = visit("v2", "2026-10-09", "08:30", "12:00", [lucia]);
const v3 = visit("v3", "2026-10-09", "09:00", "12:00", [], "SCHEDULED");
const v4 = visit("v4", "2026-10-09", "11:00", "13:00", [ana]);
const v5 = visit("v5", "2026-10-09", "22:30", "23:30", [lucia], "SKIPPED");
const v6 = visit("v6", "2026-10-10", "10:00", "12:00", []);
const all = [v4, v2, v1, v3, v5, v6];

// --- Day keys follow Montevideo: 22:30 local is the next day in UTC.
assert.equal(getVisitDayKey(v5.scheduledStartAt), "2026-10-09");
assert.deepEqual(getVisitsOfDay(all, "2026-10-09").map(({ id }) => id), ["v1", "v2", "v3", "v4", "v5"]);

// --- Attention and registration rules.
assert.ok(isAttentionVisit(v3) && isAttentionVisit(v5) && !isAttentionVisit(v2));
assert.ok(isRegistrableVisit(v2) && !isRegistrableVisit(v1) && !isRegistrableVisit(v3));
assert.ok(!isRegistrableVisit({ ...v2, actualEndAt: v2.scheduledEndAt, actualStartAt: v2.scheduledStartAt }));

// --- Totals per day for the strip and the mini month.
const totals = summarizeVisitDays(all);
assert.deepEqual(totals.get("2026-10-09"), { attention: 2, done: 1, scheduled: 3, total: 5 });
assert.deepEqual(totals.get("2026-10-10"), { attention: 1, done: 0, scheduled: 1, total: 1 });

// --- Hour groups in order, labelled by the local hour.
const groups = groupVisitsByHour(getVisitsOfDay(all, "2026-10-09"));
assert.deepEqual(groups.map(({ items, label }) => [label, items.map(({ id }) => id)]), [
  ["08:00", ["v1", "v2"]], ["09:00", ["v3"]], ["11:00", ["v4"]], ["22:00", ["v5"]],
]);

// --- Columns: Sin asignar first, then the team; hours add up.
const columns = buildDayColumns(getVisitsOfDay(all, "2026-10-09"), [ana]);
assert.deepEqual(columns.map(({ employeeId, visits }) => [employeeId, visits.map(({ id }) => id)]), [
  [null, ["v3"]], ["ana", ["v1", "v4"]], ["lucia", ["v2", "v5"]],
]);
assert.equal(formatHours(columns[1].minutes), "4,5 h");

// --- Grid boxes: 46 px per hour from 07:00; out of range is clamped.
assert.deepEqual(getTimeGridBox({ endMinute: 10 * 60 + 30, startMinute: 8 * 60 }, 46), { height: 111, top: 48 });
assert.equal(getTimeGridBox({ endMinute: 23 * 60 + 30, startMinute: 22 * 60 + 30 }, 46).top, 13 * 46 - 30 * 46 / 60 + 2);

// --- Calendar helpers.
assert.deepEqual(getWeekDays("2026-10-09").map(({ day, weekdayLetter }) => `${weekdayLetter}${day}`), [
  "L5", "M6", "M7", "J8", "V9", "S10", "D11",
]);
assert.equal(shiftDayKey("2026-10-31", 1), "2026-11-01");
const grid = getMonthGrid(2026, 10);
assert.equal(grid.length, 35);
assert.equal(grid.findIndex((day) => day?.day === 1), 3, "October 2026 starts on a Thursday");
assert.equal(formatDayLabel("2026-10-09"), "Viernes 9 de octubre");
assert.equal(formatWeekRange("2026-10-05", "2026-10-11"), "5 – 11 de octubre");
assert.equal(formatWeekRange("2026-09-28", "2026-10-04"), "28 de septiembre – 4 de octubre");
assert.equal(getDefaultDayKey(2026, 10, "2026-10-09"), "2026-10-09");
assert.equal(getDefaultDayKey(2026, 11, "2026-10-09"), "2026-11-01");

// --- Candidates for the unassigned 09:00-12:00: Ana is busy with v1 (DONE
// still blocks), Lucía with v2; a SKIPPED visit never blocks.
const mariela = { id: "mariela", name: "Mariela Sosa" };
const candidates = getVisitCandidates({ employees: [ana, lucia, mariela], rules: [], visit: v3, visits: all });
assert.deepEqual(candidates.map(({ employeeId, isFree }) => [employeeId, isFree]), [
  ["mariela", true], ["ana", false], ["lucia", false],
]);
assert.equal(candidates[1].text, "Ocupada 08:00 – 10:30 · Trabajo v1");
assert.equal(candidates[0].text, "Libre todo el horario");
const late = visit("late", "2026-10-09", "13:00", "15:00", []);
const afterAna = getVisitCandidates({ employees: [ana], rules: [], visit: late, visits: all });
assert.equal(afterAna[0].text, "Libre · termina 13:00 en Trabajo v4");
const ruled = getVisitCandidates({
  employees: [mariela],
  rules: [{ employeeId: "mariela", endMinute: 12 * 60, kind: "AVAILABLE", startMinute: 8 * 60, weekdays: [5] }],
  visit: late,
  visits: all,
});
assert.equal(ruled[0].text, "Fuera de su disponibilidad");

console.log("check:visit-day OK");
