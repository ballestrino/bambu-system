import "server-only";

import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";
import {
  OperationalCostCategoryFiltersSchema,
  OperationalCostFiltersSchema,
} from "@/schemas/ops";
import {
  buildDateTimeRange,
  opsAuditUserSelect,
} from "@/data/ops/shared";
import { getAssignedMonthRange } from "@/lib/ops/finance";

export const getOperationalCostCategories = async (filters?: unknown) => {
  try {
    await requireAdminSession();

    const parsedFilters = OperationalCostCategoryFiltersSchema.safeParse(
      filters ?? {}
    );
    if (!parsedFilters.success) {
      return { error: "Filtros de categorias de costes invalidos" };
    }

    const { includeArchived, isActive, kinds } = parsedFilters.data;
    const categories = await db.operationalCostCategory.findMany({
      where: {
        archivedAt: includeArchived ? undefined : null,
        isActive,
        kind: kinds?.length ? { in: kinds } : undefined,
      },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    });

    return { categories };
  } catch (error) {
    console.error("Error getting operational cost categories:", error);
    return { error: "Error al obtener categorias de costes" };
  }
};

export const getOperationalCosts = async (filters?: unknown) => {
  try {
    await requireAdminSession();

    const parsedFilters = OperationalCostFiltersSchema.safeParse(filters ?? {});
    if (!parsedFilters.success) {
      return { error: "Filtros de costes invalidos" };
    }

    const {
      assignedMonth,
      categoryId,
      employeeId,
      jobId,
      kinds,
      statuses,
      startDate,
      endDate,
    } = parsedFilters.data;
    const assignedMonthRange = assignedMonth
      ? getAssignedMonthRange(assignedMonth)
      : buildDateTimeRange(startDate, endDate);
    const where: Prisma.OperationalCostWhereInput = {
      categoryId,
      employeeId,
      jobId,
      status: statuses?.length ? { in: statuses } : undefined,
      assignedMonth: assignedMonthRange,
      category: kinds?.length ? { kind: { in: kinds } } : undefined,
    };

    const costs = await db.operationalCost.findMany({
      where,
      include: {
        category: true,
        employee: true,
        job: true,
        createdBy: { select: opsAuditUserSelect },
        updatedBy: { select: opsAuditUserSelect },
      },
      orderBy: [
        { assignedMonth: "desc" },
        { costDate: "desc" },
        { createdAt: "desc" },
      ],
    });

    return { costs };
  } catch (error) {
    console.error("Error getting operational costs:", error);
    return { error: "Error al obtener costes" };
  }
};

export const getOpsCostSettings = async () => {
  try {
    await requireAdminSession();

    // Read-only: the row is created by updateOpsCostSettings when an admin
    // saves a percentage. Returning null (never undefined) keeps React Query
    // happy and leaves BpsSettingsPanel's remount key stable.
    const settings = await db.opsCostSettings.findUnique({
      where: { id: "default" },
    });

    return { settings: settings ?? null };
  } catch (error) {
    console.error("Error getting cost settings:", error);
    return { error: "Error al obtener configuracion de costes" };
  }
};
