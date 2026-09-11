import type { OccurrenceStatus } from "@prisma/client";

export type ScheduleVisit = {
  address: string;
  displayName: string;
  endLabel: string;
  // Minutos desde la medianoche local del dia en que arranca la visita. Una
  // visita nocturna termina despues de 1440 y conserva asi su duracion.
  endMinute: number;
  id: string;
  jobId: string;
  jobName: string;
  startAt: string;
  startLabel: string;
  startMinute: number;
  status: OccurrenceStatus;
  teammates: string[];
};

export type ScheduleDay = {
  dateKey: string;
  dayLabel: string;
  longLabel: string;
  visits: ScheduleVisit[];
  weekdayLabel: string;
  weekdayNumber: number;
};

export type ScheduleEmployee = {
  days: ScheduleDay[];
  id: string;
  name: string;
  totalVisits: number;
};

export type WeeklySchedule = {
  employees: ScheduleEmployee[];
  generatedAtLabel: string;
  unassigned: ScheduleDay[];
  weekEndKey: string;
  weekLabel: string;
  weekStartKey: string;
};

// Forma minima que necesita el cronograma. OpsOccurrence la cumple, y las
// fechas llegan como string cuando el DTO cruza una server action.
export type ScheduleOccurrenceRow = {
  employees: { employee: { id: string; name: string } | null }[];
  id: string;
  job: {
    id: string;
    name: string;
    scheduleName?: string | null;
    serviceAddress?: string | null;
    serviceLocation?: string | null;
  };
  jobId: string;
  scheduleLabel?: string | null;
  scheduledEndAt: Date | string;
  scheduledStartAt: Date | string;
  status: OccurrenceStatus;
};

// El nombre que ve la empleada: la excepcion de la visita gana sobre el alias
// del trabajo, y el nombre interno queda como ultimo recurso.
export const getScheduleDisplayName = (occurrence: ScheduleOccurrenceRow) =>
  occurrence.scheduleLabel?.trim() ||
  occurrence.job.scheduleName?.trim() ||
  occurrence.job.name;
