import "server-only";

import { db } from "@/lib/db";
import { dayKeyOf } from "@/lib/ops/schedule-rule-cleanup-window";
import { findScheduleRuleVisits } from "@/lib/ops/schedule-rule-cleanup";
import { DEFAULT_OPS_TIMEZONE } from "@/lib/ops/timezone";
import { requireAdminSession } from "@/lib/require-admin-session";
import { ScheduleRuleVisitsSchema } from "@/schemas/ops/schedule-rule-board";

// Lo que lee la vista de reglas de calendario (feature 73): los trabajos en
// curso con sus reglas activas, con las fechas como días de Montevideo.
export const getScheduleRulesBoard = async () => {
  try {
    await requireAdminSession();

    const jobs = await db.job.findMany({
      where: {
        archivedAt: null,
        status: { notIn: ["ARCHIVED", "COMPLETED"] },
        OR: [{ jobType: "ONGOING" }, { scheduleRules: { some: { isActive: true } } }],
      },
      select: {
        id: true,
        jobType: true,
        name: true,
        scheduleRules: {
          where: { isActive: true },
          orderBy: { startTimeMinutes: "asc" },
          select: {
            dayOfMonth: true,
            durationMinutes: true,
            endDate: true,
            frequency: true,
            id: true,
            interval: true,
            startDate: true,
            startTimeMinutes: true,
            timezone: true,
            weekdays: true,
          },
        },
        serviceAddress: true,
        status: true,
      },
      orderBy: { name: "asc" },
    });

    return {
      jobs: jobs.map(({ scheduleRules, ...job }) => ({
        ...job,
        rules: scheduleRules.map(({ endDate, startDate, timezone, ...rule }) => ({
          ...rule,
          endKey: endDate ? dayKeyOf(endDate, timezone || DEFAULT_OPS_TIMEZONE) : null,
          jobId: job.id,
          startKey: dayKeyOf(startDate, timezone || DEFAULT_OPS_TIMEZONE),
        })),
      })),
    };
  } catch (error) {
    console.error("Error getting schedule rules board:", error);
    return { error: "No se pudieron leer las reglas de calendario" };
  }
};

export const getScheduleRuleVisits = async (input: unknown) => {
  try {
    await requireAdminSession();
    const parsed = ScheduleRuleVisitsSchema.safeParse(input);
    if (!parsed.success) return { error: "Rango inválido" };

    const visits = await findScheduleRuleVisits(parsed.data);
    return {
      visits: visits.map((visit) => ({
        ...visit,
        actualEndAt: visit.actualEndAt?.toISOString() ?? null,
        actualStartAt: visit.actualStartAt?.toISOString() ?? null,
        scheduledStartAt: visit.scheduledStartAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error("Error getting schedule rule visits:", error);
    return { error: "No se pudieron leer las visitas de la regla" };
  }
};

type BoardResult = Awaited<ReturnType<typeof getScheduleRulesBoard>>;
export type ScheduleBoardJob = NonNullable<BoardResult["jobs"]>[number];
export type ScheduleBoardRule = ScheduleBoardJob["rules"][number];
export type ScheduleRuleVisit = NonNullable<Awaited<ReturnType<typeof getScheduleRuleVisits>>["visits"]>[number];
