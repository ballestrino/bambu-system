import "server-only";

import type { OccurrenceStatus } from "@prisma/client";

import { opsOccurrenceInclude } from "@/data/ops/includes";
import { visibleOccurrenceWhere } from "@/data/ops/shared";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";

// Visitas en modo solo lectura: el agente lee solo lo que ya existe. Las
// visitas se generan a mano (Generar visitas), así que ninguna
// lectura escribe filas.
export const getAgentOccurrences = async ({
  start,
  end,
  statuses,
  jobId,
  employeeId,
  take,
}: {
  start: Date;
  end: Date;
  statuses?: OccurrenceStatus[];
  jobId?: string;
  employeeId?: string;
  take?: number;
}) => {
  await requireAdminSession();

  return db.jobOccurrence.findMany({
    where: {
      ...visibleOccurrenceWhere,
      jobId,
      employees: employeeId ? { some: { employeeId } } : undefined,
      status: statuses?.length ? { in: statuses } : undefined,
      scheduledStartAt: { gte: start, lte: end },
    },
    include: opsOccurrenceInclude,
    orderBy: [{ scheduledStartAt: "asc" }],
    take,
  });
};

// Una visita para proponer cambiarla o eliminarla, archivada o no: la tool
// decide qué hacer con una archivada.
export const getAgentOccurrence = async (id: string) => {
  await requireAdminSession();

  return db.jobOccurrence.findUnique({ where: { id }, include: opsOccurrenceInclude });
};

// Lo que miran las precondiciones al confirmar: si sigue viva, su updatedAt y
// su equipo guardado.
export const getAgentVisitState = async (id: string) => {
  await requireAdminSession();

  const visit = await db.jobOccurrence.findUnique({
    where: { id },
    select: { archivedAt: true, updatedAt: true, employees: { select: { employeeId: true } } },
  });
  return visit
    ? { ...visit, employeeIds: visit.employees.map((assignment) => assignment.employeeId) }
    : null;
};

// Otras visitas programadas o realizadas de esas empleadas que se cruzan con
// el horario: la tarjeta avisa, no bloquea.
export const getAgentVisitOverlaps = async ({
  employeeIds,
  start,
  end,
  excludeId,
}: {
  employeeIds: string[];
  start: Date;
  end: Date;
  excludeId: string;
}) => {
  await requireAdminSession();
  if (!employeeIds.length) return [];

  const visits = await db.jobOccurrence.findMany({
    where: {
      archivedAt: null,
      id: { not: excludeId },
      status: { in: ["SCHEDULED", "DONE"] },
      employees: { some: { employeeId: { in: employeeIds } } },
      scheduledStartAt: { lt: end },
      scheduledEndAt: { gt: start },
    },
    select: {
      job: { select: { name: true } },
      scheduledStartAt: true,
      scheduledEndAt: true,
      employees: { select: { employee: { select: { id: true, name: true } } } },
    },
    orderBy: { scheduledStartAt: "asc" },
    take: 5,
  });
  return visits.map((visit) => ({
    job: visit.job.name,
    start: visit.scheduledStartAt,
    end: visit.scheduledEndAt,
    employees: visit.employees
      .map(({ employee }) => employee)
      .filter((employee) => employeeIds.includes(employee.id))
      .map((employee) => employee.name),
  }));
};
