import { getBudgetBySlug } from "@/data/budget";
import { notFound } from "next/navigation";
import EditBudgetPageClient from "./EditBudgetPageClient";

export default async function EditBudgetPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const response = await getBudgetBySlug(slug);

    if ("error" in response || !response.budget) {
        notFound();
    }

    const budget = response.budget;

    return (
        <EditBudgetPageClient budget={budget as any} />
    );
}
