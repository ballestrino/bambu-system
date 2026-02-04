
import { getBudgetBySlug } from "@/data/budget";
import { notFound } from "next/navigation";
import { AIChat } from "@/components/ai/AIChat";

import { BudgetDetails } from "@/components/budgets/budget-details/BudgetDetails";

export default async function BudgetDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const budget = await getBudgetBySlug(slug);

    if (!budget) {
        notFound();
    }

    const budgetOptions = budget.budgetOptions || [];
    const optionWithProducts = budgetOptions.find((o: any) => o.has_products && Number(o.products_price) > 0);
    const optionWithoutProducts = budgetOptions.find((o: any) => !o.has_products);

    return (
        <div className="flex container pb-10 px-4 flex-col space-y-6 ">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2 w-full items-center justify-center py-10">
                    <h1 className="text-3xl font-sans font-bold tracking-wider">{budget.name}</h1>
                    {budget.description && (
                        <p className="text-muted-foreground">{budget.description}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Without Products (if available) or Service Only view */}
                <div className="lg:col-span-1">
                    {optionWithoutProducts ? (
                        <BudgetDetails option={optionWithoutProducts} title="Sin Productos" />
                    ) : (
                        <div className="p-4 border border-dashed rounded text-muted-foreground text-center">
                            No hay opción sin productos disponible.
                        </div>
                    )}
                </div>

                {/* Right Column: With Products - Only render if option exists */}
                {optionWithProducts && (
                    <div className="lg:col-span-1">
                        <BudgetDetails option={optionWithProducts} title="Con Productos" />
                    </div>
                )}
            </div>
            <AIChat contextData={budget} />
        </div>
    );
}
