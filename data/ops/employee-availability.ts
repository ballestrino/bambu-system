import "server-only";

import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";
import { EmployeeAvailabilityFiltersSchema } from "@/schemas/ops";
import { opsAvailabilityRuleInclude } from "@/data/ops/includes";

export const getEmployeeAvailabilityRules = async (filters?: unknown) => {
  try {
    await requireAdminSession();

    const parsedFilters = EmployeeAvailabilityFiltersSchema.safeParse(filters ?? {});
    if (!parsedFilters.success) {
      return { error: "Filtros de disponibilidad invalidos" };
    }

    const rules = await db.employeeAvailabilityRule.findMany({
      where: {
        employeeId: parsedFilters.data.employeeId,
      },
      include: opsAvailabilityRuleInclude,
      orderBy: [{ employeeId: "asc" }, { startMinute: "asc" }],
    });

    return { rules };
  } catch (error) {
    console.error("Error getting employee availability rules:", error);
    return { error: "Error al obtener la disponibilidad" };
  }
};
