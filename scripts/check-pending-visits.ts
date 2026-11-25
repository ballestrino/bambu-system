import assert from "node:assert/strict";

import { countWeekOverlaps, getHomeVisitState, summarizeHomeWeek } from "../lib/ops/home-week";
import {
  describePendingSelection,
  formatPendingAge,
  getPendingAlertTone,
  getPendingVisits,
  summarizePendingVisits,
} from "../lib/ops/pending-visits";
import { filterPendingVisits, formatWeekdays, getPendingWeekdays, groupPendingByJob } from "../lib/ops/pending-visit-groups";
import { ResolvePendingVisitsSchema } from "../schemas/ops/pending-visits";

// Pendientes de registro e Inicio (feature 70). Montevideo es UTC-3: las horas
// se arman en UTC para que el resultado no dependa de la zona de la maquina.
const ana = { id: "ana", name: "Ana" };
const lucia = { id: "lucia", name: "Lucía" };
const TODAY = "2026-11-25";

type Status = "SCHEDULED" | "DONE" | "SKIPPED" | "CANCELED";
const visit = (
  id: string,
  job: string,
  day: string,
  [start, end]: [string, string],
  team: { id: string; name: string }[],
  { actual = false, rule = true, status = "SCHEDULED" as Status } = {}
) => {
  const at = (time: string) => {
    const [hour, minute] = time.split(":").map(Number);
    const [year, month, date] = day.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, date, hour + 3, minute));
  };
  return {
    actualEndAt: actual ? at(end) : null,
    actualStartAt: actual ? at(start) : null,
    employees: team.map((employee) => ({ employee })),
    id,
    job: { id: job, name: job === "godoy" ? "Godoy" : "Ésquin SAS" },
    jobId: job,
    scheduleRuleId: rule ? `rule-${job}` : null,
    scheduledEndAt: at(end),
    scheduledStartAt: at(start),
    status,
  };
};

const visits = [
  visit("hoy", "godoy", TODAY, ["09:00", "11:00"], []),
  visit("ayer", "godoy", "2026-11-24", ["09:00", "11:00"], []),
  visit("semana", "esquin", "2026-11-18", ["09:00", "12:00"], [ana]),
  visit("mes", "esquin", "2026-10-26", ["09:00", "12:00"], [ana], { rule: false }),
  visit("vieja", "godoy", "2026-08-01", ["13:00", "15:00"], [lucia]),
  // No son pendientes: registrada, cancelada, de mañana.
  visit("registrada", "esquin", "2026-11-20", ["09:00", "12:00"], [ana], { actual: true }),
  visit("cancelada", "godoy", "2026-11-21", ["09:00", "11:00"], [], { status: "CANCELED" }),
  visit("manana", "godoy", "2026-11-26", ["09:00", "11:00"], []),
  // 23:30 del 25 en Montevideo ya es 26 en UTC: sigue siendo de hoy.
  visit("noche", "esquin", TODAY, ["23:00", "23:30"], [ana]),
];

const pending = getPendingVisits(visits, TODAY);
assert.deepEqual(pending.map((item) => item.id), ["noche", "hoy", "ayer", "semana", "mes", "vieja"]);

const summary = summarizePendingVisits(pending, TODAY);
assert.deepEqual(summary.ages, { month: 1, old: 1, today: 2, week: 2 });
assert.equal(summary.total, 6);
assert.equal(summary.unassigned, 2);
assert.equal(summary.fromRules, 5);
assert.equal(summary.oldestDayKey, "2026-08-01");
assert.equal(summary.jobCount, 2);
assert.deepEqual(summary.topJobs.map((job) => `${job.jobId}:${job.count}`), ["esquin:3", "godoy:3"]);

assert.equal(getPendingAlertTone(summary), "overdue");
assert.equal(getPendingAlertTone(summarizePendingVisits(pending.slice(0, 2), TODAY)), "today");
assert.equal(getPendingAlertTone(summarizePendingVisits([], TODAY)), "clear");

assert.equal(formatPendingAge(0), "Hoy");
assert.equal(formatPendingAge(1), "Hace 1 día");
assert.equal(formatPendingAge(116), "Hace 116 días");

// Filtros: antiguedad, sin equipo, una empleada y busqueda sin tildes.
const filter = (changes: object) =>
  filterPendingVisits(pending, { age: "all", search: "", team: "all", ...changes }, TODAY).map((item) => item.id);
assert.deepEqual(filter({ age: "today" }), ["noche", "hoy"]);
assert.deepEqual(filter({ age: "old" }), ["vieja"]);
assert.deepEqual(filter({ team: "none" }), ["hoy", "ayer"]);
assert.deepEqual(filter({ team: "lucia" }), ["vieja"]);
assert.deepEqual(filter({ search: "esquin" }), ["noche", "semana", "mes"]);

