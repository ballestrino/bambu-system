import { EmployeeMonthlySummaryPage } from "@/components/ops/employees/employee-monthly-summary-page";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ end?: string; start?: string }>;
}) {
  const { id } = await params;
  const { end, start } = await searchParams;

  return (
    <EmployeeMonthlySummaryPage
      employeeId={id}
      initialEndDate={end}
      initialStartDate={start}
    />
  );
}
