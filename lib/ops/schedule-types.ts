import type { OccurrenceStatus } from "@prisma/client";

export type ScheduleVisit = {
  address: string;
  endLabel: string;
  id: string;
  jobId: string;
  jobName: string;
  startLabel: string;
  status: OccurrenceStatus;
  teammates: string[];
};

export type ScheduleDay = {
  dateKey: string;
  dayLabel: string;
  longLabel: string;
  visits: ScheduleVisit[];
  weekdayLabel: string;
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

export type ScheduleOccurrenceRow = {
  employees: { employee: { id: string; name: string } }[];
  id: string;
  job: {
    id: string;
    name: string;
    serviceAddress: string | null;
    serviceLocation: string | null;
  };
  jobId: string;
  scheduledEndAt: Date;
  scheduledStartAt: Date;
  status: OccurrenceStatus;
};
