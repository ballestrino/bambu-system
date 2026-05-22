import "server-only";

import type { Prisma } from "@prisma/client";

import { opsAuditUserSelect } from "@/data/ops/shared";

export const opsJobListInclude = {
  sourceBudget: {
    select: {
      id: true,
      slug: true,
      name: true,
    },
  },
  sourceBudgetOption: true,
  createdBy: {
    select: opsAuditUserSelect,
  },
  updatedBy: {
    select: opsAuditUserSelect,
  },
} satisfies Prisma.JobInclude;

export const opsEmployeeInclude = {
  createdBy: {
    select: opsAuditUserSelect,
  },
  updatedBy: {
    select: opsAuditUserSelect,
  },
} satisfies Prisma.EmployeeInclude;

export const opsOccurrenceInclude = {
  job: {
    select: {
      id: true,
      name: true,
      status: true,
    },
  },
  employees: {
    include: {
      employee: true,
    },
  },
  scheduleRule: true,
  createdBy: {
    select: opsAuditUserSelect,
  },
  updatedBy: {
    select: opsAuditUserSelect,
  },
} satisfies Prisma.JobOccurrenceInclude;

export const opsAssignmentInclude = {
  job: true,
  employee: true,
  createdBy: {
    select: opsAuditUserSelect,
  },
  updatedBy: {
    select: opsAuditUserSelect,
  },
} satisfies Prisma.JobEmployeeAssignmentInclude;
