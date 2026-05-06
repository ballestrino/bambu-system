"use server";

import { db } from "@/lib/db";
import { getActionErrorMessage } from "@/lib/ops/action-error";
import {
  assertAssignmentExists,
  assertEmployeeExists,
  assertJobExists,
} from "@/lib/ops/assertions";
import { getPatchedValue } from "@/lib/ops/patch";
import { requireAdminSession } from "@/lib/require-admin-session";
import {
  CreateJobEmployeeAssignmentSchema,
  UpdateJobEmployeeAssignmentSchema,
} from "@/schemas/ops";

export const createJobEmployeeAssignment = async (values: unknown) => {
  try {
    const session = await requireAdminSession();

    const parsedValues = CreateJobEmployeeAssignmentSchema.safeParse(values);
    if (!parsedValues.success) {
      return { error: "Datos invalidos para crear la asignacion" };
    }

    await Promise.all([
      assertJobExists(parsedValues.data.jobId),
      assertEmployeeExists(parsedValues.data.employeeId),
    ]);

    const assignment = await db.jobEmployeeAssignment.create({
      data: {
        ...parsedValues.data,
        createdById: session.user.id,
      },
    });

    return { success: "Asignacion creada", assignment };
  } catch (error) {
    console.error("Error creating job employee assignment:", error);
    return {
      error: getActionErrorMessage(error, "Error al crear la asignacion"),
    };
  }
};

export const updateJobEmployeeAssignment = async (
  assignmentId: string,
  values: unknown
) => {
  try {
    const session = await requireAdminSession();
    const existingAssignment = await assertAssignmentExists(assignmentId);

    const parsedValues = UpdateJobEmployeeAssignmentSchema.safeParse(values);
    if (!parsedValues.success) {
      return { error: "Datos invalidos para actualizar la asignacion" };
    }

    const mergedValues = {
      jobId: existingAssignment.jobId,
      employeeId: existingAssignment.employeeId,
      roleLabel: getPatchedValue(
        parsedValues.data,
        "roleLabel",
        existingAssignment.roleLabel ?? null
      ),
      assignedFrom: getPatchedValue(
        parsedValues.data,
        "assignedFrom",
        existingAssignment.assignedFrom
      ),
      assignedTo: getPatchedValue(
        parsedValues.data,
        "assignedTo",
        existingAssignment.assignedTo ?? null
      ),
    };

    const validatedValues = CreateJobEmployeeAssignmentSchema.safeParse(
      {
        ...mergedValues,
        roleLabel: mergedValues.roleLabel ?? undefined,
        assignedTo: mergedValues.assignedTo ?? undefined,
      }
    );
    if (!validatedValues.success) {
      return { error: "La asignacion resultante es invalida" };
    }

    const assignment = await db.jobEmployeeAssignment.update({
      where: {
        id: assignmentId,
      },
      data: {
        roleLabel: mergedValues.roleLabel,
        assignedFrom: validatedValues.data.assignedFrom,
        assignedTo: mergedValues.assignedTo,
        updatedById: session.user.id,
      },
    });

    return { success: "Asignacion actualizada", assignment };
  } catch (error) {
    console.error("Error updating job employee assignment:", error);
    return {
      error: getActionErrorMessage(error, "Error al actualizar la asignacion"),
    };
  }
};

export const archiveJobEmployeeAssignment = async (assignmentId: string) => {
  try {
    const session = await requireAdminSession();
    await assertAssignmentExists(assignmentId);

    const assignment = await db.jobEmployeeAssignment.update({
      where: {
        id: assignmentId,
      },
      data: {
        archivedAt: new Date(),
        updatedById: session.user.id,
      },
    });

    return { success: "Asignacion archivada", assignment };
  } catch (error) {
    console.error("Error archiving job employee assignment:", error);
    return {
      error: getActionErrorMessage(error, "Error al archivar la asignacion"),
    };
  }
};
