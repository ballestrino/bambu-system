"use client";

import Link from "next/link";
import { CircleSlash, FileText, Pencil } from "lucide-react";

import { getSummaryPeriodHref } from "@/components/ops/employees/employee-summary-utils";
import { FinancialVoidDialog } from "@/components/ops/financial/financial-void-dialog";
import { useRowDialog } from "@/components/ops/financial/use-row-dialog";
import { PaymentStatusBadge } from "@/components/ops/payments/payment-status-badge";
import { PayrollDialog } from "@/components/ops/payroll/payroll-dialog";
import { formatPayrollMoney, toPayrollNumber } from "@/components/ops/payroll/payroll-utils";
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
import type { OpsEmployee, OpsEmployeePayment } from "@/components/ops/types";
import { formatDate } from "@/components/ops/utils";
import { cn } from "@/lib/utils";

const periodFormat = new Intl.DateTimeFormat("es-UY", { dateStyle: "medium" });

// "1 – 31 de ago. de 2026" instead of two full dates: formatRange drops what
// both ends share.
const formatPeriod = (start: Date | string, end: Date | string) => {
  try {
    return periodFormat.formatRange(new Date(start), new Date(end));
  } catch {
    return `${formatDate(start)} – ${formatDate(end)}`;
  }
};

export const FinancialEmployeePaymentRow = ({
  employees,
  onVoid,
  payment,
  showStatus,
}: {
  employees: OpsEmployee[];
  onVoid: (paymentId: string) => Promise<void>;
  payment: OpsEmployeePayment;
  showStatus: boolean;
}) => {
  const { dialog, onOpenChange, openDialog } = useRowDialog<"edit" | "void">();
  const isVoided = payment.status === "VOIDED";
  const date = formatDate(payment.paymentDate);
  const period = formatPeriod(payment.periodStart, payment.periodEnd);
  const detail = [payment.reference, payment.notes].filter(Boolean).join(" · ");
  const employeeName = payment.employee.name;
  const amount = (
    <span className={cn("font-semibold", isVoided && "font-normal line-through")}>
      {formatPayrollMoney(toPayrollNumber(payment.amount))}
    </span>
  );
  const actions = (
    <>
      <OpsRowActionButton
        icon={Pencil}
        label={`Editar pago a ${employeeName}`}
        onClick={(event) => openDialog("edit", event.currentTarget)}
      />
      <OpsRowActionLink
        href={getSummaryPeriodHref(payment.employeeId, payment.periodStart, payment.periodEnd)}
        icon={FileText}
        label={`Resumen del periodo de ${employeeName}`}
      />
      {isVoided ? null : (
        <OpsRowActionButton
          icon={CircleSlash}
          label={`Anular pago a ${employeeName}`}
          onClick={(event) => openDialog("void", event.currentTarget)}
        />
      )}
    </>
  );

  return (
    <OpsTableRow className={cn(isVoided && "text-ops-text-muted")}>
      <OpsTableCell className="hidden tabular-nums md:table-cell">{date}</OpsTableCell>
      <OpsTableCell className="whitespace-normal sm:min-w-40">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link className={opsTableLinkClass} href={`/dashboard/employees/${payment.employeeId}`}>
              {employeeName}
            </Link>
            <p className={cn(opsTableSublineClass, "lg:hidden")}>
              <span className="md:hidden">{date} · </span>
              {period}
              {isVoided ? " · Anulado" : ""}
            </p>
          </div>
          <OpsRowMobileAside actions={actions} value={amount} />
        </div>
        {dialog === "edit" ? (
          <PayrollDialog
            defaultOpen
            employees={employees}
            onOpenChange={onOpenChange}
            payment={payment}
            trigger={null}
          />
        ) : null}
        {dialog === "void" ? (
          <FinancialVoidDialog
            description="El pago seguirá visible como historial, pero no contará como pagado."
            onConfirm={() => onVoid(payment.id)}
            onOpenChange={onOpenChange}
            title="Anular pago"
          />
        ) : null}
      </OpsTableCell>
      <OpsTableCell className="hidden tabular-nums lg:table-cell">{period}</OpsTableCell>
      <OpsTableCell className="hidden xl:table-cell">
        <p className="max-w-56 truncate text-ops-text-muted" title={detail || undefined}>
          {detail || "Sin referencia"}
        </p>
      </OpsTableCell>
      {showStatus ? (
        <OpsTableCell className="hidden sm:table-cell">
          <PaymentStatusBadge status={payment.status} />
        </OpsTableCell>
      ) : null}
      <OpsTableCell className="hidden text-right tabular-nums sm:table-cell">{amount}</OpsTableCell>
      <OpsTableCell className="hidden sm:table-cell">
        <OpsRowActions>{actions}</OpsRowActions>
      </OpsTableCell>
    </OpsTableRow>
  );
};
