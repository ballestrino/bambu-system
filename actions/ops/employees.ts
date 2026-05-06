"use server";

import { db } from "@/lib/db";
import { getActionErrorMessage } from "@/lib/ops/action-error";
import { assertEmployeeExists } from "@/lib/ops/assertions";
import { getPatchedDbValue } from "@/lib/ops/patch";
import { requireAdminSession } from "@/lib/require-admin-session";
import { CreateEmployeeSchema, UpdateEmployeeSchema } from "@/schemas/ops";

export const createEmployee = async (values: unknown) => {
  try {
    const session = await requireAdminSession();

    const parsedValues = CreateEmployeeSchema.safeParse(values);
    if (!parsedValues.success) {
      return { error: "Datos invalidos para crear la empleada" };
    }

    const employee = await db.employee.create({
      data: {
        ...parsedValues.data,
        createdById: session.user.id,
      },
    });

    return { success: "Empleada creada", employee };
  } catch (error) {
    console.error("Error creating employee:", error);
    return {
      error: getActionErrorMessage(error, "Error al crear la empleada"),
    };
  }
};

export const updateEmployee = async (employeeId: string, values: unknown) => {
  try {
    const session = await requireAdminSession();
    await assertEmployeeExists(employeeId);

    const parsedValues = UpdateEmployeeSchema.safeParse(values);
    if (!parsedValues.success) {
      return { error: "Datos invalidos para actualizar la empleada" };
    }

    const employee = await db.employee.update({
      where: {
        id: employeeId,
      },
      data: {
        name: parsedValues.data.name,
        email: getPatchedDbValue(parsedValues.data, "email"),
        phone: getPatchedDbValue(parsedValues.data, "phone"),
        notes: getPatchedDbValue(parsedValues.data, "notes"),
        isActive: parsedValues.data.isActive,
        updatedById: session.user.id,
      },
    });

    return { success: "Empleada actualizada", employee };
  } catch (error) {
    console.error("Error updating employee:", error);
    return {
      error: getActionErrorMessage(error, "Error al actualizar la empleada"),
    };
  }
};

export const archiveEmployee = async (employeeId: string) => {
  try {
    const session = await requireAdminSession();
    await assertEmployeeExists(employeeId);

    const employee = await db.employee.update({
      where: {
        id: employeeId,
      },
      data: {
        isActive: false,
        archivedAt: new Date(),
        updatedById: session.user.id,
      },
    });

    return { success: "Empleada archivada", employee };
  } catch (error) {
    console.error("Error archiving employee:", error);
    return {
      error: getActionErrorMessage(error, "Error al archivar la empleada"),
    };
  }
};
