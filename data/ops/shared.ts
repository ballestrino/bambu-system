import "server-only";

import { Prisma } from "@prisma/client";

export const opsAuditUserSelect = {
  id: true,
  name: true,
  email: true,
} satisfies Prisma.UserSelect;

export const buildDateTimeRange = (
  startDate?: Date,
  endDate?: Date
): Prisma.DateTimeFilter | undefined => {
  if (!startDate && !endDate) {
    return undefined;
  }

  return {
    gte: startDate,
    lte: endDate,
  };
};

export const buildAssignedMonthRange = (assignedMonth: Date) =>
  buildDateTimeRange(
    new Date(Date.UTC(assignedMonth.getUTCFullYear(), assignedMonth.getUTCMonth(), 1)),
    new Date(
      Date.UTC(
        assignedMonth.getUTCFullYear(),
        assignedMonth.getUTCMonth() + 1,
        1
      ) - 1
    )
  );
