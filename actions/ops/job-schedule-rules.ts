"use server";

import { db } from "@/lib/db";
import { getActionErrorMessage } from "@/lib/ops/action-error";
import {
  assertJobExists,
  assertScheduleRuleExists,
} from "@/lib/ops/assertions";
import { getPatchedValue } from "@/lib/ops/patch";
import { requireAdminSession } from "@/lib/require-admin-session";
import {
  CreateJobScheduleRuleSchema,
  UpdateJobScheduleRuleSchema,
} from "@/schemas/ops";

export const createJobScheduleRule = async (values: unknown) => {
  try {
    const session = await requireAdminSession();

    const parsedValues = CreateJobScheduleRuleSchema.safeParse(values);
    if (!parsedValues.success) {
      return { error: "Datos invalidos para crear la regla" };
    }

    await assertJobExists(parsedValues.data.jobId);

    const scheduleRule = await db.jobScheduleRule.create({
      data: {
        ...parsedValues.data,
        createdById: session.user.id,
      },
    });

    return { success: "Regla creada", scheduleRule };
  } catch (error) {
    console.error("Error creating job schedule rule:", error);
    return {
      error: getActionErrorMessage(error, "Error al crear la regla"),
    };
  }
};

export const updateJobScheduleRule = async (
  scheduleRuleId: string,
  values: unknown
) => {
  try {
    const session = await requireAdminSession();
    const existingScheduleRule = await assertScheduleRuleExists(scheduleRuleId);

    const parsedValues = UpdateJobScheduleRuleSchema.safeParse(values);
    if (!parsedValues.success) {
      return { error: "Datos invalidos para actualizar la regla" };
    }

    const mergedValues = {
      jobId: existingScheduleRule.jobId,
      isActive: getPatchedValue(
        parsedValues.data,
        "isActive",
        existingScheduleRule.isActive
      ),
      frequency: getPatchedValue(
        parsedValues.data,
        "frequency",
        existingScheduleRule.frequency
      ),
      interval: getPatchedValue(
        parsedValues.data,
        "interval",
        existingScheduleRule.interval
      ),
      weekdays: getPatchedValue(
        parsedValues.data,
        "weekdays",
        existingScheduleRule.weekdays
      ),
      dayOfMonth: getPatchedValue(
        parsedValues.data,
        "dayOfMonth",
        existingScheduleRule.dayOfMonth ?? null
      ),
      startDate: getPatchedValue(
        parsedValues.data,
        "startDate",
        existingScheduleRule.startDate
      ),
      endDate: getPatchedValue(
        parsedValues.data,
        "endDate",
        existingScheduleRule.endDate ?? null
      ),
      startTimeMinutes: getPatchedValue(
        parsedValues.data,
        "startTimeMinutes",
        existingScheduleRule.startTimeMinutes
      ),
      durationMinutes: getPatchedValue(
        parsedValues.data,
        "durationMinutes",
        existingScheduleRule.durationMinutes
      ),
      timezone: getPatchedValue(
        parsedValues.data,
        "timezone",
        existingScheduleRule.timezone
      ),
    };

    const validatedValues = CreateJobScheduleRuleSchema.safeParse({
      ...mergedValues,
      dayOfMonth: mergedValues.dayOfMonth ?? undefined,
      endDate: mergedValues.endDate ?? undefined,
    });
    if (!validatedValues.success) {
      return { error: "La regla resultante es invalida" };
    }

    const scheduleRule = await db.jobScheduleRule.update({
      where: {
        id: scheduleRuleId,
      },
      data: {
        isActive: validatedValues.data.isActive,
        frequency: validatedValues.data.frequency,
        interval: validatedValues.data.interval,
        weekdays: validatedValues.data.weekdays,
        dayOfMonth: mergedValues.dayOfMonth,
        startDate: validatedValues.data.startDate,
        endDate: mergedValues.endDate,
        startTimeMinutes: validatedValues.data.startTimeMinutes,
        durationMinutes: validatedValues.data.durationMinutes,
        timezone: validatedValues.data.timezone,
        updatedById: session.user.id,
      },
    });

    return { success: "Regla actualizada", scheduleRule };
  } catch (error) {
    console.error("Error updating job schedule rule:", error);
    return {
      error: getActionErrorMessage(error, "Error al actualizar la regla"),
    };
  }
};

export const archiveJobScheduleRule = async (scheduleRuleId: string) => {
  try {
    const session = await requireAdminSession();
    await assertScheduleRuleExists(scheduleRuleId);

    const scheduleRule = await db.jobScheduleRule.update({
      where: {
        id: scheduleRuleId,
      },
      data: {
        isActive: false,
        updatedById: session.user.id,
      },
    });

    return { success: "Regla archivada", scheduleRule };
  } catch (error) {
    console.error("Error archiving job schedule rule:", error);
    return {
      error: getActionErrorMessage(error, "Error al archivar la regla"),
    };
  }
};
