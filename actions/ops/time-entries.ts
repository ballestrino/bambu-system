"use server";

import { db } from "@/lib/db";
import { getActionErrorMessage } from "@/lib/ops/action-error";
import {
  assertEmployeeExists,
  assertJobExists,
  assertOccurrenceBelongsToJob,
  assertTimeEntryExists,
} from "@/lib/ops/assertions";
import { getPatchedValue } from "@/lib/ops/patch";
import { requireAdminSession } from "@/lib/require-admin-session";
import {
  CreateTimeEntrySchema,
  SetTimeEntryStatusSchema,
  UpdateTimeEntrySchema,
} from "@/schemas/ops";

export const createTimeEntry = async (values: unknown) => {
  try {
    const session = await requireAdminSession();

    const parsedValues = CreateTimeEntrySchema.safeParse(values);
    if (!parsedValues.success) {
      return { error: "Datos invalidos para crear la entrada de horas" };
    }

    await Promise.all([
      assertEmployeeExists(parsedValues.data.employeeId),
      assertJobExists(parsedValues.data.jobId),
      assertOccurrenceBelongsToJob(
        parsedValues.data.jobOccurrenceId,
        parsedValues.data.jobId
      ),
    ]);

    const timeEntry = await db.timeEntry.create({
      data: {
        ...parsedValues.data,
        approvedAt:
          parsedValues.data.status === "APPROVED" ? new Date() : undefined,
        approvedById:
          parsedValues.data.status === "APPROVED" ? session.user.id : undefined,
        createdById: session.user.id,
      },
    });

    return { success: "Entrada de horas creada", timeEntry };
  } catch (error) {
    console.error("Error creating time entry:", error);
    return {
      error: getActionErrorMessage(error, "Error al crear la entrada de horas"),
    };
  }
};

export const updateTimeEntry = async (timeEntryId: string, values: unknown) => {
  try {
    const session = await requireAdminSession();
    const existingTimeEntry = await assertTimeEntryExists(timeEntryId);

    const parsedValues = UpdateTimeEntrySchema.safeParse(values);
    if (!parsedValues.success) {
      return { error: "Datos invalidos para actualizar la entrada de horas" };
    }

    const mergedValues = {
      employeeId: getPatchedValue(
        parsedValues.data,
        "employeeId",
        existingTimeEntry.employeeId
      ),
      jobId: getPatchedValue(parsedValues.data, "jobId", existingTimeEntry.jobId),
      jobOccurrenceId: getPatchedValue(
        parsedValues.data,
        "jobOccurrenceId",
        existingTimeEntry.jobOccurrenceId ?? null
      ),
      workDate: getPatchedValue(
        parsedValues.data,
        "workDate",
        existingTimeEntry.workDate
      ),
      startedAt: getPatchedValue(
        parsedValues.data,
        "startedAt",
        existingTimeEntry.startedAt ?? null
      ),
      endedAt: getPatchedValue(
        parsedValues.data,
        "endedAt",
        existingTimeEntry.endedAt ?? null
      ),
      hours: getPatchedValue(
        parsedValues.data,
        "hours",
        Number(existingTimeEntry.hours)
      ),
      status: getPatchedValue(parsedValues.data, "status", existingTimeEntry.status),
      notes: getPatchedValue(
        parsedValues.data,
        "notes",
        existingTimeEntry.notes ?? null
      ),
    };

    const validatedValues = CreateTimeEntrySchema.safeParse({
      ...mergedValues,
      jobOccurrenceId: mergedValues.jobOccurrenceId ?? undefined,
      startedAt: mergedValues.startedAt ?? undefined,
      endedAt: mergedValues.endedAt ?? undefined,
      notes: mergedValues.notes ?? undefined,
    });
    if (!validatedValues.success) {
      return { error: "La entrada de horas resultante es invalida" };
    }

    await Promise.all([
      assertEmployeeExists(validatedValues.data.employeeId),
      assertJobExists(validatedValues.data.jobId),
      assertOccurrenceBelongsToJob(
        validatedValues.data.jobOccurrenceId,
        validatedValues.data.jobId
      ),
    ]);

    const timeEntry = await db.timeEntry.update({
      where: {
        id: timeEntryId,
      },
      data: {
        employeeId: validatedValues.data.employeeId,
        jobId: validatedValues.data.jobId,
        jobOccurrenceId: mergedValues.jobOccurrenceId,
        workDate: validatedValues.data.workDate,
        startedAt: mergedValues.startedAt,
        endedAt: mergedValues.endedAt,
        hours: validatedValues.data.hours,
        status: validatedValues.data.status,
        notes: mergedValues.notes,
        approvedAt:
          validatedValues.data.status === "APPROVED"
            ? existingTimeEntry.approvedAt ?? new Date()
            : null,
        approvedById:
          validatedValues.data.status === "APPROVED"
            ? existingTimeEntry.approvedById ?? session.user.id
            : null,
        updatedById: session.user.id,
      },
    });

    return { success: "Entrada de horas actualizada", timeEntry };
  } catch (error) {
    console.error("Error updating time entry:", error);
    return {
      error: getActionErrorMessage(
        error,
        "Error al actualizar la entrada de horas"
      ),
    };
  }
};

export const setTimeEntryStatus = async (
  timeEntryId: string,
  values: unknown
) => {
  try {
    const session = await requireAdminSession();
    const existingTimeEntry = await assertTimeEntryExists(timeEntryId);

    const parsedValues = SetTimeEntryStatusSchema.safeParse(values);
    if (!parsedValues.success) {
      return { error: "Estado invalido para la entrada de horas" };
    }

    const timeEntry = await db.timeEntry.update({
      where: {
        id: timeEntryId,
      },
      data: {
        status: parsedValues.data.status,
        notes: parsedValues.data.notes ?? existingTimeEntry.notes,
        approvedAt:
          parsedValues.data.status === "APPROVED" ? new Date() : null,
        approvedById:
          parsedValues.data.status === "APPROVED" ? session.user.id : null,
        updatedById: session.user.id,
      },
    });

    return { success: "Estado de horas actualizado", timeEntry };
  } catch (error) {
    console.error("Error setting time entry status:", error);
    return {
      error: getActionErrorMessage(error, "Error al actualizar el estado"),
    };
  }
};
