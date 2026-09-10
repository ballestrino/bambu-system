import { buildWeeklySchedule } from "../lib/ops/schedule-mapper";
import { getScheduleWeek, parseScheduleWeekParam } from "../lib/ops/schedule-week";
import type { ScheduleOccurrenceRow } from "../lib/ops/schedule-types";

export const fixtureEmployees = [
  { id: "e1", name: "María Núñez" },
  { id: "e2", name: "Ana Belén Rodríguez" },
  { id: "e3", name: "Lucía Fernández" },
];

export const fixtureWeek = getScheduleWeek(parseScheduleWeekParam("2026-09-14"));

// Las horas se declaran en UTC; Montevideo es UTC-3, asi que +3 equivale a la
// hora local que describe cada caso.
const visit = (input: {
  address?: string | null;
  day: number;
  hour: number;
  id: string;
  jobName: string;
  location?: string | null;
  staff: string[];
  status?: ScheduleOccurrenceRow["status"];
}): ScheduleOccurrenceRow => ({
  employees: input.staff.map((id) => ({
    employee: { id, name: fixtureEmployees.find((item) => item.id === id)!.name },
  })),
  id: input.id,
  job: {
    id: `job-${input.id}`,
    name: input.jobName,
    serviceAddress: input.address ?? null,
    serviceLocation: input.location ?? null,
  },
  jobId: `job-${input.id}`,
  scheduledEndAt: new Date(Date.UTC(2026, 8, 14 + input.day, input.hour + 3 + 4)),
  scheduledStartAt: new Date(Date.UTC(2026, 8, 14 + input.day, input.hour + 3)),
  status: input.status ?? "SCHEDULED",
});

export const fixtureOccurrences: ScheduleOccurrenceRow[] = [
  visit({ address: "Av. 18 de Julio 1234, apto 5", day: 0, hour: 8, id: "a", jobName: "Oficina Centro", staff: ["e1", "e2"] }),
  visit({ address: "Constituyente 2050 esquina Requena", day: 0, hour: 14, id: "b", jobName: "Local Cordón", staff: ["e1"] }),
  visit({ day: 1, hour: 9, id: "c", jobName: "Consultorio con un nombre bastante largo para forzar el ajuste", location: "Pocitos", staff: ["e1", "e2", "e3"] }),
  visit({ day: 3, hour: 7, id: "d", jobName: "Edificio Carrasco", address: "Av. Bolivia 1500, Torre B, subsuelo y planta baja", staff: ["e1"] }),
  visit({ day: 5, hour: 10, id: "e", jobName: "Showroom Ciudad Vieja", address: "Sarandí 450", staff: ["e2"] }),
  // 21:00 local es 00:00 UTC del dia siguiente: debe quedar en el domingo.
  visit({ address: "Bulevar Artigas 1825", day: 6, hour: 21, id: "f", jobName: "Turno noche Tres Cruces", staff: ["e1"] }),
  visit({ address: "Rivera 3200", day: 2, hour: 9, id: "g", jobName: "Visita cancelada", staff: ["e1"], status: "CANCELED" }),
  visit({ address: "Sin equipo 100", day: 4, hour: 9, id: "h", jobName: "Trabajo sin asignar", staff: [] }),
];

export const buildFixtureSchedule = () =>
  buildWeeklySchedule({
    employees: fixtureEmployees,
    generatedAt: new Date("2026-09-12T15:30:00.000Z"),
    occurrences: fixtureOccurrences,
    week: fixtureWeek,
  });
