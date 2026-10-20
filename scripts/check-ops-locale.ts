import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { useTodayKey } from "../components/ops/hooks/useTodayKey";
import { Calendar } from "../components/ui/calendar";
import { getDefaultDayKey } from "../lib/ops/visit-calendar";

// Operaciones habla es-UY: el documento, el calendario compartido y el día que
// Visitas selecciona solo. El calendario se renderiza de verdad (sin
// navegador); el resto se prueba con funciones puras. CRLF normalizado.
const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8").replace(/\r\n/g, "\n");
const englishCalendarText =
  /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|June|July|August|September|October|November|December|Today|Selected|Next Month|Previous Month)\b/;

// --- The document declares es-UY.
const layout = read("app/layout.tsx");
assert.match(layout, /<html lang="es-UY"/);
assert.doesNotMatch(layout, /lang="en"/);

// --- The shared Calendar: Spanish month, Monday first, Spanish labels.
const september = { month: new Date(2026, 8, 1), mode: "single", selected: new Date(2026, 8, 28), today: new Date(2026, 8, 15) } as const;
const html = renderToStaticMarkup(createElement(Calendar, september));
const weekdays = [...html.matchAll(/class="[^"]*rdp-weekday" scope="col">([^<]+)</g)].map((match) => match[1]);
assert.deepEqual(weekdays, ["lu", "ma", "mi", "ju", "vi", "sá", "do"], "la semana empieza el lunes");
assert.match(html, /role="status" aria-live="polite">septiembre 2026</);
assert.match(html, /aria-label="Ir al mes anterior"/);
assert.match(html, /aria-label="Ir al mes siguiente"/);
assert.match(html, /aria-label="Hoy, martes, 15 de septiembre de 2026"/);
assert.match(html, /aria-label="lunes, 28 de septiembre de 2026, seleccionado"/);
assert.doesNotMatch(html, englishCalendarText, "el calendario no muestra textos en inglés");

// The month dropdown follows the calendar's locale, not the runtime default.
const dropdown = renderToStaticMarkup(
  createElement(Calendar, { ...september, captionLayout: "dropdown", endMonth: new Date(2026, 11, 31), startMonth: new Date(2026, 0, 1) })
);
const months = [...dropdown.matchAll(/<option value="\d+"(?: selected="")?>([^<]+)<\/option>/g)].map((match) => match[1]);
assert.deepEqual(months.slice(0, 12), ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]);

// A caller can still choose another first day.
const sundayFirst = renderToStaticMarkup(createElement(Calendar, { ...september, weekStartsOn: 0 }));
assert.match(sundayFirst, /rdp-weekday" scope="col">do<\/th><th[^>]*>lu</);

// --- The day Visits selects until someone picks one.
const defaultDay = (year: number, month: number, todayKey: string | null) => getDefaultDayKey(year, month, todayKey);

assert.equal(defaultDay(2026, 9, "2026-09-28"), "2026-09-28", "el mes actual elige hoy");
assert.equal(defaultDay(2026, 9, "2026-09-01"), "2026-09-01");
assert.equal(defaultDay(2026, 9, "2026-09-30"), "2026-09-30");
assert.equal(defaultDay(2026, 10, "2026-09-28"), "2026-10-01", "otro mes elige su primer día");
assert.equal(defaultDay(2026, 8, "2026-09-28"), "2026-08-01");
assert.equal(defaultDay(2027, 9, "2026-09-28"), "2027-09-01", "el mismo mes de otro año no es el actual");
assert.equal(defaultDay(2027, 1, "2026-12-31"), "2027-01-01");
assert.equal(defaultDay(2028, 2, "2028-02-29"), "2028-02-29", "29 de febrero bisiesto");
assert.equal(defaultDay(2026, 9, null), "2026-09-01", "sin día conocido, el primero");

// The server render and the hydration pass cannot know the visitor's day.
const serverToday = renderToStaticMarkup(
  createElement(function Probe() {
    return createElement("span", null, String(useTodayKey()));
  })
);
assert.equal(serverToday, "<span>null</span>");

// --- Visits uses it, and the "Generar semana" presets come from the week shown.
const desk = read("components/ops/visits/hooks/use-visits-desk.ts");
assert.match(desk, /getDefaultDayKey\(year, monthNumber, todayKey\)/);
assert.match(desk, /useTodayKey\(\)/);
const toolbar = read("components/ops/schedules/schedule-toolbar.tsx");
assert.match(toolbar, /weekPreset\(weekStart, "Esta semana"\)/);
assert.match(toolbar, /untilMonthEndPreset\(weekStart, "De la semana a fin de mes"\)/);

console.log("check:ops-locale OK");
