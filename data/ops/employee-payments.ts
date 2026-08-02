import "server-only";

import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";
import { EmployeePaymentFiltersSchema } from "@/schemas/ops";
import { opsAuditUserSelect } from "@/data/ops/shared";
import { getEmployeePaymentDateFilter } from "@/lib/ops/finance";

export const getEmployeePayments = async (filters?: unknown) => {
  try {
    await requireAdminSession();

    const parsedFilters = EmployeePaymentFiltersSchema.safeParse(filters ?? {});
    if (!parsedFilters.success) {
      return { error: "Filtros de pagos invalidos" };
    }

    const { assignedMonth, basis, employeeId, statuses, startDate, endDate } =
      parsedFilters.data;
    const dateFilter = getEmployeePaymentDateFilter({
      assignedMonth,
      basis,
      endDate,
      startDate,
    });

    const employeePayments = await db.employeePayment.findMany({
      where: {
        ...dateFilter,
        employeeId,
        status: statuses?.length ? { in: statuses } : undefined,
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
      orderBy: [
        { assignedMonth: "desc" },
        { paymentDate: "desc" },
        { createdAt: "desc" },
      ],
    });

    return { employeePayments };
  } catch (error) {
    console.error("Error getting employee payments:", error);
    return { error: "Error al obtener los pagos de empleadas" };
  }
};
