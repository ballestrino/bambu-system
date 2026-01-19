import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const BudgetDetailsSkeleton = () => {
    return (
        <Card className="h-full border-l-4 border-l-muted shadow-lg overflow-hidden">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <Skeleton className="h-7 w-40" />
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* General Info */}
                <div className="grid grid-cols-2 gap-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i}>
                            <Skeleton className="h-3 w-16 mb-2" />
                            <Skeleton className="h-5 w-24" />
                        </div>
                    ))}
                </div>

                <hr className="my-4 border-t" />

                {/* Contribution Breakdown */}
                <div className="space-y-2">
                    <Skeleton className="h-4 w-48 mb-3" />
                    <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex justify-between">
                                <Skeleton className="h-3 w-32" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between pt-2 border-t mt-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                </div>

                <hr className="my-4 border-t" />

                {/* Service Costs */}
                <div className="space-y-2 pt-2">
                    <Skeleton className="h-4 w-32 mb-3" />
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex justify-between">
                            <Skeleton className="h-3 w-28" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    ))}
                    <div className="flex justify-between pt-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>

                <hr className="my-4 border-t" />

                {/* Final Price */}
                <div className="flex justify-between items-end">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-9 w-40" />
                </div>
            </CardContent>
        </Card>
    )
}
