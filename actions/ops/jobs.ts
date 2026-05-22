"use server";

import { Prisma } from "@prisma/client";
import { opsJobListInclude } from "@/data/ops/includes";
import { db } from "@/lib/db";
import { getActionErrorMessage } from "@/lib/ops/action-error";
import { assertJobExists } from "@/lib/ops/assertions";
import { resolveJobBudgetSource } from "@/lib/ops/job-budget-snapshot";
import { resolveJobUpdatePatch } from "@/lib/ops/job-update-patch";
import { hasOwnKey } from "@/lib/ops/patch";
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
      budgetIncludesIva,
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
        budgetIncludesIva,
        sourceBudgetId: sourceBudgetId ?? undefined,
        sourceBudgetOptionId: sourceBudgetOptionId ?? undefined,
        budgetSnapshot:
          (budgetSnapshot ??
            resolvedSource.budgetSnapshot ??
            undefined) as Prisma.InputJsonValue | undefined,
        createdById: session.user.id,
      },
      include: opsJobListInclude,
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

    const patch = resolveJobUpdatePatch(existingJob, parsedValues.data);
    if ("error" in patch) return { error: patch.error };

    const resolvedSource =
      patch.sourceChanged &&
      (patch.nextSourceBudgetId || patch.nextSourceBudgetOptionId)
        ? await resolveJobBudgetSource({
            sourceBudgetId: patch.nextSourceBudgetId,
            sourceBudgetOptionId: patch.nextSourceBudgetOptionId,
          })
        : null;

    const job = await db.job.update({
      where: {
        id: jobId,
      },
      data: {
        name: parsedValues.data.name,
        description: patch.nextDescription,
        serviceAddress: patch.nextServiceAddress,
        serviceLocation: patch.nextServiceLocation,
        operationalNotes: patch.nextOperationalNotes,
        status: parsedValues.data.status,
        jobType: patch.nextJobType,
        punctualStartDate:
          patch.nextJobType === "PUNCTUAL" ? patch.nextPunctualStartDate : null,
        punctualEndDate:
          patch.nextJobType === "PUNCTUAL" ? patch.nextPunctualEndDate : null,
        budgetIncludesIva: parsedValues.data.budgetIncludesIva,
        sourceBudgetId: hasOwnKey(parsedValues.data, "sourceBudgetId")
          ? patch.nextSourceBudgetId
          : undefined,
        sourceBudgetOptionId: hasOwnKey(parsedValues.data, "sourceBudgetId") ||
          hasOwnKey(parsedValues.data, "sourceBudgetOptionId")
          ? patch.nextSourceBudgetOptionId
          : undefined,
        budgetSnapshot:
          hasOwnKey(parsedValues.data, "budgetSnapshot")
            ? parsedValues.data.budgetSnapshot === null
              ? Prisma.DbNull
              : (parsedValues.data.budgetSnapshot as Prisma.InputJsonValue)
            : patch.sourceChanged && resolvedSource?.budgetSnapshot
              ? (resolvedSource.budgetSnapshot as Prisma.InputJsonValue)
              : undefined,
        updatedById: session.user.id,
      },
      include: opsJobListInclude,
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
      include: opsJobListInclude,
    });

    return { success: "Trabajo archivado", job };
  } catch (error) {
    console.error("Error archiving job:", error);
    return {
      error: getActionErrorMessage(error, "Error al archivar el trabajo"),
    };
  }
};
