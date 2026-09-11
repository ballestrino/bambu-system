"use server";

import { db } from "@/lib/db";
import { opsAvailabilityRuleInclude } from "@/data/ops/includes";
import { getActionErrorMessage } from "@/lib/ops/action-error";
import { assertEmployeeExists } from "@/lib/ops/assertions";
import { requireAdminSession } from "@/lib/require-admin-session";
import { CreateEmployeeAvailabilityRuleSchema } from "@/schemas/ops";

export const createEmployeeAvailabilityRule = async (values: unknown) => {
  try {
    const session = await requireAdminSession();

    const parsedValues = CreateEmployeeAvailabilityRuleSchema.safeParse(values);
    if (!parsedValues.success) {
      return { error: "Datos invalidos para la disponibilidad" };
    }

    await assertEmployeeExists(parsedValues.data.employeeId);

    const rule = await db.employeeAvailabilityRule.create({
      data: {
        ...parsedValues.data,
        createdById: session.user.id,
      },
      include: opsAvailabilityRuleInclude,
    });

    return { success: "Disponibilidad guardada", rule };
  } catch (error) {
    console.error("Error creating employee availability rule:", error);
    return {
      error: getActionErrorMessage(error, "Error al guardar la disponibilidad"),
    };
  }
};

export const deleteEmployeeAvailabilityRule = async (ruleId: string) => {
  try {
    await requireAdminSession();

    const existingRule = await db.employeeAvailabilityRule.findUnique({
      where: { id: ruleId },
    });

    if (!existingRule) {
      return { error: "La regla de disponibilidad no existe" };
    }

    const rule = await db.employeeAvailabilityRule.delete({
      where: { id: ruleId },
      include: opsAvailabilityRuleInclude,
    });

    return { success: "Disponibilidad eliminada", rule };
  } catch (error) {
    console.error("Error deleting employee availability rule:", error);
    return {
      error: getActionErrorMessage(error, "Error al eliminar la disponibilidad"),
    };
  }
};
