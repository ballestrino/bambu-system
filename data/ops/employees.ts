import "server-only";

import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";
import {
  EmployeeFiltersSchema,
  JobEmployeeAssignmentFiltersSchema,
} from "@/schemas/ops";
import {
  buildDateTimeRange,
  matchesOpsSearchQuery,
  opsAuditUserSelect,
} from "@/data/ops/shared";
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

    const archiveFilter: Prisma.EmployeeWhereInput = includeArchived
      ? {
          OR: [
            {
              archivedAt: null,
              isActive,
            },
            {
              archivedAt: {
                not: null,
              },
            },
          ],
        }
      : {
          archivedAt: null,
          isActive,
        };
    const where: Prisma.EmployeeWhereInput = {
      AND: [archiveFilter],
      createdAt: buildDateTimeRange(startDate, endDate),
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

    // Igual que en trabajos: el texto se filtra en memoria para ignorar los
    // acentos, que Postgres no normaliza con `contains`.
    return {
      employees: query
        ? employees.filter((employee) =>
            matchesOpsSearchQuery(query, [
              employee.name,
              employee.email,
              employee.phone,
              employee.notes,
            ])
          )
        : employees,
    };
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
