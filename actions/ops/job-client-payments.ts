"use server";

import { db } from "@/lib/db";
import { getActionErrorMessage } from "@/lib/ops/action-error";
import {
  assertJobClientPaymentExists,
  assertJobExists,
} from "@/lib/ops/assertions";
import { getPatchedValue } from "@/lib/ops/patch";
import { requireAdminSession } from "@/lib/require-admin-session";
import {
  CreateJobClientPaymentSchema,
  UpdateJobClientPaymentSchema,
} from "@/schemas/ops";

export const createJobClientPayment = async (values: unknown) => {
  try {
    const session = await requireAdminSession();

    const parsedValues = CreateJobClientPaymentSchema.safeParse(values);
    if (!parsedValues.success) {
      return { error: "Datos invalidos para crear el cobro" };
    }

    await assertJobExists(parsedValues.data.jobId);

    const clientPayment = await db.jobClientPayment.create({
      data: {
        ...parsedValues.data,
        createdById: session.user.id,
      },
    });

    return { success: "Cobro creado", clientPayment };
  } catch (error) {
    console.error("Error creating job client payment:", error);
    return {
      error: getActionErrorMessage(error, "Error al crear el cobro"),
    };
  }
};

export const updateJobClientPayment = async (
  jobClientPaymentId: string,
  values: unknown
) => {
  try {
    const session = await requireAdminSession();
    const existingClientPayment = await assertJobClientPaymentExists(
      jobClientPaymentId
    );

    const parsedValues = UpdateJobClientPaymentSchema.safeParse(values);
    if (!parsedValues.success) {
      return { error: "Datos invalidos para actualizar el cobro" };
    }

    const mergedValues = {
      jobId: existingClientPayment.jobId,
      paymentDate: getPatchedValue(
        parsedValues.data,
        "paymentDate",
        existingClientPayment.paymentDate
      ),
      amount: getPatchedValue(
        parsedValues.data,
        "amount",
        Number(existingClientPayment.amount)
      ),
      reference: getPatchedValue(
        parsedValues.data,
        "reference",
        existingClientPayment.reference ?? null
      ),
      notes: getPatchedValue(
        parsedValues.data,
        "notes",
        existingClientPayment.notes ?? null
      ),
      status: getPatchedValue(
        parsedValues.data,
        "status",
        existingClientPayment.status
      ),
    };

    const validatedValues = CreateJobClientPaymentSchema.safeParse(mergedValues);
    if (!validatedValues.success) {
      return { error: "El cobro resultante es invalido" };
    }

    const clientPayment = await db.jobClientPayment.update({
      where: {
        id: jobClientPaymentId,
      },
      data: {
        paymentDate: validatedValues.data.paymentDate,
        amount: validatedValues.data.amount,
        reference: mergedValues.reference,
        notes: mergedValues.notes,
        status: validatedValues.data.status,
        updatedById: session.user.id,
      },
    });

    return { success: "Cobro actualizado", clientPayment };
  } catch (error) {
    console.error("Error updating job client payment:", error);
    return {
      error: getActionErrorMessage(error, "Error al actualizar el cobro"),
    };
  }
};

export const voidJobClientPayment = async (jobClientPaymentId: string) => {
  try {
    const session = await requireAdminSession();
    await assertJobClientPaymentExists(jobClientPaymentId);

    const clientPayment = await db.jobClientPayment.update({
      where: {
        id: jobClientPaymentId,
      },
      data: {
        status: "VOIDED",
        updatedById: session.user.id,
      },
    });

    return { success: "Cobro anulado", clientPayment };
  } catch (error) {
    console.error("Error voiding job client payment:", error);
    return {
      error: getActionErrorMessage(error, "Error al anular el cobro"),
    };
  }
};
