import { EmployeeVisitsPage } from "@/components/ops/employees/employee-visits-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <EmployeeVisitsPage employeeId={id} />;
}
