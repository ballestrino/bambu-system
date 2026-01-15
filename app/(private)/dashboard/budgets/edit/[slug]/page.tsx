import { getBudgetBySlug } from "@/data/budget";
import { notFound } from "next/navigation";
import EditBudgetPageClient from "./EditBudgetPageClient";

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
        <EditBudgetPageClient budget={budget as any} />
    );
}
