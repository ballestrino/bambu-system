import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { isVisitView } from "@/components/ops/visits/visit-view-switcher";

const read = (file: string) => readFileSync(file, "utf8");

// --- Views: Calendario first and by default; Cards reads Tarjetas but the
// stored value stays "cards" so saved preferences keep working.
const switcher = read("components/ops/visits/visit-view-switcher.tsx");
const labels = [...switcher.matchAll(/label: "([^"]+)", value: "([^"]+)"/g)].map(
  ([, label, value]) => ({ label, value })
);

assert.deepEqual(
  labels,
  [
    { label: "Calendario", value: "calendar" },
    { label: "Cronograma", value: "schedule" },
    { label: "Lista", value: "list" },
    { label: "Tarjetas", value: "cards" },
  ],
  "Visit views changed order, label or stored value"
);
assert.ok(isVisitView("cards"), "A saved cards view is no longer valid");
assert.ok(!isVisitView("tarjetas"), "The label leaked into the stored value");

const page = read("components/ops/visits/visits-page.tsx");
assert.match(page, /defaultViewState = \{ view: "calendar" as VisitView \}/);
assert.match(page, /isVisitView\(viewState\.view\) \? viewState\.view : "calendar"/);

// --- Agenda: a failed month query shows a retryable error, never an empty day.
assert.match(page, /error=\{calendarQuery\.error\}/);
assert.match(page, /hasData=\{calendarQuery\.hasData\}/);
assert.match(page, /onRetry=\{\(\) => void calendarQuery\.refetch\(\)\}/);

const agenda = read("components/ops/calendar/calendar-agenda-panel.tsx");
// A paused query (offline, hidden tab) is pending but not loading: no data
// then means the month failed, not that the day is empty.
assert.match(agenda, /const failedToLoad = !isLoading && !hasData;/);
assert.match(page, /monthIsEmpty=\{calendarQuery\.hasData && /);
const loadingIndex = agenda.indexOf("{isLoading ? (");
const errorIndex = agenda.indexOf(") : failedToLoad ? (");
const emptyIndex = agenda.indexOf("<OpsEmptyState");
assert.ok(
  loadingIndex > -1 && loadingIndex < errorIndex && errorIndex < emptyIndex,
  "The agenda must check loading, then the error, before the empty day"
);
assert.match(agenda, /<CalendarAgendaError isRetrying=\{isRetrying\} onRetry=\{onRetry\} \/>/);
assert.match(agenda, /error && hasData \?/);

const hook = read("components/ops/hooks/useJobOccurrences.tsx");
assert.match(hook, /hasData: occurrencesQuery\.data !== undefined/);

const errorView = read("components/ops/calendar/calendar-agenda-error.tsx");
assert.match(errorView, /disabled=\{isRetrying\}/);
assert.match(errorView, /"Reintentar"/);

console.log("check:visits-view OK");
