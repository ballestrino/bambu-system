"use server";

import { db } from "@/lib/db";
import { getActionErrorMessage } from "@/lib/ops/action-error";
import {
  assertJobExists,
  assertOccurrenceExists,
  assertOccurrenceRuleBelongsToJob,
} from "@/lib/ops/assertions";
import {
  assertOccurrenceEmployeesExist,
  getOccurrenceEmployeeIds,
  getPatchedEmployeeIds,
  getSubmittedEmployeeIds,
} from "@/lib/ops/job-occurrence-employees";
import {
  buildResolvedJobOccurrence,
  validateResolvedJobOccurrence,
} from "@/lib/ops/job-occurrence-patch";
import {
  createOccurrenceWithEmployees,
  stripOccurrenceEmployeeInputs,
  updateOccurrenceWithEmployees,
} from "@/lib/ops/job-occurrence-persistence";
import { requireAdminSession } from "@/lib/require-admin-session";
import { CreateJobOccurrenceSchema, DetachJobOccurrenceSchema, UpdateJobOccurrenceSchema } from "@/schemas/ops";

export const createJobOccurrence = async (values: unknown) => {
  try {
    const session = await requireAdminSession();

    const parsedValues = CreateJobOccurrenceSchema.safeParse(values);
    if (!parsedValues.success) {
      return { error: "Datos invalidos para crear la ocurrencia" };
    }

    const employeeIds = getSubmittedEmployeeIds(parsedValues.data);

    await Promise.all([
      assertJobExists(parsedValues.data.jobId),
      assertOccurrenceEmployeesExist(employeeIds),
      assertOccurrenceRuleBelongsToJob(
        parsedValues.data.scheduleRuleId,
        parsedValues.data.jobId
      ),
    ]);

    const occurrence = await createOccurrenceWithEmployees(
      {
        ...stripOccurrenceEmployeeInputs(parsedValues.data),
        createdById: session.user.id,
      },
      employeeIds
    );

    return { success: "Ocurrencia creada", occurrence };
  } catch (error) {
    console.error("Error creating job occurrence:", error);
    return {
      error: getActionErrorMessage(error, "Error al crear la ocurrencia"),
    };
  }
};

export const updateJobOccurrence = async (occurrenceId: string, values: unknown) => {
  try {
    const session = await requireAdminSession();
    const existingOccurrence = await assertOccurrenceExists(occurrenceId);

    const parsedValues = UpdateJobOccurrenceSchema.safeParse(values);
    if (!parsedValues.success) {
      return { error: "Datos invalidos para actualizar la ocurrencia" };
    }

    const existingEmployeeIds = await getOccurrenceEmployeeIds(occurrenceId);
    const employeeIds = getPatchedEmployeeIds({
      existingEmployeeIds,
      legacyEmployeeId: existingOccurrence.employeeId,
      patch: parsedValues.data,
    });
    const mergedValues = buildResolvedJobOccurrence(
      existingOccurrence,
      parsedValues.data
    );
    const validatedValues = validateResolvedJobOccurrence(mergedValues);
    if (!validatedValues.success) {
      return { error: "La ocurrencia resultante es invalida" };
    }

    await assertOccurrenceEmployeesExist(employeeIds);

    const occurrence = await updateOccurrenceWithEmployees({
      data: {
        scheduledStartAt: validatedValues.data.scheduledStartAt,
        scheduledEndAt: validatedValues.data.scheduledEndAt,
        actualStartAt: mergedValues.actualStartAt,
        actualEndAt: mergedValues.actualEndAt,
        status: validatedValues.data.status,
        isDetached: validatedValues.data.isDetached,
        notes: mergedValues.notes,
        updatedById: session.user.id,
      },
      employeeIds,
      occurrenceId,
    });

    return { success: "Ocurrencia actualizada", occurrence };
  } catch (error) {
    console.error("Error updating job occurrence:", error);
    return {
      error: getActionErrorMessage(error, "Error al actualizar la ocurrencia"),
    };
  }
};

export const detachJobOccurrence = async (occurrenceId: string, values?: unknown) => {
  try {
    const session = await requireAdminSession();
    const existingOccurrence = await assertOccurrenceExists(occurrenceId);

    const parsedValues = DetachJobOccurrenceSchema.safeParse(values ?? {});
    if (!parsedValues.success) {
      return { error: "Datos invalidos para despegar la ocurrencia" };
    }

    const existingEmployeeIds = await getOccurrenceEmployeeIds(occurrenceId);
    const employeeIds = getPatchedEmployeeIds({
      existingEmployeeIds,
      legacyEmployeeId: existingOccurrence.employeeId,
      patch: parsedValues.data,
    });
    const mergedValues = buildResolvedJobOccurrence(
      existingOccurrence,
      parsedValues.data,
      {
        isDetached: true,
        scheduleRuleId: null,
      }
    );
    const validatedValues = validateResolvedJobOccurrence(mergedValues);
    if (!validatedValues.success) {
      return { error: "La ocurrencia despejada es invalida" };
    }

    await assertOccurrenceEmployeesExist(employeeIds);

    const occurrence = await updateOccurrenceWithEmployees({
      data: {
        scheduledStartAt: validatedValues.data.scheduledStartAt,
        scheduledEndAt: validatedValues.data.scheduledEndAt,
        actualStartAt: mergedValues.actualStartAt,
        actualEndAt: mergedValues.actualEndAt,
        status: validatedValues.data.status,
        scheduleRuleId: null,
        isDetached: true,
        notes: mergedValues.notes,
        updatedById: session.user.id,
      },
      employeeIds,
      occurrenceId,
    });

    return { success: "Ocurrencia separada de la regla", occurrence };
  } catch (error) {
    console.error("Error detaching job occurrence:", error);
    return {
      error: getActionErrorMessage(error, "Error al separar la ocurrencia de la regla"),
    };
  }
};

export const archiveJobOccurrence = async (occurrenceId: string) => {
  try {
    const session = await requireAdminSession();
    await assertOccurrenceExists(occurrenceId);

    const occurrence = await db.jobOccurrence.update({
      where: {
        id: occurrenceId,
      },
      data: {
        archivedAt: new Date(),
        updatedById: session.user.id,
      },
    });

    return { success: "Ocurrencia archivada", occurrence };
  } catch (error) {
    console.error("Error archiving job occurrence:", error);
    return {
      error: getActionErrorMessage(error, "Error al archivar la ocurrencia"),
    };
  }
};
