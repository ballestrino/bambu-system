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

// La lista de la pantalla: cada oficial con los precios de su versión vigente y
// el conteo de cada pestaña bajo la misma búsqueda.
export const getOfficialBudgetList = async (filters: unknown = {}) => {
  await requireAdminSession();
  const parsed = OfficialBudgetListSchema.safeParse(filters);
  if (!parsed.success) {
    throw new Error("Filtros de presupuestos oficiales invalidos");
  }

  const query = parsed.data.query;
  const search = query
    ? {
        OR: [
          { sourceBudgetName: { contains: query, mode: "insensitive" as const } },
          { sourceBudgetSlug: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [rows, counts] = await Promise.all([
    db.officialBudget.findMany({
      where: { status: parsed.data.status ?? "ACTIVE", ...search },
      orderBy: { publishedAt: "desc" },
      include: {
        sourceBudget: { select: { id: true, name: true, slug: true } },
        versions: {
          orderBy: { version: "desc" },
          take: 1,
          select: {
            publishedAt: true,
            options: {
              orderBy: { position: "asc" },
              select: {
                hasProducts: true,
                visits: true,
                visitType: true,
                hoursPerVisit: true,
                employees: true,
                productsCost: true,
                netPrice: true,
                ivaAmount: true,
                finalPrice: true,
                hourlyPrice: true,
              },
            },
          },
        },
      },
    }),
    db.officialBudget.groupBy({ by: ["status"], where: search, _count: { _all: true } }),
  ]);

  return { rows, counts };
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
