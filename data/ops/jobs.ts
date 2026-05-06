import "server-only";

import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";
import {
  JobFiltersSchema,
  JobOccurrenceFiltersSchema,
  JobScheduleRuleFiltersSchema,
} from "@/schemas/ops";
import { buildDateTimeRange, opsAuditUserSelect } from "@/data/ops/shared";
import { Prisma } from "@prisma/client";

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
      includeArchived,
      sourceBudgetId,
      sourceBudgetOptionId,
      startDate,
      endDate,
    } = parsedFilters.data;

    const where: Prisma.JobWhereInput = {
      archivedAt: includeArchived ? undefined : null,
      status: statuses?.length ? { in: statuses } : undefined,
      sourceBudgetId,
      sourceBudgetOptionId,
      createdAt: buildDateTimeRange(startDate, endDate),
      OR: query
        ? [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { serviceAddress: { contains: query, mode: "insensitive" } },
            { serviceLocation: { contains: query, mode: "insensitive" } },
            { operationalNotes: { contains: query, mode: "insensitive" } },
          ]
        : undefined,
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
        occurrences: true,
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

export const getJobOccurrences = async (filters?: unknown) => {
  try {
    await requireAdminSession();

    const parsedFilters = JobOccurrenceFiltersSchema.safeParse(filters ?? {});
    if (!parsedFilters.success) {
      return { error: "Filtros de ocurrencias invalidos" };
    }

    const {
      jobId,
      scheduleRuleId,
      statuses,
      includeArchived,
      isDetached,
      startDate,
      endDate,
    } = parsedFilters.data;

    const occurrences = await db.jobOccurrence.findMany({
      where: {
        jobId,
        scheduleRuleId,
        status: statuses?.length ? { in: statuses } : undefined,
        archivedAt: includeArchived ? undefined : null,
        isDetached,
        scheduledStartAt: buildDateTimeRange(startDate, endDate),
      },
      include: {
        job: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        scheduleRule: true,
        createdBy: {
          select: opsAuditUserSelect,
        },
        updatedBy: {
          select: opsAuditUserSelect,
        },
      },
      orderBy: [{ scheduledStartAt: "asc" }],
    });

    return { occurrences };
  } catch (error) {
    console.error("Error getting job occurrences:", error);
    return { error: "Error al obtener las ocurrencias del calendario" };
  }
};
