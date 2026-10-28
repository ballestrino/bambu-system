"use server";

import { db } from "@/lib/db";
import { opsEmployeeInclude } from "@/data/ops/includes";
import { getActionErrorMessage } from "@/lib/ops/action-error";
import { requireAdminSession } from "@/lib/require-admin-session";
import { EmployeeIdsSchema } from "@/schemas/ops";

// Acciones en lote de la tabla de empleados (feature 30). Las archivadas
// quedan afuera: para volver a usarlas hay que editarlas una por una.
export const setEmployeesActive = async (employeeIds: unknown, isActive: boolean) => {
  try {
    const session = await requireAdminSession();

    const parsedIds = EmployeeIdsSchema.safeParse(employeeIds);
    if (!parsedIds.success || typeof isActive !== "boolean") {
      return { error: "Datos invalidos para actualizar las empleadas" };
    }

    const where = { id: { in: parsedIds.data }, archivedAt: null };
    const employees = await db.$transaction(async (tx) => {
      await tx.employee.updateMany({
        where,
        data: { isActive, updatedById: session.user.id },
      });
      return tx.employee.findMany({ where, include: opsEmployeeInclude });
    });

    return { success: "Empleadas actualizadas", employees };
  } catch (error) {
    console.error("Error updating employees:", error);
    return {
      error: getActionErrorMessage(error, "Error al actualizar las empleadas"),
    };
  }
};

export const archiveEmployees = async (employeeIds: unknown) => {
  try {
    const session = await requireAdminSession();

    const parsedIds = EmployeeIdsSchema.safeParse(employeeIds);
    if (!parsedIds.success) {
      return { error: "Datos invalidos para archivar las empleadas" };
    }

    const archivedAt = new Date();
    const employees = await db.$transaction(async (tx) => {
      await tx.employee.updateMany({
        where: { id: { in: parsedIds.data }, archivedAt: null },
        data: { isActive: false, archivedAt, updatedById: session.user.id },
      });
      return tx.employee.findMany({
        where: { id: { in: parsedIds.data }, archivedAt },
        include: opsEmployeeInclude,
      });
    });

    return { success: "Empleadas archivadas", employees };
  } catch (error) {
    console.error("Error archiving employees:", error);
    return {
      error: getActionErrorMessage(error, "Error al archivar las empleadas"),
    };
  }
};
