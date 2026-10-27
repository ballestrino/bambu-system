"use server";

import { getActionErrorMessage } from "@/lib/ops/action-error";
import { assertJobExists } from "@/lib/ops/assertions";
import {
  assertOccurrenceEmployeesExist,
  getSubmittedEmployeeIds,
} from "@/lib/ops/job-occurrence-employees";
import {
  createOccurrencesWithEmployees,
  updateOccurrencesWithEmployees,
} from "@/lib/ops/job-occurrence-persistence";
import { prepareOccurrenceUpdate } from "@/lib/ops/job-occurrence-update";
import { requireAdminSession } from "@/lib/require-admin-session";
import { CreateJobOccurrencesSchema, UpdateJobOccurrencesSchema } from "@/schemas/ops";

// Crea varias visitas sueltas de un trabajo: todas o ninguna. Programadas,
// sin regla y sin generatedStartAt, como una visita creada a mano.
export const createJobOccurrences = async (values: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsedValues = CreateJobOccurrencesSchema.safeParse(values);
    if (!parsedValues.success) {
      return { error: "Datos invalidos para crear las visitas" };
    }

    const { jobId, notes, scheduleLabel, visits } = parsedValues.data;
    const employeeIds = getSubmittedEmployeeIds(parsedValues.data);
    await Promise.all([assertJobExists(jobId), assertOccurrenceEmployeesExist(employeeIds)]);

    const occurrences = await createOccurrencesWithEmployees(
      visits.map((visit) => ({
        jobId,
        scheduledStartAt: visit.scheduledStartAt,
        scheduledEndAt: visit.scheduledEndAt,
        status: "SCHEDULED" as const,
        isDetached: false,
        notes,
        scheduleLabel,
        createdById: session.user.id,
      })),
      employeeIds
    );

    return { success: "Visitas creadas", occurrences };
  } catch (error) {
    console.error("Error creating job occurrences:", error);
    return {
      error: getActionErrorMessage(error, "Error al crear las visitas"),
    };
  }
};

// Cambia varias visitas: todas o ninguna. Cada cambio pasa por las mismas
// validaciones que cambiar una (prepareOccurrenceUpdate) antes de escribir.
export const updateJobOccurrences = async (items: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsedItems = UpdateJobOccurrencesSchema.safeParse(items);
    if (!parsedItems.success) {
      return { error: "Datos invalidos para cambiar las visitas" };
    }

    const prepared = await Promise.all(
      parsedItems.data.map((item) => prepareOccurrenceUpdate(item.occurrenceId, item.values, session.user.id))
    );
    const invalid = prepared.find((item) => "error" in item);
    if (invalid && "error" in invalid) {
      return { error: invalid.error };
    }

    const occurrences = await updateOccurrencesWithEmployees(
      prepared.flatMap((item) => ("error" in item ? [] : [item]))
    );
    return { success: "Visitas actualizadas", occurrences };
  } catch (error) {
    console.error("Error updating job occurrences:", error);
    return {
      error: getActionErrorMessage(error, "Error al cambiar las visitas"),
    };
  }
};
