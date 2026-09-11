import assert from "node:assert/strict";

import { countDayOverlapPairs, getDayOverlaps } from "../lib/ops/schedule-conflicts";
import { buildScheduleMove, getMovedEmployeeIds } from "../lib/ops/schedule-move";
import { getDayWarnings } from "../lib/ops/schedule-warnings";
import {
  availabilityRule as rule,
  H,
  scheduleDay,
  scheduleVisit as visit,
} from "./schedule-availability-fixture";

// Cruces: dos visitas que se pisan avisan de los dos lados y cuentan un cruce.
const crossing = scheduleDay([
  visit({ end: H(12), id: "a", start: H(9) }),
  visit({ end: H(13), id: "b", start: H(11) }),
  visit({ end: H(19), id: "c", start: H(18) }),
]);
const overlaps = getDayOverlaps(crossing.visits);

assert.deepEqual(overlaps.get("a")?.map((item) => item.id), ["b"]);
assert.deepEqual(overlaps.get("b")?.map((item) => item.id), ["a"]);
assert.equal(overlaps.has("c"), false, "pegadas no es lo mismo que pisadas");
assert.equal(countDayOverlapPairs(crossing.visits), 1);
assert.equal(
  countDayOverlapPairs([
    visit({ end: H(12), id: "a", start: H(9) }),
    visit({ end: H(13), id: "b", start: H(11), status: "CANCELED" }),
  ]),
  0,
  "una visita cancelada no cruza"
);

// Avisos: el cruce siempre; el fuera de horario solo con reglas cargadas.
const withoutRules = getDayWarnings({ day: crossing, rules: [] });
assert.equal(withoutRules.get("a")?.length, 1);
assert.match(withoutRules.get("a")![0], /Se cruza con Visita b \(11:00 - 13:00\)/);
assert.equal(
  withoutRules.has("c"),
  false,
  "sin reglas, una visita de 18:00 no es un aviso"
);

const withRules = getDayWarnings({
  day: crossing,
  rules: [rule({ endMinute: H(13), kind: "AVAILABLE", startMinute: H(8) })],
});
assert.equal(withRules.get("c")?.length, 1);
assert.match(
  withRules.get("c")![0],
  /Fuera de la disponibilidad de la empleada \(08:00 - 13:00\)/
);
assert.equal(
  getDayWarnings({
    day: scheduleDay([visit({ end: H(19), id: "c", start: H(18), status: "CANCELED" })]),
    rules: [rule({ endMinute: H(13), kind: "AVAILABLE", startMinute: H(8) })],
  }).size,
  0,
  "una visita cancelada fuera de horario no avisa"
);
// Mover la tarjeta: reemplaza a la empleada arrastrada y deja al resto.
assert.deepEqual(getMovedEmployeeIds(["e1", "e2"], "e1", "e3"), ["e3", "e2"]);
assert.deepEqual(getMovedEmployeeIds(["e1", "e2"], "e1", "e2"), ["e2"], "no duplica");
assert.deepEqual(getMovedEmployeeIds(["e1"], "e1", null), [], "a sin asignar");
assert.deepEqual(getMovedEmployeeIds([], null, "e2"), ["e2"], "desde sin asignar");

const occurrence = {
  scheduledEndAt: new Date("2026-09-14T15:00:00.000Z"),
  scheduledStartAt: new Date("2026-09-14T11:00:00.000Z"),
};
const source = { employeeId: "e1", fromDateKey: "2026-09-14", visitId: "a" };

const movedDay = buildScheduleMove({
  currentEmployeeIds: ["e1", "e2"],
  occurrence,
  source,
  target: { dateKey: "2026-09-16", employeeId: "e3" },
});
assert.deepEqual(movedDay?.employeeIds, ["e3", "e2"]);
assert.equal(movedDay?.scheduledStartAt.toISOString(), "2026-09-16T11:00:00.000Z");
assert.equal(
  movedDay?.scheduledEndAt.toISOString(),
  "2026-09-16T15:00:00.000Z",
  "sin hueco elegido la hora local no cambia"
);

const movedSlot = buildScheduleMove({
  currentEmployeeIds: ["e1"],
  occurrence,
  source,
  target: { dateKey: "2026-09-16", employeeId: "e1", startMinute: H(14) },
});
assert.equal(movedSlot?.employeeIds, undefined, "sin cambio de equipo no toca las asignaciones");
assert.equal(movedSlot?.scheduledStartAt.toISOString(), "2026-09-16T17:00:00.000Z");
assert.equal(
  movedSlot?.scheduledEndAt.toISOString(),
  "2026-09-16T21:00:00.000Z",
  "la duracion se conserva"
);

assert.equal(
  buildScheduleMove({
    currentEmployeeIds: ["e1"],
    occurrence,
    source,
    target: { dateKey: "2026-09-14", employeeId: "e1" },
  }),
  null,
  "soltar en el mismo lugar no dispara una actualizacion"
);
assert.equal(
  buildScheduleMove({
    currentEmployeeIds: ["e1"],
    occurrence,
    source,
    target: { dateKey: "roto", employeeId: "e2" },
  }),
  null
);

console.log("Schedule move checks passed");
