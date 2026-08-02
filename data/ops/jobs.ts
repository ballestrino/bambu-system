import "server-only";

import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";
import {
  JobFiltersSchema,
  JobScheduleRuleFiltersSchema,
} from "@/schemas/ops";
import { buildDateTimeRange, opsAuditUserSelect } from "@/data/ops/shared";
import { Prisma } from "@prisma/client";

const getCurrentMonthRange = () => {
  const today = new Date();
  return {
    end: new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59),
    start: new Date(today.getFullYear(), today.getMonth(), 1),
  };
};

export const getJobs = async (filters?: unknown) => {
  try {
    await requireAdminSession();

    const parsedFilters = JobFiltersSchema.safeParse(filters ?? {});
    if (!parsedFilters.success) {
      return { error: "Filtros de trabajos invalidos" };
    }

    const {
      query,
      statuses,
      visibility,
      includeArchived,
      sourceBudgetId,
      sourceBudgetOptionId,
      startDate,
      endDate,
    } = parsedFilters.data;
    const currentMonth = getCurrentMonthRange();
    const visibilityFilter =
      visibility === "DEFAULT"
        ? {
            OR: [
              { jobType: "ONGOING" as const },
              {
                jobType: "PUNCTUAL" as const,
                punctualStartDate: { lte: currentMonth.end },
                punctualEndDate: { gte: currentMonth.start },
              },
            ],
          }
        : visibility === "PUNCTUAL"
          ? { jobType: "PUNCTUAL" as const }
          : {};
    const andFilters: Prisma.JobWhereInput[] = [
      ...(includeArchived ? [] : [{ status: { not: "ARCHIVED" as const } }]),
      ...(query
        ? [
            {
              OR: [
                { name: { contains: query, mode: "insensitive" as const } },
                { description: { contains: query, mode: "insensitive" as const } },
                { serviceAddress: { contains: query, mode: "insensitive" as const } },
                { serviceLocation: { contains: query, mode: "insensitive" as const } },
                { operationalNotes: { contains: query, mode: "insensitive" as const } },
              ],
            },
          ]
        : []),
    ];

    const where: Prisma.JobWhereInput = {
      ...visibilityFilter,
      archivedAt: includeArchived ? undefined : null,
      status: statuses?.length ? { in: statuses } : undefined,
      sourceBudgetId,
      sourceBudgetOptionId,
      createdAt: buildDateTimeRange(startDate, endDate),
      AND: andFilters.length ? andFilters : undefined,
    };

    const jobs = await db.job.findMany({
      where,
      include: {
        sourceBudget: {
          select: {
            id: true,
            slug: true,
            name: true,
          },
        },
        sourceBudgetOption: true,
        createdBy: {
          select: opsAuditUserSelect,
        },
        updatedBy: {
          select: opsAuditUserSelect,
        },
      },
      orderBy: [{ archivedAt: "asc" }, { updatedAt: "desc" }],
    });

    return { jobs };
  } catch (error) {
    console.error("Error getting jobs:", error);
    return { error: "Error al obtener los trabajos" };
  }
};

export const getJobById = async (id: string) => {
  try {
    await requireAdminSession();

    const job = await db.job.findUnique({
      where: { id },
      include: {
        sourceBudget: true,
        sourceBudgetOption: true,
        scheduleRules: true,
        occurrences: {
          include: {
            employees: {
              include: {
                employee: true,
              },
            },
          },
        },
        assignments: {
          include: {
            employee: true,
          },
        },
        clientPayments: true,
        timeEntries: true,
        createdBy: {
          select: opsAuditUserSelect,
        },
        updatedBy: {
          select: opsAuditUserSelect,
        },
      },
    });

    if (!job) {
      return { error: "Trabajo no encontrado" };
    }

    return { job };
  } catch (error) {
    console.error("Error getting job by id:", error);
    return { error: "Error al obtener el trabajo" };
  }
};

export const getJobScheduleRules = async (filters?: unknown) => {
  try {
    await requireAdminSession();

    const parsedFilters = JobScheduleRuleFiltersSchema.safeParse(filters ?? {});
    if (!parsedFilters.success) {
      return { error: "Filtros de reglas invalidos" };
    }

    const { jobId, isActive, frequencies, startDate, endDate } =
      parsedFilters.data;

    const scheduleRules = await db.jobScheduleRule.findMany({
      where: {
        jobId,
        isActive,
        frequency: frequencies?.length ? { in: frequencies } : undefined,
        startDate: buildDateTimeRange(startDate, endDate),
      },
      include: {
        job: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        createdBy: {
          select: opsAuditUserSelect,
        },
        updatedBy: {
          select: opsAuditUserSelect,
        },
      },
      orderBy: [{ isActive: "desc" }, { startDate: "asc" }],
    });

    return { scheduleRules };
  } catch (error) {
    console.error("Error getting job schedule rules:", error);
    return { error: "Error al obtener las reglas del calendario" };
  }
};
