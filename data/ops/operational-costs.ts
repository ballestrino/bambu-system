import "server-only";

import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";
import {
  OperationalCostCategoryFiltersSchema,
  OperationalCostFiltersSchema,
} from "@/schemas/ops";
import {
  buildAssignedMonthRange,
  buildDateTimeRange,
  opsAuditUserSelect,
} from "@/data/ops/shared";

const defaultCategories = [
  { name: "BPS", kind: "BPS", color: "#3B82F6" },
  { name: "Taxi", kind: "TRANSPORT", color: "#F59E0B" },
  { name: "Bus", kind: "TRANSPORT", color: "#10B981" },
  { name: "Otros", kind: "GENERAL", color: "#64748B" },
] as const;

const ensureDefaultCostCategories = async (userId: string) => {
  await Promise.all(
    defaultCategories.map((category) =>
      db.operationalCostCategory.upsert({
        where: { name: category.name },
        create: { ...category, createdById: userId },
        update: {},
      })
    )
  );
};

export const getOperationalCostCategories = async (filters?: unknown) => {
  try {
    const session = await requireAdminSession();
    await ensureDefaultCostCategories(session.user.id);

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
      ? buildAssignedMonthRange(assignedMonth)
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

    const settings = await db.opsCostSettings.upsert({
      where: { id: "default" },
      create: { id: "default" },
      update: {},
    });

    return { settings };
  } catch (error) {
    console.error("Error getting cost settings:", error);
    return { error: "Error al obtener configuracion de costes" };
  }
};
