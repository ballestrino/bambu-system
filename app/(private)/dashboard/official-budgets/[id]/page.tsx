import { OfficialBudgetView } from "@/components/official-budgets/detail/official-budget-view";

export default async function OfficialBudgetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OfficialBudgetView id={id} />;
}
