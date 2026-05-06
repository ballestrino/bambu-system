import { EmployeeDetailPage } from "@/components/ops/employees/employee-detail-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <EmployeeDetailPage employeeId={id} />;
}
