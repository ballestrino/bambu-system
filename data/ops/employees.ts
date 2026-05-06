import "server-only";

import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";
import {
  EmployeeFiltersSchema,
  JobEmployeeAssignmentFiltersSchema,
} from "@/schemas/ops";
import { buildDateTimeRange, opsAuditUserSelect } from "@/data/ops/shared";
import { Prisma } from "@prisma/client";

export const getEmployees = async (filters?: unknown) => {
  try {
    await requireAdminSession();

    const parsedFilters = EmployeeFiltersSchema.safeParse(filters ?? {});
    if (!parsedFilters.success) {
      return { error: "Filtros de empleadas invalidos" };
    }

    const { query, isActive, includeArchived, startDate, endDate } =
      parsedFilters.data;

    const where: Prisma.EmployeeWhereInput = {
      isActive,
      archivedAt: includeArchived ? undefined : null,
      createdAt: buildDateTimeRange(startDate, endDate),
      OR: query
        ? [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
            { notes: { contains: query, mode: "insensitive" } },
          ]
        : undefined,
    };

    const employees = await db.employee.findMany({
      where,
      include: {
        createdBy: {
          select: opsAuditUserSelect,
        },
        updatedBy: {
          select: opsAuditUserSelect,
        },
      },
      orderBy: [{ archivedAt: "asc" }, { updatedAt: "desc" }],
    });

    return { employees };
  } catch (error) {
    console.error("Error getting employees:", error);
    return { error: "Error al obtener las empleadas" };
  }
};

export const getEmployeeById = async (id: string) => {
  try {
    await requireAdminSession();

    const employee = await db.employee.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            job: true,
          },
        },
        payments: true,
        timeEntries: true,
        createdBy: {
          select: opsAuditUserSelect,
        },
        updatedBy: {
          select: opsAuditUserSelect,
        },
      },
    });

    if (!employee) {
      return { error: "Empleada no encontrada" };
    }

    return { employee };
  } catch (error) {
    console.error("Error getting employee by id:", error);
    return { error: "Error al obtener la empleada" };
  }
};

export const getJobEmployeeAssignments = async (filters?: unknown) => {
  try {
    await requireAdminSession();

    const parsedFilters = JobEmployeeAssignmentFiltersSchema.safeParse(
      filters ?? {}
    );
    if (!parsedFilters.success) {
      return { error: "Filtros de asignaciones invalidos" };
    }

    const { jobId, employeeId, activeOnDate, includeArchived, startDate, endDate } =
      parsedFilters.data;

    const assignments = await db.jobEmployeeAssignment.findMany({
      where: {
        jobId,
        employeeId,
        archivedAt: includeArchived ? undefined : null,
        assignedFrom: buildDateTimeRange(startDate, endDate),
        AND: activeOnDate
          ? [
              {
                assignedFrom: {
                  lte: activeOnDate,
                },
              },
              {
                OR: [
                  {
                    assignedTo: null,
                  },
                  {
                    assignedTo: {
                      gte: activeOnDate,
                    },
                  },
                ],
              },
            ]
          : undefined,
      },
      include: {
        job: true,
        employee: true,
        createdBy: {
          select: opsAuditUserSelect,
        },
        updatedBy: {
          select: opsAuditUserSelect,
        },
      },
      orderBy: [{ assignedFrom: "desc" }],
    });

    return { assignments };
  } catch (error) {
    console.error("Error getting job employee assignments:", error);
    return { error: "Error al obtener las asignaciones" };
  }
};
