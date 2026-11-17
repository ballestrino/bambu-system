import { Suspense } from "react";

import { BudgetsLoading } from "@/components/budgets/list/budgets-list-states";
import { OfficialBudgetsPage } from "@/components/official-budgets/list/official-budgets-page";

export default function Page() {
  return (
    <Suspense fallback={<BudgetsLoading />}>
      <OfficialBudgetsPage />
    </Suspense>
  );
}
