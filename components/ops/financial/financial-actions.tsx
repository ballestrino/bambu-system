"use client";

import { CostDialog } from "@/components/ops/costs/cost-dialog";
import type { FinancialWorkspace } from "@/components/ops/financial/use-financial-workspace";
import { PaymentDialog } from "@/components/ops/payments/payment-dialog";
import { PayrollDialog } from "@/components/ops/payroll/payroll-dialog";
import { OpsRefreshButton } from "@/components/ops/shared";
import { toDateInputValue } from "@/components/ops/utils";

export const FinancialActions = ({
  workspace,
}: {
  workspace: FinancialWorkspace;
}) => (
  <>
    <OpsRefreshButton
      isRefreshing={workspace.isFetching}
      onRefresh={workspace.refresh.all}
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
