import "server-only";

import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";
import { TimeEntryFiltersSchema } from "@/schemas/ops";
import { buildDateTimeRange, opsAuditUserSelect } from "@/data/ops/shared";

export const getTimeEntries = async (filters?: unknown) => {
  try {
    await requireAdminSession();

    const parsedFilters = TimeEntryFiltersSchema.safeParse(filters ?? {});
    if (!parsedFilters.success) {
      return { error: "Filtros de horas invalidos" };
    }

    const {
      jobId,
      employeeId,
      jobOccurrenceId,
      statuses,
      approvedOnly,
      startDate,
      endDate,
    } = parsedFilters.data;

    const timeEntries = await db.timeEntry.findMany({
      where: {
        jobId,
        employeeId,
        jobOccurrenceId,
        status: statuses?.length ? { in: statuses } : undefined,
        approvedAt: approvedOnly ? { not: null } : undefined,
        workDate: buildDateTimeRange(startDate, endDate),
      },
      include: {
        job: true,
        employee: true,
        jobOccurrence: true,
        approvedBy: {
          select: opsAuditUserSelect,
        },
        createdBy: {
          select: opsAuditUserSelect,
        },
        updatedBy: {
          select: opsAuditUserSelect,
        },
      },
      orderBy: [{ workDate: "desc" }, { createdAt: "desc" }],
    });

    return { timeEntries };
  } catch (error) {
    console.error("Error getting time entries:", error);
    return { error: "Error al obtener las horas" };
  }
};
