import "server-only";

import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { syncOccurrenceEmployees } from "@/lib/ops/job-occurrence-employees";

export const stripOccurrenceEmployeeInputs = <
  T extends { employeeIds?: string[] },
>(
  values: T
) => {
  const data = { ...values };
  delete data.employeeIds;

  return data as Omit<T, "employeeIds">;
};

export const createOccurrenceWithEmployees = async (
  data: Prisma.JobOccurrenceUncheckedCreateInput,
  employeeIds: string[]
) =>
  db.$transaction(async (tx) => {
    const occurrence = await tx.jobOccurrence.create({
      data,
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
      data,
    });

    await syncOccurrenceEmployees(tx, occurrenceId, employeeIds);
    return occurrence;
  });
