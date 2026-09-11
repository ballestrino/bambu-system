"use client";

import { TrendingUp } from "lucide-react";

import { CostDialog } from "@/components/ops/costs/cost-dialog";
import { dashboardSecondaryActionClass } from "@/components/dashboard/dashboard-styles";
import type { FinanceSection } from "@/components/ops/financial/financial-sections";
import type { FinancialWorkspace } from "@/components/ops/financial/use-financial-workspace";
import { PaymentDialog } from "@/components/ops/payments/payment-dialog";
import { PayrollDialog } from "@/components/ops/payroll/payroll-dialog";
import { OpsSection } from "@/components/ops/shared";
import { Button } from "@/components/ui/button";

// Everything here is deliberately secondary: the one primary action on Resumen
// is Exportar PDF in the page header.
export const FinancialQuickActions = ({
  onSelectSection,
  workspace,
}: {
  onSelectSection: (section: FinanceSection) => void;
  workspace: FinancialWorkspace;
}) => (
  <OpsSection
    description="Lo que más se registra, sin salir del resumen."
    title="Accesos rápidos"
  >
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 [&_button]:w-full">
      <PaymentDialog jobs={workspace.jobs} />
      <CostDialog
        categories={workspace.categories}
        employees={workspace.employees}
        jobs={workspace.jobs}
      />
      <PayrollDialog employees={workspace.employees} />
      <Button
        className={dashboardSecondaryActionClass}
        onClick={() => onSelectSection("rentabilidad")}
        type="button"
        variant="outline"
      >
        <TrendingUp />
        Revisar rentabilidad
      </Button>
    </div>
  </OpsSection>
);
