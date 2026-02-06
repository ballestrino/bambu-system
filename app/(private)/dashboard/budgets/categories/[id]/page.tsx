import CategoryView from "@/components/budgets/categories/CategoryView"

interface PageProps {
    params: Promise<{
        id: string
    }>
}

export default async function CategoryDetailsPage({ params }: PageProps) {
    const { id } = await params

    return (
        <CategoryView id={id} />
    )
}
