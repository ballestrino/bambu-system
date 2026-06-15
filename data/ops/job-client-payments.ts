import "server-only";

import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";
import { JobClientPaymentFiltersSchema } from "@/schemas/ops";
import {
  buildAssignedMonthRange,
  buildDateTimeRange,
  opsAuditUserSelect,
} from "@/data/ops/shared";

export const getJobClientPayments = async (filters?: unknown) => {
  try {
    await requireAdminSession();

    const parsedFilters = JobClientPaymentFiltersSchema.safeParse(filters ?? {});
    if (!parsedFilters.success) {
      return { error: "Filtros de cobros invalidos" };
    }

    const { assignedMonth, jobId, statuses, startDate, endDate } =
      parsedFilters.data;
    const assignedMonthRange = assignedMonth
      ? buildAssignedMonthRange(assignedMonth)
      : buildDateTimeRange(startDate, endDate);

    const clientPayments = await db.jobClientPayment.findMany({
      where: {
        jobId,
        status: statuses?.length ? { in: statuses } : undefined,
        assignedMonth: assignedMonthRange,
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
      orderBy: [
        { assignedMonth: "desc" },
        { paymentDate: "desc" },
        { createdAt: "desc" },
      ],
    });

    return { clientPayments };
  } catch (error) {
    console.error("Error getting job client payments:", error);
    return { error: "Error al obtener los cobros de trabajos" };
  }
};
