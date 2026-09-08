import { EmployeeAccrualsPage } from "@/components/ops/employees/employee-accruals-page";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ end?: string; start?: string }>;
}) {
  const { end, start } = await searchParams;

  return <EmployeeAccrualsPage initialEndDate={end} initialStartDate={start} />;
}
