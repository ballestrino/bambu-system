import BudgetDetailView from "@/components/budgets/budget-details/BudgetView";

export default async function BudgetDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    return <BudgetDetailView slug={slug} />
}
