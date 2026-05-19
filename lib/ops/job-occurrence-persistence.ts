import "server-only";

import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { syncOccurrenceEmployees } from "@/lib/ops/job-occurrence-employees";

export const stripOccurrenceEmployeeInputs = <
  T extends { employeeId?: string | null; employeeIds?: string[] },
>(
  values: T
) => {
  const data = { ...values };
  delete data.employeeId;
  delete data.employeeIds;

  return data as Omit<T, "employeeId" | "employeeIds">;
};

export const createOccurrenceWithEmployees = async (
  data: Omit<Prisma.JobOccurrenceUncheckedCreateInput, "employeeId">,
  employeeIds: string[]
) =>
  db.$transaction(async (tx) => {
    const occurrence = await tx.jobOccurrence.create({
      data: {
        ...data,
        employeeId: employeeIds[0] ?? null,
      },
    });

    await syncOccurrenceEmployees(tx, occurrence.id, employeeIds);
    return occurrence;
  });

export const updateOccurrenceWithEmployees = async ({
  data,
  employeeIds,
  occurrenceId,
}: {
  data: Prisma.JobOccurrenceUncheckedUpdateInput;
  employeeIds: string[];
  occurrenceId: string;
}) =>
  db.$transaction(async (tx) => {
    const occurrence = await tx.jobOccurrence.update({
      where: {
        id: occurrenceId,
      },
      data: {
        ...data,
        employeeId: employeeIds[0] ?? null,
      },
    });

    await syncOccurrenceEmployees(tx, occurrenceId, employeeIds);
    return occurrence;
  });
