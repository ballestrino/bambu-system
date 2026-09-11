export const getAssignedMonthRange = (assignedMonth: Date) => ({
  gte: new Date(
    Date.UTC(assignedMonth.getUTCFullYear(), assignedMonth.getUTCMonth(), 1)
  ),
  lte: new Date(
    Date.UTC(
      assignedMonth.getUTCFullYear(),
      assignedMonth.getUTCMonth() + 1,
      1
    ) - 1
  ),
});

// UTC, always: the write path normalizes assignedMonth to a UTC month start, so
// bucketing in local time would misfile every month boundary in UTC-3.
export const getFinanceMonthKey = (month: Date) =>
  `${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, "0")}`;
