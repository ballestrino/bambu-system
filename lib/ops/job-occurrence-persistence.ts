import "server-only";

import type { Prisma } from "@prisma/client";

import { opsOccurrenceInclude } from "@/data/ops/includes";
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
    return tx.jobOccurrence.findUniqueOrThrow({
      where: {
        id: occurrence.id,
      },
      include: opsOccurrenceInclude,
    });
  });

// Un lote de visitas: una transacción en forma de arreglo (sin timeout
// interactivo), así un fallo a mitad no deja visitas escritas.
export const createOccurrencesWithEmployees = async (
  rows: Prisma.JobOccurrenceUncheckedCreateInput[],
  employeeIds: string[]
) =>
  db.$transaction(
    rows.map((data) =>
      db.jobOccurrence.create({
        data: {
          ...data,
          employees: { createMany: { data: employeeIds.map((employeeId) => ({ employeeId })) } },
        },
        select: { id: true },
      })
    )
  );

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
    return tx.jobOccurrence.findUniqueOrThrow({
      where: {
        id: occurrence.id,
      },
      include: opsOccurrenceInclude,
    });
  });
