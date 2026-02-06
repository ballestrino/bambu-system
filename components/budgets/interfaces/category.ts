
import { BudgetCategory } from "@prisma/client"

export interface BudgetCategoryWithCount extends BudgetCategory {
    _count?: {
        childCategories: number
    }
}
