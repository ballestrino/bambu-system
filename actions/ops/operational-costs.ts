"use server";

import { db } from "@/lib/db";
import { getActionErrorMessage } from "@/lib/ops/action-error";
import {
  assertEmployeeExists,
  assertJobExists,
  assertOperationalCostCategoryExists,
  assertOperationalCostExists,
} from "@/lib/ops/assertions";
import { getPatchedValue } from "@/lib/ops/patch";
import { requireAdminSession } from "@/lib/require-admin-session";
import {
  CreateOperationalCostCategorySchema,
  CreateOperationalCostSchema,
  OpsCostSettingsSchema,
  UpdateOperationalCostCategorySchema,
  UpdateOperationalCostSchema,
} from "@/schemas/ops";

const assertOptionalLinks = async (values: {
  employeeId?: string | null;
  jobId?: string | null;
}) => {
  await Promise.all([
    values.employeeId ? assertEmployeeExists(values.employeeId) : undefined,
    values.jobId ? assertJobExists(values.jobId) : undefined,
  ]);
};

export const createOperationalCostCategory = async (values: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsedValues = CreateOperationalCostCategorySchema.safeParse(values);
    if (!parsedValues.success) {
      return { error: "Datos invalidos para crear la categoria" };
    }

    const category = await db.operationalCostCategory.create({
      data: { ...parsedValues.data, createdById: session.user.id },
    });

    return { success: "Categoria creada", category };
  } catch (error) {
    console.error("Error creating operational cost category:", error);
    return { error: getActionErrorMessage(error, "Error al crear la categoria") };
  }
};

export const updateOperationalCostCategory = async (
  categoryId: string,
  values: unknown
) => {
  try {
    const session = await requireAdminSession();
    await assertOperationalCostCategoryExists(categoryId);
    const parsedValues = UpdateOperationalCostCategorySchema.safeParse(values);
    if (!parsedValues.success) {
      return { error: "Datos invalidos para actualizar la categoria" };
    }

    const category = await db.operationalCostCategory.update({
      where: { id: categoryId },
      data: { ...parsedValues.data, updatedById: session.user.id },
    });

    return { success: "Categoria actualizada", category };
  } catch (error) {
    console.error("Error updating operational cost category:", error);
    return { error: getActionErrorMessage(error, "Error al actualizar la categoria") };
  }
};

export const archiveOperationalCostCategory = async (categoryId: string) => {
  try {
    const session = await requireAdminSession();
    await assertOperationalCostCategoryExists(categoryId);

    const category = await db.operationalCostCategory.update({
      where: { id: categoryId },
      data: { archivedAt: new Date(), isActive: false, updatedById: session.user.id },
    });

    return { success: "Categoria archivada", category };
  } catch (error) {
    console.error("Error archiving operational cost category:", error);
    return { error: getActionErrorMessage(error, "Error al archivar la categoria") };
  }
};

export const createOperationalCost = async (values: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsedValues = CreateOperationalCostSchema.safeParse(values);
    if (!parsedValues.success) {
      return { error: "Datos invalidos para crear el coste" };
    }

    await Promise.all([
      assertOperationalCostCategoryExists(parsedValues.data.categoryId),
      assertOptionalLinks(parsedValues.data),
    ]);

    const cost = await db.operationalCost.create({
      data: { ...parsedValues.data, createdById: session.user.id },
    });

    return { success: "Coste creado", cost };
  } catch (error) {
    console.error("Error creating operational cost:", error);
    return { error: getActionErrorMessage(error, "Error al crear el coste") };
  }
};

export const updateOperationalCost = async (costId: string, values: unknown) => {
  try {
    const session = await requireAdminSession();
    const existingCost = await assertOperationalCostExists(costId);
    const parsedValues = UpdateOperationalCostSchema.safeParse(values);
  if (!parsedValues.success) {
      return { error: "Datos invalidos para actualizar el coste" };
    }
    const mergedValues = {
      categoryId: getPatchedValue(parsedValues.data, "categoryId", existingCost.categoryId),
      costDate: getPatchedValue(parsedValues.data, "costDate", existingCost.costDate),
      amount: getPatchedValue(parsedValues.data, "amount", Number(existingCost.amount)),
      employeeId: getPatchedValue(parsedValues.data, "employeeId", existingCost.employeeId),
      jobId: getPatchedValue(parsedValues.data, "jobId", existingCost.jobId),
      notes: getPatchedValue(parsedValues.data, "notes", existingCost.notes ?? null),
      reference: getPatchedValue(parsedValues.data, "reference", existingCost.reference ?? null),
      status: getPatchedValue(parsedValues.data, "status", existingCost.status),
    };
    const validatedValues = CreateOperationalCostSchema.safeParse(mergedValues);
    if (!validatedValues.success) {
      return { error: "El coste resultante es invalido" };
    }
    await Promise.all([
      assertOperationalCostCategoryExists(validatedValues.data.categoryId),
      assertOptionalLinks(validatedValues.data),
    ]);

    const cost = await db.operationalCost.update({
      where: { id: costId },
      data: {
        amount: validatedValues.data.amount,
        categoryId: validatedValues.data.categoryId,
        costDate: validatedValues.data.costDate,
        employeeId: validatedValues.data.employeeId,
        jobId: validatedValues.data.jobId,
        notes: mergedValues.notes,
        reference: mergedValues.reference,
        status: validatedValues.data.status,
        updatedById: session.user.id,
      },
    });

    return { success: "Coste actualizado", cost };
  } catch (error) {
    console.error("Error updating operational cost:", error);
    return { error: getActionErrorMessage(error, "Error al actualizar el coste") };
  }
};

export const voidOperationalCost = async (costId: string) => {
  try {
    const session = await requireAdminSession();
    await assertOperationalCostExists(costId);

    const cost = await db.operationalCost.update({
      where: { id: costId },
      data: { status: "VOIDED", updatedById: session.user.id },
    });

    return { success: "Coste anulado", cost };
  } catch (error) {
    console.error("Error voiding operational cost:", error);
    return { error: getActionErrorMessage(error, "Error al anular el coste") };
  }
};

export const updateOpsCostSettings = async (values: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsedValues = OpsCostSettingsSchema.safeParse(values);
    if (!parsedValues.success) {
      return { error: "Datos invalidos para actualizar la configuracion" };
    }

    const settings = await db.opsCostSettings.upsert({
      where: { id: "default" },
      create: { id: "default", ...parsedValues.data, updatedById: session.user.id },
      update: { ...parsedValues.data, updatedById: session.user.id },
    });

    return { success: "Configuracion actualizada", settings };
  } catch (error) {
    console.error("Error updating cost settings:", error);
    return { error: getActionErrorMessage(error, "Error al actualizar configuracion") };
  }
};
