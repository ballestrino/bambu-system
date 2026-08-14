import "server-only";

import type { Prisma } from "@prisma/client";

import { opsOccurrenceInclude } from "@/data/ops/includes";
import { db } from "@/lib/db";
import { ensureJobOccurrencesForRange } from "@/lib/ops/job-occurrence-generator";
import { getVisitExactDateRange, getVisitWeekRange } from "@/lib/ops/visit-feed";
import { requireAdminSession } from "@/lib/require-admin-session";
import {
  VisitFeedFiltersSchema,
  type VisitFeedFilters,
} from "@/schemas/ops";

const visibleOccurrenceWhere = {
  archivedAt: null,
  NOT: {
    job: { archivedAt: { not: null } },
    status: "SCHEDULED",
  },
} satisfies Prisma.JobOccurrenceWhereInput;

const buildFeedWhere = (
  filters: VisitFeedFilters
): Prisma.JobOccurrenceWhereInput => {
  const conditions: Prisma.JobOccurrenceWhereInput[] = [];

  if (filters.employeeId === "UNASSIGNED") {
    conditions.push({ employees: { none: {} } });
  } else if (filters.employeeId !== "ALL") {
    conditions.push({ employees: { some: { employeeId: filters.employeeId } } });
  }

  if (filters.attentionOnly) {
    conditions.push({
      OR: [
        { employees: { none: {} } },
        { status: { in: ["CANCELED", "SKIPPED"] } },
      ],
    });
  }

  return {
    ...visibleOccurrenceWhere,
    AND: conditions.length ? conditions : undefined,
    jobId: filters.jobId === "ALL" ? undefined : filters.jobId,
    status: filters.status === "ALL" ? undefined : filters.status,
  };
};

export const getVisitWeek = async (input: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsed = VisitFeedFiltersSchema.safeParse(input);
    if (!parsed.success) return { error: "Filtros de visitas invalidos" };

    const filters = parsed.data;
    const range = filters.exactDate
      ? getVisitExactDateRange(filters.exactDate)
      : getVisitWeekRange(filters.cursor);
    const where = buildFeedWhere(filters);

    await ensureJobOccurrencesForRange({
      jobId: filters.jobId === "ALL" ? undefined : filters.jobId,
      rangeEnd: range.end,
      rangeStart: range.start,
      userId: session.user.id,
    });

    const [occurrences, previousOccurrence] = await Promise.all([
      db.jobOccurrence.findMany({
        where: {
          ...where,
          scheduledStartAt: { gte: range.start, lte: range.end },
        },
        include: opsOccurrenceInclude,
        orderBy: [{ scheduledStartAt: "desc" }],
      }),
      filters.exactDate
        ? null
        : db.jobOccurrence.findFirst({
            where: { ...where, scheduledStartAt: { lt: range.start } },
            orderBy: [{ scheduledStartAt: "desc" }],
            select: { scheduledStartAt: true },
          }),
    ]);
    const nextCursor = previousOccurrence
      ? getVisitWeekRange(previousOccurrence.scheduledStartAt).start
      : null;

    return {
      page: {
        hasNextPage: Boolean(nextCursor),
        nextCursor,
        occurrences,
        weekEnd: range.end,
        weekStart: range.start,
      },
    };
  } catch (error) {
    console.error("Error getting visit week:", error);
    return { error: "Error al obtener el historial de visitas" };
  }
};

export const getVisitFilterOptions = async () => {
  try {
    await requireAdminSession();
    const [jobs, employees] = await Promise.all([
      db.job.findMany({
        where: { occurrences: { some: visibleOccurrenceWhere } },
        orderBy: [{ name: "asc" }],
        select: { id: true, name: true },
      }),
      db.employee.findMany({
        where: {
          occurrenceAssignments: {
            some: { jobOccurrence: visibleOccurrenceWhere },
          },
        },
        orderBy: [{ name: "asc" }],
        select: { id: true, name: true },
      }),
    ]);

    return { options: { employees, jobs } };
  } catch (error) {
    console.error("Error getting visit filter options:", error);
    return { error: "Error al obtener las opciones de visitas" };
  }
};
