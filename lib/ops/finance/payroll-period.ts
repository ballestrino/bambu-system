// Salaries are paid in arrears: what is paid in a month settles the hours
// worked the month before. Local time, like the operating month the user
// picks; assignedMonth itself is stored in UTC.
export const getPayrollWorkMonth = (paymentMonth: Date) =>
  new Date(paymentMonth.getFullYear(), paymentMonth.getMonth() - 1, 1);

// Payroll is tracked from the hours worked in August 2026. Earlier visits were
// recorded without employees or actual times, so the payments that settled
// them (June and August 2026) have no hours to be compared against.
export const PAYROLL_TRACKING_START_MONTH_KEY = "2026-08";
export const PAYROLL_TRACKING_START_LABEL = "agosto de 2026";

// Month keys are "YYYY-MM", so they compare as strings.
export const isPayrollWorkMonthTracked = (workMonthKey: string) =>
  workMonthKey >= PAYROLL_TRACKING_START_MONTH_KEY;
