import assert from "node:assert/strict";

import {
  conversationActivity,
  conversationDayGroup,
  formatConversationTime,
  groupConversations,
  latestConversationId,
} from "../lib/agent/conversation-groups";

// Grupos y horas del historial del agente (feature 24). Lo usa
// check:agent-page. Las fechas se arman en la zona local, como las ve el
// navegador.
const at = (year: number, month: number, day: number, hour = 12, minute = 0) =>
  new Date(year, month - 1, day, hour, minute).toISOString();

const now = new Date(2026, 9, 8, 14, 40);
const conversation = (id: string, activity: string, extra: { pinnedAt?: string; updatedAt?: string } = {}) => ({
  id,
  pinnedAt: extra.pinnedAt ?? null,
  lastMessageAt: activity,
  createdAt: at(2026, 1, 1),
  updatedAt: extra.updatedAt ?? activity,
});

// --- Day groups: today from midnight, yesterday the day before, the rest
// older (also across a month boundary).
assert.equal(conversationDayGroup(at(2026, 10, 8, 0, 0), now), "today");
assert.equal(conversationDayGroup(at(2026, 10, 7, 23, 59), now), "yesterday");
assert.equal(conversationDayGroup(at(2026, 10, 7, 0, 0), now), "yesterday");
assert.equal(conversationDayGroup(at(2026, 10, 6, 23, 59), now), "older");
assert.equal(conversationDayGroup(at(2026, 9, 30, 20), new Date(2026, 9, 1, 9)), "yesterday");

// --- Activity: the last message, or the creation without messages.
assert.equal(conversationActivity({ ...conversation("a", at(2026, 10, 8)), lastMessageAt: null }), at(2026, 1, 1));

// --- Groups in order, empty ones hidden, newest first inside each; a pinned
// conversation leaves its day group.
const groups = groupConversations(
  [
    conversation("old", at(2026, 9, 21)),
    conversation("today-early", at(2026, 10, 8, 9)),
    conversation("pinned-old", at(2026, 9, 1), { pinnedAt: at(2026, 10, 8, 13) }),
    conversation("today-late", at(2026, 10, 8, 14, 32)),
    conversation("pinned-new", at(2026, 10, 7, 18), { pinnedAt: at(2026, 10, 2) }),
  ],
  now
);
assert.deepEqual(
  groups.map((group) => [group.label, group.items.map((item) => item.id)]),
  [
    ["Fijados", ["pinned-new", "pinned-old"]],
    ["Hoy", ["today-late", "today-early"]],
    ["Anteriores", ["old"]],
  ]
);
assert.deepEqual(groupConversations([], now), []);

// --- Time label: the hour today and yesterday, the date before, with the
// year only when it is another one.
assert.equal(formatConversationTime(at(2026, 10, 8, 14, 32), now), "14:32");
assert.equal(formatConversationTime(at(2026, 10, 7, 18, 15), now), "18:15");
assert.equal(formatConversationTime(at(2026, 10, 6, 9), now), "6 oct");
assert.equal(formatConversationTime(at(2025, 12, 30, 9), now), "30 dic 2025");

// --- The budget Sheet resumes the last touched one, not the first of the
// list (pinned ones come first).
assert.equal(
  latestConversationId([
    conversation("pinned", at(2026, 9, 1), { pinnedAt: at(2026, 10, 1) }),
    conversation("recent", at(2026, 10, 8)),
    conversation("older", at(2026, 10, 2)),
  ]),
  "recent"
);
assert.equal(latestConversationId([]), null);
