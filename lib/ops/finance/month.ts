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
