import type { OpsOccurrence } from "../components/ops/types";
import type { VisitEmployee } from "../lib/agent/visit-update-builder";
import type { ProposeUpdateVisitInput } from "../schemas/agent-visit-tools";

// Una visita de prueba: Oficina Centro, miércoles 14/10/2026 de 09:00 a 13:00
// en Montevideo (UTC-3), programada, con Ana. Los ids son cuid.
export const ANA = { id: "cana00000000001", name: "Ana" };
export const BEA = { id: "cbea00000000001", name: "Bea" };
export const DORA = { id: "cdora0000000001", name: "Dora" };
export const VISIT_ID = "cvisit000000001";
export const UPDATED_AT = new Date("2026-10-10T15:00:00.000Z");

export const roundTrip = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export const visit = (overrides: Record<string, unknown> = {}) =>
  ({
    id: VISIT_ID,
    jobId: "cjob00000000001",
    job: { id: "cjob00000000001", name: "Oficina Centro", status: "ACTIVE" },
    employees: [{ employeeId: ANA.id, employee: { ...ANA, isActive: true, archivedAt: null } }],
    scheduledStartAt: new Date("2026-10-14T12:00:00.000Z"),
    scheduledEndAt: new Date("2026-10-14T16:00:00.000Z"),
    actualStartAt: null,
    actualEndAt: null,
    status: "SCHEDULED",
    notes: null,
    scheduleLabel: null,
    scheduleRuleId: "crule0000000001",
    updatedAt: UPDATED_AT,
    archivedAt: null,
    ...overrides,
  }) as unknown as OpsOccurrence;

export const done = (overrides: Record<string, unknown> = {}) =>
  visit({
    status: "DONE",
    actualStartAt: new Date("2026-10-14T12:00:00.000Z"),
    actualEndAt: new Date("2026-10-14T16:00:00.000Z"),
    ...overrides,
  });

export const input = (overrides: Partial<ProposeUpdateVisitInput> = {}): ProposeUpdateVisitInput => ({
  occurrenceId: VISIT_ID,
  start: null,
  end: null,
  employeeIds: null,
  status: null,
  actualStart: null,
  actualEnd: null,
  notes: null,
  scheduleLabel: null,
  ...overrides,
});

export const employees: VisitEmployee[] = [
  { ...ANA, isActive: true, archivedAt: null },
  { ...BEA, isActive: false, archivedAt: null },
  { ...DORA, isActive: false, archivedAt: new Date("2026-09-01T00:00:00.000Z") },
];
