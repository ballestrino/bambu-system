import "server-only";

import { db } from "@/lib/db";
import { assertOccurrenceEmployeesExist } from "@/lib/ops/job-occurrence-employees";
import { isPendingRegistration } from "@/lib/ops/pending-visits";
import { getVisitDayKey } from "@/lib/ops/visit-day";
import type { ResolvePendingVisitsInput } from "@/schemas/ops/pending-visits";

const countLabel = (count: number, one: string, many: string) => (count === 1 ? one : `${count} ${many}`);

// Escribe la resolucion de un lote de pendientes. Antes revisa que todas sigan
// pendientes (programadas, de hoy o de antes y sin horario real) y, para
// registrarlas como hechas, que tengan equipo. Si una falla no se toca ninguna.
export const resolvePendingVisitsInDb = async (
  { action, employeeId, occurrenceIds }: ResolvePendingVisitsInput,
  updatedById: string
) => {
  const todayKey = getVisitDayKey(new Date());
  const occurrences = await db.jobOccurrence.findMany({
    where: { id: { in: occurrenceIds } },
    select: {
      actualEndAt: true,
      actualStartAt: true,
      archivedAt: true,
      employees: { select: { employeeId: true } },
      id: true,
      job: { select: { archivedAt: true } },
      scheduledEndAt: true,
      scheduledStartAt: true,
      status: true,
    },
  });

  if (occurrences.length !== occurrenceIds.length) {
    return { error: "Alguna visita ya no existe: refrescá la lista" } as const;
  }

  const stale = occurrences.filter(
    (occurrence) => occurrence.archivedAt || occurrence.job.archivedAt || !isPendingRegistration(occurrence, todayKey)
  ).length;
  if (stale) {
    return {
      error: `${countLabel(stale, "Una visita ya no está pendiente", "visitas ya no están pendientes")}: refrescá la lista`,
    } as const;
  }

  if (action === "ASSIGN") {
    if (!employeeId) return { error: "Elegí una empleada" } as const;
    await assertOccurrenceEmployeesExist([employeeId]);
    await db.$transaction([
      db.jobOccurrenceEmployee.deleteMany({ where: { jobOccurrenceId: { in: occurrenceIds } } }),
      db.jobOccurrenceEmployee.createMany({
        data: occurrenceIds.map((jobOccurrenceId) => ({ employeeId, jobOccurrenceId })),
      }),
      db.jobOccurrence.updateMany({ where: { id: { in: occurrenceIds } }, data: { updatedById } }),
    ]);
    return { count: occurrenceIds.length } as const;
  }

  if (action === "DONE") {
    const withoutTeam = occurrences.filter((occurrence) => !occurrence.employees.length).length;
    if (withoutTeam) {
      return {
        error: `${countLabel(withoutTeam, "Una no tiene equipo", "no tienen equipo")}: asigná quién fue antes de registrarlas`,
      } as const;
    }

    // El horario programado pasa a ser el real: se corrige despues una por una.
    await db.$transaction(
      occurrences.map((occurrence) =>
        db.jobOccurrence.update({
          where: { id: occurrence.id },
          data: {
            actualEndAt: occurrence.scheduledEndAt,
            actualStartAt: occurrence.scheduledStartAt,
            status: "DONE",
            updatedById,
          },
          select: { id: true },
        })
      )
    );
    return { count: occurrenceIds.length } as const;
  }

  // Eliminar archiva, como "Eliminar visita": deja de verse y el cronograma no
  // la vuelve a generar, porque una visita archivada sigue ocupando su inicio.
  if (action === "DELETE") {
    const result = await db.jobOccurrence.updateMany({
      where: { archivedAt: null, id: { in: occurrenceIds } },
      data: { archivedAt: new Date(), updatedById },
    });
    return { count: result.count } as const;
  }

  // Omitidas y canceladas no llevan horario real, como al registrarlas una.
  const result = await db.jobOccurrence.updateMany({
    where: { id: { in: occurrenceIds }, status: "SCHEDULED" },
    data: { actualEndAt: null, actualStartAt: null, status: action, updatedById },
  });
  return { count: result.count } as const;
};
