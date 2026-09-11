import assert from "node:assert/strict";

import { formatMinuteOfDay, parseMinuteOfDay } from "../lib/ops/minute-ranges";
import {
  DEFAULT_AVAILABILITY_WINDOW,
  formatAvailabilityWeekdays,
  getAvailabilityWindows,
} from "../lib/ops/schedule-availability";
import { findScheduleGaps, getDayGaps } from "../lib/ops/schedule-gaps";
import { buildFixtureSchedule } from "./schedule-fixture";
import {
  availabilityRule as rule,
  H,
  scheduleDay,
  scheduleVisit as visit,
} from "./schedule-availability-fixture";

const defaultWindows = getAvailabilityWindows([], 1);

// Sin reglas, la ventana por defecto: nadie busca huecos a las 03:00.
assert.deepEqual(defaultWindows, [{ ...DEFAULT_AVAILABILITY_WINDOW }]);

// Una regla AVAILABLE reemplaza la jornada por defecto de ese dia.
const morningOnly = [
  rule({ endMinute: H(13), kind: "AVAILABLE", startMinute: H(8), weekdays: [1] }),
];
assert.deepEqual(getAvailabilityWindows(morningOnly, 1), [
  { endMinute: H(13), startMinute: H(8) },
]);
assert.deepEqual(
  getAvailabilityWindows(morningOnly, 2),
  [{ ...DEFAULT_AVAILABILITY_WINDOW }],
  "la regla de un dia no toca al resto de la semana"
);

// Una regla UNAVAILABLE parte la jornada en dos tramos.
assert.deepEqual(getAvailabilityWindows([rule({ endMinute: H(14), startMinute: H(12) })], 3), [
  { endMinute: H(12), startMinute: H(8) },
  { endMinute: H(18), startMinute: H(14) },
]);

// Un dia entero bloqueado no deja ventana: la celda queda marcada y no ofrece
// huecos.
assert.deepEqual(
  getAvailabilityWindows([rule({ endMinute: 24 * 60, startMinute: 0, weekdays: [5] })], 5),
  []
);

// Combinadas: solo de manana y ademas sin el primer tramo.
assert.deepEqual(
  getAvailabilityWindows(
    [
      rule({ endMinute: H(13), kind: "AVAILABLE", startMinute: H(8) }),
      rule({ endMinute: H(10), startMinute: H(8) }),
    ],
    2
  ),
  [{ endMinute: H(13), startMinute: H(10) }]
);

assert.equal(formatAvailabilityWeekdays([]), "Todos los días");
assert.equal(formatAvailabilityWeekdays([1, 2, 3, 4, 5, 6, 7]), "Todos los días");
assert.equal(formatAvailabilityWeekdays([3, 1]), "Lun, Mié");
assert.equal(parseMinuteOfDay("08:30"), 510);
assert.equal(parseMinuteOfDay("24:00"), 24 * 60);
assert.equal(parseMinuteOfDay("8"), null);
assert.equal(formatMinuteOfDay(1500), "01:00", "una visita nocturna vuelve al reloj");

// Huecos del dia: la jornada disponible menos lo que ya esta agendado.
const workday = scheduleDay([visit({ end: H(13), id: "a", start: H(9) })]);
assert.deepEqual(
  getDayGaps({ minimumMinutes: 60, visits: workday.visits, windows: defaultWindows }),
  [
    { endMinute: H(9), startMinute: H(8) },
    { endMinute: H(18), startMinute: H(13) },
  ]
);
assert.deepEqual(
  getDayGaps({ minimumMinutes: 120, visits: workday.visits, windows: defaultWindows }),
  [{ endMinute: H(18), startMinute: H(13) }],
  "el hueco de una hora no sirve para un servicio de dos"
);

// Sin la disponibilidad, la manana bloqueada seria un hueco falso.
assert.deepEqual(
  getDayGaps({
    minimumMinutes: 60,
    visits: workday.visits,
    windows: getAvailabilityWindows([rule({ endMinute: H(14), startMinute: 0 })], 1),
  }),
  [{ endMinute: H(18), startMinute: H(14) }]
);

// Una visita cancelada libera el tramo; la arrastrada tampoco se cuenta.
assert.deepEqual(
  getDayGaps({
    minimumMinutes: 60,
    visits: [visit({ end: H(13), id: "a", start: H(9), status: "CANCELED" })],
    windows: defaultWindows,
  }),
  [{ ...DEFAULT_AVAILABILITY_WINDOW }]
);
assert.deepEqual(
  getDayGaps({
    minimumMinutes: 60,
    skipVisitId: "a",
    visits: workday.visits,
    windows: defaultWindows,
  }),
  [{ ...DEFAULT_AVAILABILITY_WINDOW }]
);

// La busqueda semanal recorre a todo el equipo y respeta los dias visibles.
const schedule = buildFixtureSchedule();
const weekGaps = findScheduleGaps({
  employees: schedule.employees,
  minimumMinutes: 120,
  rules: [],
});
const mariaMonday = weekGaps.filter(
  (gap) => gap.employeeId === "e1" && gap.dateKey === "2026-09-14"
);
assert.deepEqual(
  mariaMonday.map((gap) => [gap.startMinute, gap.endMinute]),
  [[H(12), H(14)]],
  "entre las dos visitas del lunes queda una ventana de dos horas"
);
assert.equal(mariaMonday[0].employeeName, "María Núñez");
assert.equal(mariaMonday[0].dayLabel, "Lunes 14 de setiembre");
assert.equal(
  findScheduleGaps({
    employees: schedule.employees,
    minimumMinutes: 120,
    rules: [rule({ endMinute: 24 * 60, startMinute: 0, weekdays: [1] })],
  }).some((gap) => gap.employeeId === "e1" && gap.weekdayNumber === 1),
  false,
  "el lunes bloqueado no ofrece huecos"
);
assert.equal(
  findScheduleGaps({
    employees: schedule.employees,
    minimumMinutes: 120,
    rules: [],
    weekdays: [1, 2, 3, 4, 5],
  }).every((gap) => gap.weekdayNumber <= 5),
  true
);

console.log("Schedule availability checks passed");
