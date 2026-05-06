import "server-only";

import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";
import { EmployeePaymentFiltersSchema } from "@/schemas/ops";
import { buildDateTimeRange, opsAuditUserSelect } from "@/data/ops/shared";

export const getEmployeePayments = async (filters?: unknown) => {
  try {
    await requireAdminSession();

    const parsedFilters = EmployeePaymentFiltersSchema.safeParse(filters ?? {});
    if (!parsedFilters.success) {
      return { error: "Filtros de pagos invalidos" };
    }

    const { employeeId, statuses, startDate, endDate } = parsedFilters.data;

    const employeePayments = await db.employeePayment.findMany({
      where: {
        employeeId,
        status: statuses?.length ? { in: statuses } : undefined,
        paymentDate: buildDateTimeRange(startDate, endDate),
      },
      include: {
        employee: true,
        createdBy: {
          select: opsAuditUserSelect,
        },
        updatedBy: {
          select: opsAuditUserSelect,
        },
      },
      orderBy: [{ paymentDate: "desc" }, { createdAt: "desc" }],
    });

    return { employeePayments };
  } catch (error) {
    console.error("Error getting employee payments:", error);
    return { error: "Error al obtener los pagos de empleadas" };
  }
};
