import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { toVisitsView } from "@/components/ops/visits/hooks/use-visits-desk";

// Pagina de Visitas (feature 26, diseño 3a-2a). CRLF normalizado.
const read = (file: string) => readFileSync(file, "utf8").replace(/\r\n/g, "\n");

// --- Views: Agenda, Dia por empleada y Cronograma. The views saved before
// the redesign still open something sensible; anything else falls back to
// Agenda.
assert.equal(toVisitsView("agenda"), "agenda");
assert.equal(toVisitsView("dia"), "dia");
assert.equal(toVisitsView("cron"), "cron");
assert.equal(toVisitsView("calendar"), "agenda");
assert.equal(toVisitsView("list"), "agenda");
assert.equal(toVisitsView("cards"), "agenda");
assert.equal(toVisitsView("schedule"), "cron");
assert.equal(toVisitsView(undefined), "agenda");
assert.equal(toVisitsView("tarjetas"), "agenda");

const toggle = read("components/ops/visits/visits-view-toggle.tsx");
const labels = [...toggle.matchAll(/label: "([^"]+)", value: "([^"]+)"/g)].map(([, label, value]) => `${value}:${label}`);
assert.deepEqual(labels, [
  "agenda:Agenda", "dia:Día por empleada", "cron:Cronograma",
  "agenda:Agenda", "cron:Cronograma",
], "Desktop has three views and the phone two");

// --- The day: loading first, then a failed month (paused query without data)
// as a retryable error, and only then an empty day.
const controller = read("components/ops/visits/hooks/use-visits-controller.ts");
assert.match(controller, /const failed = !data\.isLoading && !data\.hasData;/);
assert.match(controller, /data\.isLoading\n\s+\? "loading"\n\s+: failed\n\s+\? "error"/);
const states = read("components/ops/visits/visit-day-states.tsx");
assert.match(states, /<VisitDayError isRetrying=\{ctrl\.data\.isFetching\} onRetry=/);
const stateView = read("components/ops/visits/visit-day-state.tsx");
assert.match(stateView, /disabled=\{isRetrying\}/);
assert.match(stateView, /"Reintentar"/);

const hook = read("components/ops/hooks/useJobOccurrences.tsx");
assert.match(hook, /hasData: occurrencesQuery\.data !== undefined/);

// --- Register and assign are partial updates of the visit.
const actions = read("components/ops/visits/hooks/use-visit-actions.ts");
assert.match(actions, /values: \{ employeeIds: \[employee\.id\] \}/);
assert.match(actions, /actualStartAt: isDone \? getDayKeyInstant\(dayKey, registration\.startMinute\) : null/);

// --- Only one layout is mounted once the panel is measured, so the phone
// sheets never open over the desktop panel.
const page = read("components/ops/visits/visits-page.tsx");
assert.match(page, /\{wide !== false \? \(/);
assert.match(page, /\{wide !== true \? \(/);
assert.match(page, /<VisitsMobile ctrl=\{ctrl\} enabled=\{wide === false\} \/>/);

console.log("check:visits-view OK");
