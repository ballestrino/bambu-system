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