// Grupos: mas pendientes primero, empate por nombre; la mas reciente arriba.
const groups = groupPendingByJob(pending);
assert.deepEqual(groups.map((group) => group.jobId), ["esquin", "godoy"]);
assert.deepEqual(groups[1].visits.map((item) => item.id), ["hoy", "ayer", "vieja"]);
assert.equal(groups[1].meta, "Mar, mié, sáb · 09:00 – 11:00 · Lucía · algunas sin equipo");

// Por dia dentro de un trabajo: Godoy cae martes (ayer), miercoles (hoy) y
// sabado (1 de agosto), en ese orden.
assert.deepEqual(
  getPendingWeekdays(groups[1].visits).map((day) => `${day.label}:${day.ids.join("+")}`),
  ["Mar:ayer", "Mié:hoy", "Sáb:vieja"]
);
assert.deepEqual(getPendingWeekdays([]), []);

assert.equal(formatWeekdays([1, 2, 3, 4, 5, 6]), "Lun a sáb");
assert.equal(formatWeekdays([2, 2]), "Mar");
assert.equal(formatWeekdays([1, 3, 5]), "Lun, mié, vie");
assert.equal(formatWeekdays([1, 2, 3, 4, 5, 6, 7]), "Todos los días");

assert.deepEqual(describePendingSelection(pending.filter((item) => item.jobId === "godoy")), {
  count: 3,
  jobs: 1,
  unassigned: 2,
});

// Estado en la agenda de Inicio a las 10:30 de hoy.
const at1030 = { nowMinute: 10 * 60 + 30, todayKey: TODAY };
const today = visit("a", "esquin", TODAY, ["09:00", "10:00"], [ana]);
assert.equal(getHomeVisitState(today, at1030), "ended");
assert.equal(getHomeVisitState(visit("b", "esquin", TODAY, ["10:00", "12:00"], [ana]), at1030), "ongoing");
assert.equal(getHomeVisitState(visit("c", "esquin", TODAY, ["14:00", "17:00"], [ana]), at1030), "upcoming");
assert.equal(getHomeVisitState(visit("d", "godoy", TODAY, ["09:00", "11:00"], []), at1030), "unassigned");
assert.equal(getHomeVisitState(visit("e", "esquin", TODAY, ["09:00", "10:00"], [ana], { status: "DONE" }), at1030), "done");
assert.equal(getHomeVisitState(visit("f", "esquin", TODAY, ["09:00", "10:00"], [ana], { status: "SKIPPED" }), at1030), "off");
assert.equal(getHomeVisitState(today, { nowMinute: null, todayKey: TODAY }), "upcoming");

// Semana: cruces de la misma empleada, horas y quien no tiene visitas.
const week = [
  visit("w1", "esquin", TODAY, ["09:00", "12:00"], [ana]),
  visit("w2", "godoy", TODAY, ["11:00", "13:00"], [ana]),
  visit("w3", "godoy", "2026-11-26", ["09:00", "11:00"], []),
  visit("w4", "godoy", "2026-11-24", ["11:00", "13:00"], [ana], { status: "CANCELED" }),
];
assert.equal(countWeekOverlaps(week), 1);
const homeWeek = summarizeHomeWeek({ employees: [ana, lucia], todayKey: TODAY, visits: week });
assert.equal(homeWeek.total, 3);
assert.deepEqual(homeWeek.unassigned.map((item) => item.id), ["w3"]);
assert.equal(homeWeek.unassignedToday.length, 0);
assert.deepEqual(homeWeek.today.map((load) => `${load.id}:${load.todayMinutes}:${load.jobs.length}`), ["ana:300:2"]);
assert.deepEqual(homeWeek.idle.map((load) => load.id), ["lucia"]);

// Acciones en lote: eliminar entra (archiva), asignar pide empleada, sin repetidas.
const id = "ckabcdefghijklmnopqrstuvw";
assert.ok(ResolvePendingVisitsSchema.safeParse({ action: "DELETE", occurrenceIds: [id] }).success);
assert.ok(!ResolvePendingVisitsSchema.safeParse({ action: "ASSIGN", occurrenceIds: [id] }).success);
assert.ok(!ResolvePendingVisitsSchema.safeParse({ action: "SKIPPED", occurrenceIds: [id, id] }).success);
assert.ok(!ResolvePendingVisitsSchema.safeParse({ action: "BORRAR", occurrenceIds: [id] }).success);

console.log("check:pending-visits OK");
