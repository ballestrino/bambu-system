import "server-only";

import { z } from "zod";

import { db } from "@/lib/db";
import { getAssignedMonthRange } from "@/lib/ops/finance/month";
import { requireAdminSession } from "@/lib/require-admin-session";
import { cuidSchema } from "@/schemas/ops/common";

const PaidEmployeesSchema = z.object({
  employeeIds: z.array(cuidSchema).min(1).max(50),
  paymentMonthKey: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
});

// The employees with recorded payments in the month that settles a visit's
// hours, so removing that visit changes a balance already paid.
export const getPaidEmployeeIds = async (input: unknown) => {
  try {
    await requireAdminSession();

    const parsed = PaidEmployeesSchema.safeParse(input);
    if (!parsed.success) {
      return { error: "Datos invalidos para revisar los pagos" };
    }

    const [year, month] = parsed.data.paymentMonthKey.split("-").map(Number);
    const payments = await db.employeePayment.findMany({
      where: {
        assignedMonth: getAssignedMonthRange(new Date(Date.UTC(year, month - 1, 1))),
        employeeId: { in: parsed.data.employeeIds },
        status: "RECORDED",
      },
      distinct: ["employeeId"],
      select: { employeeId: true },
    });

    return { employeeIds: payments.map((payment) => payment.employeeId) };
  } catch (error) {
    console.error("Error getting paid employees:", error);
    return { error: "Error al revisar los pagos de empleadas" };
  }
};
