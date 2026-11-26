import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  classifyRuleVisit,
  countCleanup,
  dayStartUtc,
  getAdjustedRuleDates,
  getCleanupWindow,
  isDeletableRuleVisit,
} from "../lib/ops/schedule-rule-cleanup-window";
import { formToRuleValues, generateRangeFor, newRuleForm, ruleFormError, ruleToForm } from "../components/ops/schedule-rules/rule-form-model";
import { buildStripWeeks, defaultCutIndex, getCutDate, STRIP_CURRENT_INDEX } from "../components/ops/schedule-rules/rule-week-strip-model";
import {
  countJobsByWeekday,
  getJobWarnings,
  matchesBoardFilter,
  ruleDaysLabel,
  type BoardJob,
  type BoardRule,
} from "../components/ops/schedule-rules/schedule-rules-model";
import { ScheduleRuleCleanupSchema } from "../schemas/ops/schedule-rule-board";

// Vista de reglas de calendario (feature 73). Montevideo es UTC-3: las horas se
// arman en UTC para no depender de la zona de la máquina.
const TODAY = "2026-11-26";
const rule = (id: string, patch: Partial<BoardRule> = {}): BoardRule => ({
  dayOfMonth: null, durationMinutes: 180, endKey: null, frequency: "WEEKLY", id, interval: 1,
  jobId: "job", startKey: "2026-09-01", startTimeMinutes: 480, weekdays: [1, 3, 5], ...patch,
});
const job = (rules: BoardRule[]): BoardJob => ({ id: "job", name: "Godoy", rules, serviceAddress: null, status: "ACTIVE" });
type Status = "SCHEDULED" | "DONE" | "SKIPPED" | "CANCELED";
const visit = (id: string, utc: string, status: Status = "SCHEDULED", extra: { actual?: boolean; entries?: number } = {}) => ({
  actualEndAt: extra.actual ? utc : null, actualStartAt: extra.actual ? utc : null, id,
  scheduledStartAt: utc, status, timeEntryCount: extra.entries ?? 0,
});

// Solo se borra lo que nunca pasó.
assert.equal(isDeletableRuleVisit(visit("a", "2026-11-30T11:00:00Z")), true);
assert.equal(isDeletableRuleVisit(visit("b", "2026-11-30T11:00:00Z", "DONE", { actual: true })), false);
assert.equal(isDeletableRuleVisit(visit("c", "2026-11-30T11:00:00Z", "SKIPPED")), false);
assert.equal(isDeletableRuleVisit(visit("d", "2026-11-30T11:00:00Z", "SCHEDULED", { entries: 1 })), false);
assert.equal(isDeletableRuleVisit(visit("e", "2026-11-30T11:00:00Z", "SCHEDULED", { actual: true })), false);

// Pendiente = programada de antes de hoy en Montevideo (01:00 UTC del 26 es el 25).
assert.equal(classifyRuleVisit(visit("p", "2026-11-26T01:00:00Z"), TODAY), "pending");
assert.equal(classifyRuleVisit(visit("f", "2026-11-26T11:00:00Z"), TODAY), "future");
assert.equal(classifyRuleVisit(visit("o", "2026-11-20T11:00:00Z", "CANCELED"), TODAY), "off");

// El corte es un día de Montevideo: 00:00 local = 03:00 UTC.
assert.equal(dayStartUtc("2026-11-30").toISOString(), "2026-11-30T03:00:00.000Z");
assert.equal(getCleanupWindow("FORWARD", "2026-11-30").gte?.toISOString(), "2026-11-30T03:00:00.000Z");
assert.equal(getCleanupWindow("BACK", "2026-11-29").lte?.toISOString(), "2026-11-30T02:59:59.999Z");

const visits = [
  visit("done", "2026-11-16T11:00:00Z", "DONE", { actual: true }),
  visit("pend", "2026-11-18T11:00:00Z"),
  visit("edited", "2026-11-20T11:00:00Z", "SCHEDULED", { entries: 2 }),
  visit("fut1", "2026-11-30T11:00:00Z"),
  visit("fut2", "2027-03-01T11:00:00Z"),
];
assert.deepEqual(countCleanup(visits, "FORWARD", "2026-11-30", TODAY), { deletable: 2, future: 2, kept: 0, pending: 0 });
assert.deepEqual(countCleanup(visits, "BACK", "2026-11-22", TODAY), { deletable: 1, future: 0, kept: 2, pending: 1 });

// Ajustar la regla: termina el día anterior o empieza el siguiente; inválido si se da vuelta.
assert.deepEqual(getAdjustedRuleDates("FORWARD", "2026-11-30", { endKey: null, startKey: "2026-09-01" }), { endKey: "2026-11-29", startKey: "2026-09-01", valid: true });
assert.deepEqual(getAdjustedRuleDates("BACK", "2026-11-29", { endKey: null, startKey: "2026-09-01" }), { endKey: null, startKey: "2026-11-30", valid: true });
assert.equal(getAdjustedRuleDates("FORWARD", "2026-08-31", { endKey: null, startKey: "2026-09-01" }).valid, false);
assert.equal(getAdjustedRuleDates("BACK", "2026-12-31", { endKey: "2026-12-18", startKey: "2026-09-01" }).valid, false);

