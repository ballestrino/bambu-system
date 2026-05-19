import "server-only";

import { db } from "@/lib/db";
import { buildDateTimeRange, opsAuditUserSelect } from "@/data/ops/shared";
import { ensureJobOccurrencesForRange } from "@/lib/ops/job-occurrence-generator";
import { requireAdminSession } from "@/lib/require-admin-session";
import { JobOccurrenceFiltersSchema } from "@/schemas/ops";

export const getJobOccurrences = async (filters?: unknown) => {
  try {
    const session = await requireAdminSession();

    const parsedFilters = JobOccurrenceFiltersSchema.safeParse(filters ?? {});
    if (!parsedFilters.success) {
      return { error: "Filtros de ocurrencias invalidos" };
    }

    const {
      jobId,
      employeeId,
      scheduleRuleId,
      statuses,
      includeArchived,
      isDetached,
      startDate,
      endDate,
    } = parsedFilters.data;

    await ensureJobOccurrencesForRange({
      jobId,
      rangeEnd: endDate,
      rangeStart: startDate,
      scheduleRuleId,
      userId: session.user.id,
    });

    const occurrences = await db.jobOccurrence.findMany({
      where: {
        jobId,
        employeeId,
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
        employee: true,
        employees: {
          include: {
            employee: true,
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
