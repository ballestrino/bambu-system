import "server-only";

import { visibleOccurrenceWhere } from "@/data/ops/shared";
import { db } from "@/lib/db";
import { ensureJobOccurrencesForRange } from "@/lib/ops/job-occurrence-generator";
import { buildWeeklySchedule } from "@/lib/ops/schedule-mapper";
import { getScheduleWeek, parseScheduleWeekParam } from "@/lib/ops/schedule-week";
import { requireAdminSession } from "@/lib/require-admin-session";
import { WeeklyScheduleFiltersSchema } from "@/schemas/ops";

export const getWeeklySchedule = async (input?: unknown) => {
  try {
    const session = await requireAdminSession();

    const parsed = WeeklyScheduleFiltersSchema.safeParse(input ?? {});
    if (!parsed.success) {
      return { error: "Semana de cronograma invalida" };
    }

    const week = getScheduleWeek(parseScheduleWeekParam(parsed.data.weekStart));

    // Materializa las visitas recurrentes de la semana pedida: sin esto, una
    // semana futura llega vacia porque las ocurrencias aun no existen.
    await ensureJobOccurrencesForRange({
      rangeEnd: week.end,
      rangeStart: week.start,
      userId: session.user.id,
    });

    const [employees, occurrences] = await Promise.all([
      db.employee.findMany({
        where: { archivedAt: null, isActive: true },
        orderBy: [{ name: "asc" }],
        select: { id: true, name: true },
      }),
      db.jobOccurrence.findMany({
        where: {
          ...visibleOccurrenceWhere,
          scheduledStartAt: { gte: week.start, lte: week.end },
        },
        orderBy: [{ scheduledStartAt: "asc" }],
        select: {
          id: true,
          jobId: true,
          scheduledStartAt: true,
          scheduledEndAt: true,
          status: true,
          job: {
            select: {
              id: true,
              name: true,
              serviceAddress: true,
              serviceLocation: true,
            },
          },
          employees: {
            select: { employee: { select: { id: true, name: true } } },
          },
        },
      }),
    ]);

    return {
      schedule: buildWeeklySchedule({
        employees,
        generatedAt: new Date(),
        occurrences,
        week,
      }),
    };
  } catch (error) {
    console.error("Error getting weekly schedule:", error);
    return { error: "Error al obtener el cronograma semanal" };
  }
};
