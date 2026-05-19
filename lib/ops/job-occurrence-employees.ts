import "server-only";

import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

type EmployeePatch = {
  employeeId?: string | null;
  employeeIds?: string[];
};

type OccurrenceEmployeeClient = Pick<
  Prisma.TransactionClient,
  "jobOccurrenceEmployee"
>;

export const getUniqueEmployeeIds = (employeeIds: string[]) =>
  Array.from(new Set(employeeIds));

export const getSubmittedEmployeeIds = (values: EmployeePatch) => {
  if (values.employeeIds?.length) {
    return getUniqueEmployeeIds(values.employeeIds);
  }

  return values.employeeId ? [values.employeeId] : [];
};

export const getPatchedEmployeeIds = ({
  existingEmployeeIds,
  legacyEmployeeId,
  patch,
}: {
  existingEmployeeIds: string[];
  legacyEmployeeId?: string | null;
  patch: EmployeePatch;
}) => {
  if (
    Object.prototype.hasOwnProperty.call(patch, "employeeIds") &&
    patch.employeeIds !== undefined
  ) {
    return getUniqueEmployeeIds(patch.employeeIds);
  }

  if (
    Object.prototype.hasOwnProperty.call(patch, "employeeId") &&
    patch.employeeId !== undefined
  ) {
    return patch.employeeId ? [patch.employeeId] : [];
  }

  return existingEmployeeIds.length
    ? getUniqueEmployeeIds(existingEmployeeIds)
    : legacyEmployeeId
      ? [legacyEmployeeId]
      : [];
};

export const getOccurrenceEmployeeIds = async (jobOccurrenceId: string) => {
  const employees = await db.jobOccurrenceEmployee.findMany({
    where: { jobOccurrenceId },
    select: { employeeId: true },
    orderBy: { createdAt: "asc" },
  });

  return employees.map((employee) => employee.employeeId);
};

export const assertOccurrenceEmployeesExist = async (employeeIds: string[]) => {
  if (!employeeIds.length) {
    return;
  }

  const employees = await db.employee.findMany({
    where: { id: { in: getUniqueEmployeeIds(employeeIds) } },
    select: { id: true },
  });

  if (employees.length !== getUniqueEmployeeIds(employeeIds).length) {
    throw new Error("Una o mas empleadas no existen");
  }
};

export const createOccurrenceEmployeeRows = async (
  client: OccurrenceEmployeeClient,
  rows: { employeeId: string; jobOccurrenceId: string }[]
) => {
  if (!rows.length) {
    return;
  }

  await client.jobOccurrenceEmployee.createMany({
    data: rows,
    skipDuplicates: true,
  });
};

export const syncOccurrenceEmployees = async (
  client: OccurrenceEmployeeClient,
  jobOccurrenceId: string,
  employeeIds: string[]
) => {
  await client.jobOccurrenceEmployee.deleteMany({
    where: { jobOccurrenceId },
  });

  await createOccurrenceEmployeeRows(
    client,
    getUniqueEmployeeIds(employeeIds).map((employeeId) => ({
      employeeId,
      jobOccurrenceId,
    }))
  );
};