// Avisos: sin horario, cruces el mismo día y vencidos.
assert.deepEqual(getJobWarnings(job([]), TODAY).list.map((item) => item.text), ["Sin horario"]);
const crossed = getJobWarnings(job([rule("t1", { weekdays: [1, 4], startTimeMinutes: 540, durationMinutes: 120 }), rule("t2", { weekdays: [1], startTimeMinutes: 570, durationMinutes: 90 })]), TODAY);
assert.deepEqual(crossed.list, [{ ruleId: "t2", text: "Dos horarios se cruzan el lunes" }]);
assert.deepEqual([...crossed.flagged].sort(), ["t1", "t2"]);
assert.equal(getJobWarnings(job([rule("a"), rule("b", { startTimeMinutes: 900 })]), TODAY).list.length, 0);
assert.equal(getJobWarnings(job([rule("a"), rule("b", { startKey: "2027-01-01" })]), TODAY).list.length, 1);
assert.equal(getJobWarnings(job([rule("a", { endKey: "2026-10-31" }), rule("b")]), TODAY).list[0].text, "Un horario venció el 31 oct");
assert.equal(matchesBoardFilter(job([]), getJobWarnings(job([]), TODAY).list, "warn"), false);
assert.equal(matchesBoardFilter(job([]), getJobWarnings(job([]), TODAY).list, "none"), true);
assert.deepEqual(countJobsByWeekday([job([rule("a")])], TODAY), [1, 0, 1, 0, 1, 0, 0]);

// Etiquetas.
assert.equal(ruleDaysLabel(rule("a", { weekdays: [1, 2, 3, 4, 5] })), "Lunes a viernes");
assert.equal(ruleDaysLabel(rule("a", { interval: 2, weekdays: [2] })), "Mar · cada 2 semanas");
assert.equal(ruleDaysLabel(rule("a", { dayOfMonth: 15, frequency: "MONTHLY" })), "Día 15 de cada mes");

// Tira: 16 semanas, la actual marcada como "hoy"; el corte por defecto.
const weeks = buildStripWeeks(TODAY, visits, "FORWARD", defaultCutIndex("FORWARD"));
assert.equal(weeks.length, 16);
assert.equal(weeks[STRIP_CURRENT_INDEX].mondayKey, "2026-11-23");
assert.equal(weeks[STRIP_CURRENT_INDEX].top, "hoy");
assert.equal(getCutDate(TODAY, "FORWARD", STRIP_CURRENT_INDEX + 1), "2026-11-30");
assert.equal(getCutDate(TODAY, "BACK", STRIP_CURRENT_INDEX - 1), "2026-11-22");
assert.deepEqual(weeks[8].dots.map((dot) => [dot.id, dot.inside, dot.deletable]), [["fut1", true, true]]);
assert.equal(weeks[STRIP_CURRENT_INDEX].inside, false);

// Formulario.
const form = newRuleForm("WEEKLY", 3, TODAY);
assert.equal(ruleFormError(form), "");
assert.equal(ruleFormError({ ...form, weekdays: [] }), "Falta elegir al menos un día.");
assert.equal(ruleFormError({ ...form, end: "08:00" }), "La hora de salida tiene que ser después de la de entrada.");
assert.equal(ruleFormError({ ...form, endKey: "2026-01-01" }), "La fecha final no puede ser anterior a la inicial.");
assert.equal(ruleFormError({ ...form, interval: "0" }), "La repetición tiene que ser un número entero desde 1.");
const values = formToRuleValues({ ...form, weekdays: [5, 1] });
assert.deepEqual(values.weekdays, [1, 5]);
assert.equal(values.durationMinutes, 120);
assert.equal(values.startDate.toISOString(), "2026-11-26T03:00:00.000Z");
assert.equal(values.dayOfMonth, null);
assert.deepEqual(generateRangeFor(form, TODAY), { endDate: "2026-12-31", startDate: TODAY });
assert.deepEqual(generateRangeFor({ ...form, endKey: "2026-12-10" }, TODAY), { endDate: "2026-12-10", startDate: TODAY });
assert.equal(ruleToForm(rule("a"), TODAY).end, "11:00");

// Esquema y servidor.
assert.equal(ScheduleRuleCleanupSchema.parse({ cutDate: "2026-11-30", direction: "FORWARD", scheduleRuleId: "cmh0000000000000000000000" }).adjustRule, false);
assert.equal(ScheduleRuleCleanupSchema.safeParse({ cutDate: "30/11", direction: "FORWARD", scheduleRuleId: "cmh0000000000000000000000" }).success, false);
const actions = readFileSync("actions/ops/schedule-rule-board.ts", "utf8");
assert.equal((actions.match(/requireAdminSession\(\)/g) ?? []).length, 3, "cada acción pide sesión de admin");
const cleanupSource = readFileSync("lib/ops/schedule-rule-cleanup.ts", "utf8");
assert.match(cleanupSource, /\$transaction\(async/, "la limpieza va en una transacción");
assert.match(cleanupSource, /timeEntries: \{ none: \{\} \}/, "no toca visitas con horas");

console.log("check:schedule-rules-board OK");
