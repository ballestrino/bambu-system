"use client";

import Link from "next/link";
import { ReceiptText } from "lucide-react";

import { dashboardSecondaryActionClass } from "@/components/dashboard/dashboard-styles";
import { CostDialog } from "@/components/ops/costs/cost-dialog";
import { formatCostMoney, toCostNumber } from "@/components/ops/costs/cost-utils";
import { PaymentStatusBadge } from "@/components/ops/payments/payment-status-badge";
import {
  OpsEmptyState,
  OpsRecordItem,
  OpsRecordList,
  OpsRecordSkeleton,
} from "@/components/ops/shared";
import type {
  OpsEmployee,
  OpsJobListItem,
  OpsOperationalCost,
  OpsOperationalCostCategory,
} from "@/components/ops/types";
import { formatDate, formatUtcMonth } from "@/components/ops/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DeleteDialog from "@/components/ui/delete-dialog";

export const CostsList = ({
  categories,
  costs,
  employees,
  isLoading,
  jobs,
  onVoid,
}: {
  categories: OpsOperationalCostCategory[];
  costs: OpsOperationalCost[];
  employees: OpsEmployee[];
  isLoading?: boolean;
  jobs: OpsJobListItem[];
  onVoid: (costId: string) => Promise<void>;
}) => {
  if (isLoading) {
    return <OpsRecordSkeleton count={5} />;
  }

  if (!costs.length) {
    return (
      <OpsEmptyState
        icon={ReceiptText}
        title="No hay costes para estos filtros"
        description="Registra BPS, taxi, bus u otros gastos para ver la ganancia real."
      />
    );
  }

  return (
    <OpsRecordList>
      {costs.map((cost) => (
        <OpsRecordItem
          key={cost.id}
          title={formatCostMoney(toCostNumber(cost.amount))}
          subtitle={
            <Badge
              className="gap-1.5 border-border/80 bg-muted/30 text-foreground"
              style={{ borderColor: cost.category.color }}
              variant="outline"
            >
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: cost.category.color }}
              />
              {cost.category.name}
            </Badge>
          }
          status={<PaymentStatusBadge status={cost.status} />}
          description={cost.notes || cost.reference || "Sin notas"}
          meta={
            <>
              <span>Asignado: {formatUtcMonth(cost.assignedMonth)}</span>
              <span>Fecha: {formatDate(cost.costDate)}</span>
              <span>{cost.job?.name ?? "Sin trabajo"}</span>
              <span>{cost.employee?.name ?? "Sin empleada"}</span>
            </>
          }
          actions={
            <>
              {cost.jobId ? (
                <Button asChild size="sm" variant="outline" className={dashboardSecondaryActionClass}>
                  <Link href={`/dashboard/jobs/${cost.jobId}`}>Trabajo</Link>
                </Button>
              ) : null}
              <CostDialog
                categories={categories}
                cost={cost}
                employees={employees}
                jobs={jobs}
              />
              {cost.status === "RECORDED" ? (
                <DeleteDialog
                  title="Anular coste"
                  description="El coste seguirá visible como historial, pero no contará en totales."
                  deleteButtonText="Anular"
                  deleteButtonVariant="default"
                  onConfirm={async () => {
                    await onVoid(cost.id);
                  }}
                  trigger={<Button size="sm" variant="outline">Anular</Button>}
                />
              ) : null}
            </>
          }
        />
      ))}
    </OpsRecordList>
  );
};
