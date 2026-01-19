import { BudgetDetailsSkeleton } from "@/components/budgets/budget-details/BudgetDetailsSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="flex container pb-10 flex-col space-y-6 ">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2 w-full items-center justify-center py-10">
                    <Skeleton className="h-10 w-64 md:w-96" />
                    <Skeleton className="h-5 w-48 md:w-64" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column Skeleton */}
                <div className="lg:col-span-1">
                    <BudgetDetailsSkeleton />
                </div>

                {/* Right Column Skeleton */}
                <div className="lg:col-span-1">
                    <BudgetDetailsSkeleton />
                </div>
            </div>
        </div>
    );
}
