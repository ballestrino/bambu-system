import "server-only";

import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";
import { JobClientPaymentFiltersSchema } from "@/schemas/ops";
import { buildDateTimeRange, opsAuditUserSelect } from "@/data/ops/shared";

export const getJobClientPayments = async (filters?: unknown) => {
  try {
    await requireAdminSession();

    const parsedFilters = JobClientPaymentFiltersSchema.safeParse(filters ?? {});
    if (!parsedFilters.success) {
      return { error: "Filtros de cobros invalidos" };
    }

    const { jobId, statuses, startDate, endDate } = parsedFilters.data;

    const clientPayments = await db.jobClientPayment.findMany({
      where: {
        jobId,
        status: statuses?.length ? { in: statuses } : undefined,
        paymentDate: buildDateTimeRange(startDate, endDate),
      },
      include: {
        job: true,
        createdBy: {
          select: opsAuditUserSelect,
        },
        updatedBy: {
          select: opsAuditUserSelect,
        },
      },
      orderBy: [{ paymentDate: "desc" }, { createdAt: "desc" }],
    });

    return { clientPayments };
  } catch (error) {
    console.error("Error getting job client payments:", error);
    return { error: "Error al obtener los cobros de trabajos" };
  }
};
