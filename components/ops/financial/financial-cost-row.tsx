"use client";

import Link from "next/link";
import { CircleSlash, Pencil } from "lucide-react";

import { CostDialog } from "@/components/ops/costs/cost-dialog";
import { formatCostMoney, toCostNumber } from "@/components/ops/costs/cost-utils";
import { FinancialVoidDialog } from "@/components/ops/financial/financial-void-dialog";
import { useRowDialog } from "@/components/ops/financial/use-row-dialog";
import { PaymentStatusBadge } from "@/components/ops/payments/payment-status-badge";
import {
  OpsRowActionButton,
  OpsRowActions,
  OpsRowMobileAside,
  OpsTableCell,
  OpsTableRow,
  opsTableLinkClass,
  opsTableSublineClass,
} from "@/components/ops/shared";
import type {
  OpsEmployee,
  OpsJobListItem,
  OpsOperationalCost,
  OpsOperationalCostCategory,
} from "@/components/ops/types";
import { formatDate } from "@/components/ops/utils";
import { cn } from "@/lib/utils";

export const FinancialCostRow = ({
  categories,
  cost,
  employees,
  jobs,
  onVoid,
  showStatus,
}: {
  categories: OpsOperationalCostCategory[];
  cost: OpsOperationalCost;
  employees: OpsEmployee[];
  jobs: OpsJobListItem[];
  onVoid: (costId: string) => Promise<void>;
  showStatus: boolean;
}) => {
  const { dialog, onOpenChange, openDialog } = useRowDialog<"edit" | "void">();
  const isVoided = cost.status === "VOIDED";
  const date = formatDate(cost.costDate);
  const detail = cost.notes || cost.reference;
  const amount = (
    <span className={cn("font-semibold", isVoided && "font-normal line-through")}>
      {formatCostMoney(toCostNumber(cost.amount))}
    </span>
  );
  const actions = (
    <>
      <OpsRowActionButton
        icon={Pencil}
        label={`Editar coste de ${cost.category.name}`}
        onClick={(event) => openDialog("edit", event.currentTarget)}
      />
      {isVoided ? null : (
        <OpsRowActionButton
          icon={CircleSlash}
          label={`Anular coste de ${cost.category.name}`}
          onClick={(event) => openDialog("void", event.currentTarget)}
        />
      )}
    </>
  );

  return (
    <OpsTableRow className={cn(isVoided && "text-ops-text-muted")}>
      <OpsTableCell className="hidden tabular-nums md:table-cell">{date}</OpsTableCell>
      <OpsTableCell className="whitespace-normal sm:min-w-36">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 font-medium">
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: cost.category.color }}
              />
              {cost.category.name}
            </span>
            <p className={cn(opsTableSublineClass, "md:hidden")}>
              {[date, cost.job?.name ?? cost.employee?.name, isVoided ? "Anulado" : null]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <OpsRowMobileAside actions={actions} value={amount} />
        </div>
        {dialog === "edit" ? (
          <CostDialog
            categories={categories}
            cost={cost}
            defaultOpen
            employees={employees}
            jobs={jobs}
            onOpenChange={onOpenChange}
            trigger={null}
          />
        ) : null}
        {dialog === "void" ? (
          <FinancialVoidDialog
            description="El coste seguirá visible como historial, pero no contará en totales."
            onConfirm={() => onVoid(cost.id)}
            onOpenChange={onOpenChange}
            title="Anular coste"
          />
        ) : null}
      </OpsTableCell>
      <OpsTableCell className="hidden whitespace-normal md:table-cell">
        {cost.jobId && cost.job ? (
          <Link className={opsTableLinkClass} href={`/dashboard/jobs/${cost.jobId}`}>
            {cost.job.name}
          </Link>
        ) : (
          <span className="text-ops-text-muted">Sin trabajo</span>
        )}
        {cost.employee ? <p className={opsTableSublineClass}>{cost.employee.name}</p> : null}
      </OpsTableCell>
      <OpsTableCell className="hidden lg:table-cell">
        <p className="max-w-64 truncate text-ops-text-muted" title={detail ?? undefined}>
          {detail || "Sin notas"}
        </p>
      </OpsTableCell>
      {showStatus ? (
        <OpsTableCell className="hidden sm:table-cell">
          <PaymentStatusBadge status={cost.status} />
        </OpsTableCell>
      ) : null}
      <OpsTableCell className="hidden text-right tabular-nums sm:table-cell">{amount}</OpsTableCell>
      <OpsTableCell className="hidden sm:table-cell">
        <OpsRowActions>{actions}</OpsRowActions>
      </OpsTableCell>
    </OpsTableRow>
  );
};
