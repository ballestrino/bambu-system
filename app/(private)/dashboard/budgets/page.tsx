import { Suspense } from "react";

import { BudgetsLoading } from "@/components/budgets/list/budgets-list-states";
import { BudgetsPage } from "@/components/budgets/list/budgets-page";

export default function Page() {
  return (
    <Suspense fallback={<BudgetsLoading />}>
      <BudgetsPage />
    </Suspense>
  );
}
