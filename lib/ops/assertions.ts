import "server-only";

import { db } from "@/lib/db";

export const assertJobExists = async (jobId: string) => {
  const job = await db.job.findUnique({
    where: {
      id: jobId,
    },
  });

  if (!job) {
    throw new Error("El trabajo no existe");
  }

  return job;
};

export const assertEmployeeExists = async (employeeId: string) => {
  const employee = await db.employee.findUnique({
    where: {
      id: employeeId,
    },
  });

  if (!employee) {
    throw new Error("La empleada no existe");
  }

  return employee;
};

export const assertScheduleRuleExists = async (scheduleRuleId: string) => {
  const scheduleRule = await db.jobScheduleRule.findUnique({
    where: {
      id: scheduleRuleId,
    },
  });

  if (!scheduleRule) {
    throw new Error("La regla del calendario no existe");
  }

  return scheduleRule;
};

export const assertOccurrenceExists = async (occurrenceId: string) => {
  const occurrence = await db.jobOccurrence.findUnique({
    where: {
      id: occurrenceId,
    },
  });

  if (!occurrence) {
    throw new Error("La ocurrencia no existe");
  }

  return occurrence;
};

export const assertOccurrenceBelongsToJob = async (
  occurrenceId: string | undefined,
  jobId: string
) => {
  if (!occurrenceId) {
    return;
  }

  const occurrence = await assertOccurrenceExists(occurrenceId);
  if (occurrence.jobId !== jobId) {
    throw new Error("La ocurrencia no pertenece al trabajo seleccionado");
  }
};

export const assertOccurrenceRuleBelongsToJob = async (
  scheduleRuleId: string | undefined,
  jobId: string
) => {
  if (!scheduleRuleId) {
    return;
  }

  const scheduleRule = await assertScheduleRuleExists(scheduleRuleId);
  if (scheduleRule.jobId !== jobId) {
    throw new Error("La regla no pertenece al trabajo seleccionado");
  }
};

export const assertAssignmentExists = async (assignmentId: string) => {
  const assignment = await db.jobEmployeeAssignment.findUnique({
    where: {
      id: assignmentId,
    },
  });

  if (!assignment) {
    throw new Error("La asignacion no existe");
  }

  return assignment;
};

export const assertTimeEntryExists = async (timeEntryId: string) => {
  const timeEntry = await db.timeEntry.findUnique({
    where: {
      id: timeEntryId,
    },
  });

  if (!timeEntry) {
    throw new Error("La entrada de horas no existe");
  }

  return timeEntry;
};

export const assertJobClientPaymentExists = async (
  jobClientPaymentId: string
) => {
  const jobClientPayment = await db.jobClientPayment.findUnique({
    where: {
      id: jobClientPaymentId,
    },
  });

  if (!jobClientPayment) {
    throw new Error("El cobro del trabajo no existe");
  }

  return jobClientPayment;
};

export const assertEmployeePaymentExists = async (employeePaymentId: string) => {
  const employeePayment = await db.employeePayment.findUnique({
    where: {
      id: employeePaymentId,
    },
  });

  if (!employeePayment) {
    throw new Error("El pago a la empleada no existe");
  }

  return employeePayment;
};
