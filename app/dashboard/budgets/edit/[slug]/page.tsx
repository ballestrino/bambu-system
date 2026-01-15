import { getBudgetBySlug } from "@/data/budget";
import { notFound } from "next/navigation";
import { EditBudgetForm } from "@/components/budgets/edit-budget/EditBudgetForm";

export default async function EditBudgetPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const budget = await getBudgetBySlug(slug);

    if (!budget) {
        notFound();
    }

    return (
        <div className="container max-w-4xl py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Editar Presupuesto</h1>
                <p className="text-muted-foreground">Modifica los detalles del presupuesto existente.</p>
            </div>

            <EditBudgetForm budget={budget as any} />
        </div>
    );
}
