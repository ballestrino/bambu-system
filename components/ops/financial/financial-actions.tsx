"use client";

import { CostDialog } from "@/components/ops/costs/cost-dialog";
import type { FinancialWorkspace } from "@/components/ops/financial/use-financial-workspace";
import { PaymentDialog } from "@/components/ops/payments/payment-dialog";
import { PayrollDialog } from "@/components/ops/payroll/payroll-dialog";
import { OpsRefreshButton } from "@/components/ops/shared";
import { toDateInputValue } from "@/components/ops/utils";

export const FinancialActions = ({
  isProfitabilityFetching,
  onRefreshProfitability,
  workspace,
}: {
  isProfitabilityFetching: boolean;
  onRefreshProfitability: () => Promise<unknown> | void;
  workspace: FinancialWorkspace;
}) => (
  <>
    <OpsRefreshButton
      isRefreshing={workspace.isFetching || isProfitabilityFetching}
      onRefresh={async () => {
        await Promise.all([workspace.refresh.all(), onRefreshProfitability()]);
      }}
    />
    <PaymentDialog jobs={workspace.jobs} />
    <CostDialog
      categories={workspace.categories}
      employees={workspace.employees}
      jobs={workspace.jobs}
    />
    <PayrollDialog
      employees={workspace.employees}
      periodEnd={toDateInputValue(workspace.monthRange.end)}
      periodStart={toDateInputValue(workspace.monthRange.start)}
    />
  </>
);
