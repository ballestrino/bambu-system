import { SchedulesPage } from "@/components/ops/schedules/schedules-page";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ employeeId?: string; week?: string }>;
}) {
  const { employeeId, week } = await searchParams;

  return <SchedulesPage initialEmployeeId={employeeId} initialWeek={week} />;
}
