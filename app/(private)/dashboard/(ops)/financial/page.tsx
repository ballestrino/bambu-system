import { Suspense } from "react";

import { FinancialPage } from "@/components/ops/financial/financial-page";
import { FinancialPageSkeleton } from "@/components/ops/financial/financial-page-skeleton";

// FinancialPage reads ?seccion= through useSearchParams, which requires a
// Suspense boundary above it or the production build fails.
export default function Page() {
  return (
    <Suspense fallback={<FinancialPageSkeleton />}>
      <FinancialPage />
    </Suspense>
  );
}
