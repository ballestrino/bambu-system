import "server-only";

import { getBudgetAdminSession } from "@/lib/budget-admin";
import { db } from "@/lib/db";
import { getJobBudgetPrice } from "@/lib/ops/job-budget-pricing";

export type BudgetDetailJob = {
  id: string;
  name: string;
  status: string;
  capturedAt: string | null;
  hasProducts: boolean | null;
  budgetIncludesIva: boolean;
  price: number | null;
};

export type BudgetDetailExtras = {
  jobs: BudgetDetailJob[];
  officialPublishedAt: string | null;
};

const readRecord = (value: unknown) =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

// Lo que la página del presupuesto muestra además del presupuesto: los trabajos
// que salieron de él (con la imagen que guardó cada uno) y cuándo se publicó la
// versión oficial vigente. Aparte de getBudgetBySlug, que también lee el agente.
export const getBudgetDetailExtras = async (budgetId: string) => {
  try {
    const admin = await getBudgetAdminSession();
    if ("error" in admin) return { error: admin.error };

    const [jobs, version] = await Promise.all([
      db.job.findMany({
        where: { sourceBudgetId: budgetId, archivedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          status: true,
          budgetIncludesIva: true,
          budgetSnapshot: true,
          sourceBudgetOption: true,
        },
      }),
      db.officialBudgetVersion.findFirst({
        where: { officialBudget: { sourceBudgetId: budgetId } },
        orderBy: { version: "desc" },
        select: { publishedAt: true },
      }),
    ]);

    const extras: BudgetDetailExtras = {
      jobs: jobs.map((job) => {
        const snapshot = readRecord(job.budgetSnapshot);
        const option = readRecord(snapshot?.option);
        return {
          id: job.id,
          name: job.name,
          status: job.status,
          capturedAt: typeof snapshot?.capturedAt === "string" ? snapshot.capturedAt : null,
          hasProducts: typeof option?.hasProducts === "boolean" ? option.hasProducts : job.sourceBudgetOption?.has_products ?? null,
          budgetIncludesIva: job.budgetIncludesIva,
          price: getJobBudgetPrice(job),
        };
      }),
      officialPublishedAt: version?.publishedAt.toISOString() ?? null,
    };

    return { extras };
  } catch {
    return { error: "No se pudieron leer los trabajos del presupuesto" };
  }
};
