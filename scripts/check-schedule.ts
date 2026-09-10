import assert from "node:assert/strict";

import { countDeliverableVisits, getDeliverableDays } from "../lib/ops/schedule-mapper";
import {
  getScheduleWeek,
  parseScheduleWeekParam,
  shiftScheduleWeekKey,
  toLocalDateKey,
} from "../lib/ops/schedule-week";
import { formatScheduleWeekLabel } from "../lib/ops/schedule-format";
import { buildFixtureSchedule } from "./schedule-fixture";

// La semana siempre arranca el lunes en hora de Montevideo.
const sundayNight = getScheduleWeek(new Date("2026-09-21T02:30:00.000Z"));
assert.equal(sundayNight.startKey, "2026-09-14", "domingo 23:30 local sigue en su semana");

const mondayEarly = getScheduleWeek(new Date("2026-09-21T03:30:00.000Z"));
assert.equal(mondayEarly.startKey, "2026-09-21", "lunes 00:30 local abre semana nueva");

assert.equal(getScheduleWeek(parseScheduleWeekParam("2026-09-15")).startKey, "2026-09-14");
assert.equal(getScheduleWeek(parseScheduleWeekParam("2026-12-31")).startKey, "2026-12-28");
assert.equal(shiftScheduleWeekKey("2026-12-28", 1), "2027-01-04", "cruce de año");
assert.equal(shiftScheduleWeekKey("2026-09-14", -1), "2026-09-07");
assert.equal(toLocalDateKey({ day: 4, month: 3, year: 2026 }), "2026-03-04", "padding");

// Un parametro invalido cae en la semana actual en vez de romper.
const now = new Date("2026-09-16T12:00:00.000Z");
assert.equal(parseScheduleWeekParam("no-es-fecha", now).getTime(), now.getTime());
assert.equal(parseScheduleWeekParam(undefined, now).getTime(), now.getTime());

assert.equal(
  formatScheduleWeekLabel(new Date("2026-09-14T15:00:00.000Z"), new Date("2026-09-20T15:00:00.000Z")),
  "Semana del 14 al 20 de setiembre de 2026"
);
assert.equal(
  formatScheduleWeekLabel(new Date("2026-09-28T15:00:00.000Z"), new Date("2026-10-04T15:00:00.000Z")),
  "Semana del 28 de setiembre al 4 de octubre de 2026"
);

const schedule = buildFixtureSchedule();
const [maria, ana, lucia] = schedule.employees;

assert.equal(schedule.weekStartKey, "2026-09-14");
assert.equal(schedule.weekEndKey, "2026-09-20");
assert.equal(maria.days.length, 7, "siempre siete dias");
assert.deepEqual(
  maria.days.map((day) => day.dateKey),
  ["2026-09-14", "2026-09-15", "2026-09-16", "2026-09-17", "2026-09-18", "2026-09-19", "2026-09-20"]
);
assert.equal(maria.days[0].weekdayLabel, "Lunes");
assert.equal(maria.days[0].longLabel, "Lunes 14 de setiembre");

// 21:00 local del domingo es 00:00 UTC del lunes siguiente: no debe desbordar.
assert.equal(maria.days[6].visits.length, 1, "la visita nocturna queda en el domingo");
assert.equal(maria.days[6].visits[0].startLabel, "21:00");

assert.deepEqual(
  maria.days[0].visits.map((visit) => visit.startLabel),
  ["08:00", "14:00"],
  "las visitas del dia van ordenadas por hora"
);
assert.deepEqual(maria.days[0].visits[0].teammates, ["Ana Belén Rodríguez"]);
assert.deepEqual(
  maria.days[1].visits[0].teammates,
  ["Ana Belén Rodríguez", "Lucía Fernández"],
  "las companeras excluyen a la titular y van ordenadas"
);
assert.equal(maria.days[1].visits[0].address, "Pocitos", "cae a serviceLocation");
assert.equal(maria.days[3].visits[0].address, "Av. Bolivia 1500, Torre B, subsuelo y planta baja");
assert.equal(ana.days[5].visits[0].address, "Sarandí 450");
assert.equal(lucia.totalVisits, 1, "una empleada con poca carga sigue teniendo su semana");

// Las visitas sin empleada no se pierden: van al balde de sin asignar.
assert.equal(schedule.unassigned[4].visits.length, 1);
assert.equal(schedule.unassigned[4].visits[0].jobName, "Trabajo sin asignar");
assert.equal(
  schedule.employees.every((employee) =>
    employee.days.every((day) => day.visits.every((visit) => visit.jobName !== "Trabajo sin asignar"))
  ),
  true
);

// El panel ve la cancelacion, el PDF no.
assert.equal(maria.days[2].visits[0].status, "CANCELED");
assert.equal(getDeliverableDays(maria)[2].visits.length, 0);
assert.equal(maria.totalVisits, 6, "cinco entregables mas la cancelada");
assert.equal(countDeliverableVisits(maria), 5);

console.log("Schedule checks passed");
