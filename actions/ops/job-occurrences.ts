"use server";

import { db } from "@/lib/db";
import { getActionErrorMessage } from "@/lib/ops/action-error";
import {
  assertJobExists,
  assertOccurrenceExists,
  assertOccurrenceRuleBelongsToJob,
} from "@/lib/ops/assertions";
import {
  buildResolvedJobOccurrence,
  validateResolvedJobOccurrence,
} from "@/lib/ops/job-occurrence-patch";
import { requireAdminSession } from "@/lib/require-admin-session";
import {
  CreateJobOccurrenceSchema,
  DetachJobOccurrenceSchema,
  UpdateJobOccurrenceSchema,
} from "@/schemas/ops";

export const createJobOccurrence = async (values: unknown) => {
  try {
    const session = await requireAdminSession();

    const parsedValues = CreateJobOccurrenceSchema.safeParse(values);
    if (!parsedValues.success) {
      return { error: "Datos invalidos para crear la ocurrencia" };
    }

    await assertJobExists(parsedValues.data.jobId);
    await assertOccurrenceRuleBelongsToJob(
      parsedValues.data.scheduleRuleId,
      parsedValues.data.jobId
    );

    const occurrence = await db.jobOccurrence.create({
      data: {
        ...parsedValues.data,
        createdById: session.user.id,
      },
    });

    return { success: "Ocurrencia creada", occurrence };
  } catch (error) {
    console.error("Error creating job occurrence:", error);
    return {
      error: getActionErrorMessage(error, "Error al crear la ocurrencia"),
    };
  }
};

export const updateJobOccurrence = async (
  occurrenceId: string,
  values: unknown
) => {
  try {
    const session = await requireAdminSession();
    const existingOccurrence = await assertOccurrenceExists(occurrenceId);

    const parsedValues = UpdateJobOccurrenceSchema.safeParse(values);
    if (!parsedValues.success) {
      return { error: "Datos invalidos para actualizar la ocurrencia" };
    }

    const mergedValues = buildResolvedJobOccurrence(
      existingOccurrence,
      parsedValues.data
    );
    const validatedValues = validateResolvedJobOccurrence(mergedValues);
    if (!validatedValues.success) {
      return { error: "La ocurrencia resultante es invalida" };
    }

    const occurrence = await db.jobOccurrence.update({
      where: {
        id: occurrenceId,
      },
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
    });

    return { success: "Ocurrencia actualizada", occurrence };
  } catch (error) {
    console.error("Error updating job occurrence:", error);
    return {
      error: getActionErrorMessage(error, "Error al actualizar la ocurrencia"),
    };
  }
};

export const detachJobOccurrence = async (
  occurrenceId: string,
  values?: unknown
) => {
  try {
    const session = await requireAdminSession();
    const existingOccurrence = await assertOccurrenceExists(occurrenceId);

    const parsedValues = DetachJobOccurrenceSchema.safeParse(values ?? {});
    if (!parsedValues.success) {
      return { error: "Datos invalidos para despegar la ocurrencia" };
    }

    const mergedValues = buildResolvedJobOccurrence(existingOccurrence, parsedValues.data, {
      isDetached: true,
      scheduleRuleId: undefined,
    });
    const validatedValues = validateResolvedJobOccurrence(mergedValues);
    if (!validatedValues.success) {
      return { error: "La ocurrencia despejada es invalida" };
    }

    const occurrence = await db.jobOccurrence.update({
      where: {
        id: occurrenceId,
      },
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
    });

    return { success: "Ocurrencia separada de la regla", occurrence };
  } catch (error) {
    console.error("Error detaching job occurrence:", error);
    return {
      error: getActionErrorMessage(
        error,
        "Error al separar la ocurrencia de la regla"
      ),
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
