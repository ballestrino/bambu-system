"use server";

import { db } from "@/lib/db";
import { getActionErrorMessage } from "@/lib/ops/action-error";
import {
  assertEmployeeExists,
  assertEmployeePaymentExists,
} from "@/lib/ops/assertions";
import { getPatchedValue } from "@/lib/ops/patch";
import { requireAdminSession } from "@/lib/require-admin-session";
import {
  CreateEmployeePaymentSchema,
  UpdateEmployeePaymentSchema,
} from "@/schemas/ops";

export const createEmployeePayment = async (values: unknown) => {
  try {
    const session = await requireAdminSession();

    const parsedValues = CreateEmployeePaymentSchema.safeParse(values);
    if (!parsedValues.success) {
      return { error: "Datos invalidos para crear el pago" };
    }

    await assertEmployeeExists(parsedValues.data.employeeId);

    const employeePayment = await db.employeePayment.create({
      data: {
        ...parsedValues.data,
        createdById: session.user.id,
      },
    });

    return { success: "Pago creado", employeePayment };
  } catch (error) {
    console.error("Error creating employee payment:", error);
    return {
      error: getActionErrorMessage(error, "Error al crear el pago"),
    };
  }
};

export const updateEmployeePayment = async (
  employeePaymentId: string,
  values: unknown
) => {
  try {
    const session = await requireAdminSession();
    const existingEmployeePayment = await assertEmployeePaymentExists(
      employeePaymentId
    );

    const parsedValues = UpdateEmployeePaymentSchema.safeParse(values);
    if (!parsedValues.success) {
      return { error: "Datos invalidos para actualizar el pago" };
    }

    const mergedValues = {
      employeeId: existingEmployeePayment.employeeId,
      periodStart: getPatchedValue(
        parsedValues.data,
        "periodStart",
        existingEmployeePayment.periodStart
      ),
      periodEnd: getPatchedValue(
        parsedValues.data,
        "periodEnd",
        existingEmployeePayment.periodEnd
      ),
      paymentDate: getPatchedValue(
        parsedValues.data,
        "paymentDate",
        existingEmployeePayment.paymentDate
      ),
      amount: getPatchedValue(
        parsedValues.data,
        "amount",
        Number(existingEmployeePayment.amount)
      ),
      reference: getPatchedValue(
        parsedValues.data,
        "reference",
        existingEmployeePayment.reference ?? null
      ),
      notes: getPatchedValue(
        parsedValues.data,
        "notes",
        existingEmployeePayment.notes ?? null
      ),
      status: getPatchedValue(
        parsedValues.data,
        "status",
        existingEmployeePayment.status
      ),
    };

    const validatedValues = CreateEmployeePaymentSchema.safeParse(mergedValues);
    if (!validatedValues.success) {
      return { error: "El pago resultante es invalido" };
    }

    const employeePayment = await db.employeePayment.update({
      where: {
        id: employeePaymentId,
      },
      data: {
        periodStart: validatedValues.data.periodStart,
        periodEnd: validatedValues.data.periodEnd,
        paymentDate: validatedValues.data.paymentDate,
        amount: validatedValues.data.amount,
        reference: mergedValues.reference,
        notes: mergedValues.notes,
        status: validatedValues.data.status,
        updatedById: session.user.id,
      },
    });

    return { success: "Pago actualizado", employeePayment };
  } catch (error) {
    console.error("Error updating employee payment:", error);
    return {
      error: getActionErrorMessage(error, "Error al actualizar el pago"),
    };
  }
};

export const voidEmployeePayment = async (employeePaymentId: string) => {
  try {
    const session = await requireAdminSession();
    await assertEmployeePaymentExists(employeePaymentId);

    const employeePayment = await db.employeePayment.update({
      where: {
        id: employeePaymentId,
      },
      data: {
        status: "VOIDED",
        updatedById: session.user.id,
      },
    });

    return { success: "Pago anulado", employeePayment };
  } catch (error) {
    console.error("Error voiding employee payment:", error);
    return {
      error: getActionErrorMessage(error, "Error al anular el pago"),
    };
  }
};
