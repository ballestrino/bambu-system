import { BudgetDetailsSkeleton } from "@/components/budgets/budget-details/BudgetDetailsSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Loading() {
    return (
        <div className="w-full pb-10 h-full items-center justify-center flex">
            <div className="flex flex-col container h-full space-y-6">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-9 w-64" /> {/* Title */}
                        <Skeleton className="h-4 w-96" /> {/* Subtitle */}
                    </div>
                    <div className="flex sticky items-center gap-2">
                        <Skeleton className="h-10 w-32" /> {/* Save Button */}
                        <Skeleton className="h-10 w-10 md:w-32" /> {/* AI Button */}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Form Sections Skeletons */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Simulate 4 sections: Slug, Details, Costs, Contributions */}
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Card key={i} className="overflow-hidden">
                                <CardHeader className="border-b bg-muted/5">
                                    <CardTitle className="flex justify-between items-center">
                                        <Skeleton className="h-6 w-40" />
                                        <Skeleton className="h-5 w-5 rounded-full" />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-10 w-full" />
                                        </div>
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-10 w-full" />
                                        </div>
                                    </div>
                                    {i % 2 === 0 && ( /* Add a bit of variation for larger sections */
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-10 w-full" />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Right Column: Preview Skeleton */}
                    <div className="lg:col-span-5">
                        <div className="sticky top-32">
                            <BudgetDetailsSkeleton />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
