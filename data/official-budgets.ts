import "server-only";

import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";
import {
  OfficialBudgetIdSchema,
  OfficialBudgetListSchema,
} from "@/schemas/official-budget";

export const getOfficialBudgets = async (filters: unknown = {}) => {
  await requireAdminSession();
  const parsed = OfficialBudgetListSchema.safeParse(filters);
  if (!parsed.success) {
    throw new Error("Filtros de presupuestos oficiales invalidos");
  }

  const query = parsed.data.query;

  return db.officialBudget.findMany({
    where: {
      status: parsed.data.status,
      ...(query
        ? {
            OR: [
              { sourceBudgetName: { contains: query, mode: "insensitive" as const } },
              { sourceBudgetSlug: { contains: query, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: { publishedAt: "desc" },
    include: {
      sourceBudget: { select: { id: true, name: true, slug: true } },
    },
  });
};

export const getOfficialBudgetById = async (officialBudgetId: string) => {
  await requireAdminSession();
  const parsed = OfficialBudgetIdSchema.safeParse({ officialBudgetId });
  if (!parsed.success) {
    throw new Error("Presupuesto oficial invalido");
  }

  return db.officialBudget.findUnique({
    where: { id: parsed.data.officialBudgetId },
    include: {
      sourceBudget: { select: { id: true, name: true, slug: true } },
      versions: {
        orderBy: { version: "desc" },
        include: {
          publishedBy: { select: { id: true, name: true, email: true } },
          options: { orderBy: { position: "asc" } },
        },
      },
      auditEvents: { orderBy: { createdAt: "desc" } },
    },
  });
};
