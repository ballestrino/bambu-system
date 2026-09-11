"use client";

import Link from "next/link";
import { ChevronRight, FileText, HandCoins } from "lucide-react";

import { getSummaryPeriodHref } from "@/components/ops/employees/employee-summary-utils";
import { formatHours } from "@/components/ops/employees/employee-payroll";
import { FinancialPayrollRowDetails } from "@/components/ops/financial/financial-payroll-row-details";
import type { PayrollRow } from "@/components/ops/financial/financial-table-queries";
import { useRowDialog } from "@/components/ops/financial/use-row-dialog";
import { PayrollDialog } from "@/components/ops/payroll/payroll-dialog";
import { formatPayrollMoney } from "@/components/ops/payroll/payroll-utils";
import {
  OpsRowActionButton,
  OpsRowActionLink,
  OpsRowActions,
  OpsRowMobileAside,
  OpsTableCell,
  OpsTableRow,
  opsTableLinkClass,
  opsTableSublineClass,
} from "@/components/ops/shared";
import type { OpsEmployee } from "@/components/ops/types";
import { cn } from "@/lib/utils";

export const PAYROLL_COLUMN_COUNT = 7;

const formatNullableMoney = (value: number | null) =>
  value === null ? "-" : formatPayrollMoney(value);

export const FinancialPayrollRow = ({
  employees,
  isExpanded,
  onToggle,
  periodEnd,
  periodStart,
  row,
}: {
  employees: OpsEmployee[];
  isExpanded: boolean;
  onToggle: () => void;
  periodEnd: string;
  periodStart: string;
  row: PayrollRow;
}) => {
  const { dialog, onOpenChange, openDialog } = useRowDialog<"pay">();
  const detailId = `pagos-detalle-${row.employeeId}`;
  const hasPendingBalance = row.balance !== null && row.balance > 0;
  const balance = (
    <span
      className={cn("font-semibold", hasPendingBalance && "text-amber-700 dark:text-amber-300")}
    >
      {formatNullableMoney(row.balance)}
    </span>
  );
  const actions = (
    <>
      <OpsRowActionButton
        icon={HandCoins}
        label={`Registrar pago a ${row.employeeName}`}
        onClick={(event) => openDialog("pay", event.currentTarget)}
      />
      <OpsRowActionLink
        href={getSummaryPeriodHref(row.employeeId, periodStart, periodEnd)}
        icon={FileText}
        label={`Resumen del periodo de ${row.employeeName}`}
      />
    </>
  );

  return (
    <>
      <OpsTableRow
        className={cn(isExpanded && "border-b-0 bg-ops-surface-muted/40 hover:bg-ops-surface-muted/40")}
      >
        <OpsTableCell className="whitespace-normal sm:min-w-44">
          <div className="flex items-start gap-1">
            <button
              aria-controls={detailId}
              aria-expanded={isExpanded}
              aria-label={`${isExpanded ? "Ocultar" : "Ver"} detalle de ${row.employeeName}`}
              className="-my-2 -ml-2 flex size-11 shrink-0 items-center justify-center rounded-[var(--ops-radius-control)] text-ops-text-muted transition-colors hover:bg-ops-surface-muted hover:text-ops-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ops-bamboo/40 md:size-9"
              onClick={onToggle}
              type="button"
            >
              <ChevronRight
                className={cn("size-4 transition-transform", isExpanded && "rotate-90")}
              />
            </button>
            <div className="min-w-0 flex-1">
              <Link className={opsTableLinkClass} href={`/dashboard/employees/${row.employeeId}`}>
                {row.employeeName}
              </Link>
              <p className={cn(opsTableSublineClass, "md:hidden")}>
                {formatHours(row.hours)} hs · {row.visits} {row.visits === 1 ? "visita" : "visitas"}
              </p>
            </div>
            <OpsRowMobileAside actions={actions} value={balance} />
          </div>
          {dialog === "pay" ? (
            <PayrollDialog
              defaultOpen
              employeeId={row.employeeId}
              employees={employees}
              onOpenChange={onOpenChange}
              periodEnd={periodEnd}
              periodStart={periodStart}
              suggestedAmount={hasPendingBalance ? row.balance : row.suggestedAmount}
              trigger={null}
            />
          ) : null}
        </OpsTableCell>
        <OpsTableCell className="hidden text-right tabular-nums md:table-cell">
          {formatHours(row.hours)}
        </OpsTableCell>
        <OpsTableCell className="hidden text-right tabular-nums lg:table-cell">
          {row.visits}
        </OpsTableCell>
        <OpsTableCell className="hidden text-right tabular-nums md:table-cell">
          {formatNullableMoney(row.suggestedAmount)}
        </OpsTableCell>
        <OpsTableCell className="hidden text-right tabular-nums sm:table-cell">
          {formatPayrollMoney(row.recordedTotal)}
        </OpsTableCell>
        <OpsTableCell className="hidden text-right tabular-nums sm:table-cell">{balance}</OpsTableCell>
        <OpsTableCell className="hidden sm:table-cell">
          <OpsRowActions>{actions}</OpsRowActions>
        </OpsTableCell>
      </OpsTableRow>
      {/* Always rendered, only hidden, so aria-controls never points at nothing. */}
      <OpsTableRow
        className="bg-ops-surface-muted/40 hover:bg-ops-surface-muted/40"
        hidden={!isExpanded}
        id={detailId}
      >
        <OpsTableCell className="whitespace-normal px-4 pb-4 pt-1" colSpan={PAYROLL_COLUMN_COUNT}>
          <FinancialPayrollRowDetails row={row} />
        </OpsTableCell>
      </OpsTableRow>
    </>
  );
};
