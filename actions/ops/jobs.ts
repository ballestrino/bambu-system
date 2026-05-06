"use server";

import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { getActionErrorMessage } from "@/lib/ops/action-error";
import { assertJobExists } from "@/lib/ops/assertions";
import { resolveJobBudgetSource } from "@/lib/ops/job-budget-snapshot";
import { getPatchedValue, hasOwnKey } from "@/lib/ops/patch";
import { requireAdminSession } from "@/lib/require-admin-session";
import { CreateJobSchema, UpdateJobSchema } from "@/schemas/ops";

export const createJob = async (values: unknown) => {
  try {
    const session = await requireAdminSession();

    const parsedValues = CreateJobSchema.safeParse(values);
    if (!parsedValues.success) {
      return { error: "Datos invalidos para crear el trabajo" };
    }

    const {
      sourceBudgetId,
      sourceBudgetOptionId,
      budgetSnapshot,
      ...jobData
    } = parsedValues.data;

    const resolvedSource = await resolveJobBudgetSource({
      sourceBudgetId,
      sourceBudgetOptionId,
    });

    const job = await db.job.create({
      data: {
        ...jobData,
        sourceBudgetId: sourceBudgetId ?? undefined,
        sourceBudgetOptionId: sourceBudgetOptionId ?? undefined,
        budgetSnapshot:
          (budgetSnapshot ??
            resolvedSource.budgetSnapshot ??
            undefined) as Prisma.InputJsonValue | undefined,
        createdById: session.user.id,
      },
      include: {
        sourceBudget: true,
        sourceBudgetOption: true,
      },
    });

    return { success: "Trabajo creado", job };
  } catch (error) {
    console.error("Error creating job:", error);
    return {
      error: getActionErrorMessage(error, "Error al crear el trabajo"),
    };
  }
};

export const updateJob = async (jobId: string, values: unknown) => {
  try {
    const session = await requireAdminSession();
    const existingJob = await assertJobExists(jobId);

    const parsedValues = UpdateJobSchema.safeParse(values);
    if (!parsedValues.success) {
      return { error: "Datos invalidos para actualizar el trabajo" };
    }

    const nextDescription = getPatchedValue(
      parsedValues.data,
      "description",
      existingJob.description ?? null
    );
    const nextServiceAddress = getPatchedValue(
      parsedValues.data,
      "serviceAddress",
      existingJob.serviceAddress ?? null
    );
    const nextServiceLocation = getPatchedValue(
      parsedValues.data,
      "serviceLocation",
      existingJob.serviceLocation ?? null
    );
    const nextOperationalNotes = getPatchedValue(
      parsedValues.data,
      "operationalNotes",
      existingJob.operationalNotes ?? null
    );
    const nextSourceBudgetId =
      hasOwnKey(parsedValues.data, "sourceBudgetId")
        ? parsedValues.data.sourceBudgetId
        : existingJob.sourceBudgetId;

    const nextSourceBudgetOptionId =
      nextSourceBudgetId === null
        ? null
        : hasOwnKey(parsedValues.data, "sourceBudgetOptionId")
          ? parsedValues.data.sourceBudgetOptionId
          : existingJob.sourceBudgetOptionId;

    if (nextSourceBudgetOptionId && !nextSourceBudgetId) {
      return {
        error: "No puedes asociar una opcion sin seleccionar un presupuesto",
      };
    }

    const sourceChanged =
      nextSourceBudgetId !== existingJob.sourceBudgetId ||
      nextSourceBudgetOptionId !== existingJob.sourceBudgetOptionId;

    const resolvedSource =
      sourceChanged && (nextSourceBudgetId || nextSourceBudgetOptionId)
        ? await resolveJobBudgetSource({
            sourceBudgetId: nextSourceBudgetId,
            sourceBudgetOptionId: nextSourceBudgetOptionId,
          })
        : null;

    const job = await db.job.update({
      where: {
        id: jobId,
      },
      data: {
        name: parsedValues.data.name,
        description: nextDescription,
        serviceAddress: nextServiceAddress,
        serviceLocation: nextServiceLocation,
        operationalNotes: nextOperationalNotes,
        status: parsedValues.data.status,
        sourceBudgetId: hasOwnKey(parsedValues.data, "sourceBudgetId")
          ? nextSourceBudgetId
          : undefined,
        sourceBudgetOptionId: hasOwnKey(parsedValues.data, "sourceBudgetId") ||
          hasOwnKey(parsedValues.data, "sourceBudgetOptionId")
          ? nextSourceBudgetOptionId
          : undefined,
        budgetSnapshot:
          hasOwnKey(parsedValues.data, "budgetSnapshot")
            ? parsedValues.data.budgetSnapshot === null
              ? Prisma.DbNull
              : (parsedValues.data.budgetSnapshot as Prisma.InputJsonValue)
            : sourceChanged && resolvedSource?.budgetSnapshot
              ? (resolvedSource.budgetSnapshot as Prisma.InputJsonValue)
              : undefined,
        updatedById: session.user.id,
      },
      include: {
        sourceBudget: true,
        sourceBudgetOption: true,
      },
    });

    return { success: "Trabajo actualizado", job };
  } catch (error) {
    console.error("Error updating job:", error);
    return {
      error: getActionErrorMessage(error, "Error al actualizar el trabajo"),
    };
  }
};

export const archiveJob = async (jobId: string) => {
  try {
    const session = await requireAdminSession();
    await assertJobExists(jobId);

    const job = await db.job.update({
      where: {
        id: jobId,
      },
      data: {
        status: "ARCHIVED",
        archivedAt: new Date(),
        updatedById: session.user.id,
      },
    });

    return { success: "Trabajo archivado", job };
  } catch (error) {
    console.error("Error archiving job:", error);
    return {
      error: getActionErrorMessage(error, "Error al archivar el trabajo"),
    };
  }
};
