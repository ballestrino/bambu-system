"use server";

import { getActionErrorMessage } from "@/lib/ops/action-error";
import { assertJobExists } from "@/lib/ops/assertions";
import {
  assertOccurrenceEmployeesExist,
  getSubmittedEmployeeIds,
} from "@/lib/ops/job-occurrence-employees";
import { createOccurrencesWithEmployees } from "@/lib/ops/job-occurrence-persistence";
import { requireAdminSession } from "@/lib/require-admin-session";
import { CreateJobOccurrencesSchema } from "@/schemas/ops";

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
