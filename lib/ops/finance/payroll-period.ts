// Salaries are paid in arrears: what is paid in a month settles the hours
// worked the month before. Local time, like the operating month the user
// picks; assignedMonth itself is stored in UTC.
export const getPayrollWorkMonth = (paymentMonth: Date) =>
  new Date(paymentMonth.getFullYear(), paymentMonth.getMonth() - 1, 1);
