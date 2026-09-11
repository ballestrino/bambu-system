"use client";

import Link from "next/link";
import { CircleSlash, Pencil } from "lucide-react";

import { FinancialVoidDialog } from "@/components/ops/financial/financial-void-dialog";
import { useRowDialog } from "@/components/ops/financial/use-row-dialog";
import { PaymentDialog } from "@/components/ops/payments/payment-dialog";
import { PaymentStatusBadge } from "@/components/ops/payments/payment-status-badge";
import { formatMoney, toMoneyNumber } from "@/components/ops/payments/payment-utils";
import {
  OpsRowActionButton,
  OpsRowActions,
  OpsRowMobileAside,
  OpsTableCell,
  OpsTableRow,
  opsTableLinkClass,
  opsTableSublineClass,
} from "@/components/ops/shared";
import type { OpsJobClientPayment, OpsJobListItem } from "@/components/ops/types";
import { formatDate } from "@/components/ops/utils";
import { cn } from "@/lib/utils";

export const FinancialPaymentRow = ({
  jobs,
  onVoid,
  payment,
  showStatus,
}: {
  jobs: OpsJobListItem[];
  onVoid: (paymentId: string) => Promise<void>;
  payment: OpsJobClientPayment;
  showStatus: boolean;
}) => {
  const { dialog, onOpenChange, openDialog } = useRowDialog<"edit" | "void">();
  const isVoided = payment.status === "VOIDED";
  const date = formatDate(payment.paymentDate);
  const amount = (
    <span className={cn("font-semibold", isVoided && "font-normal line-through")}>
      {formatMoney(toMoneyNumber(payment.amount))}
    </span>
  );
  const actions = (
    <>
      <OpsRowActionButton
        icon={Pencil}
        label={`Editar cobro de ${payment.job.name}`}
        onClick={(event) => openDialog("edit", event.currentTarget)}
      />
      {isVoided ? null : (
        <OpsRowActionButton
          icon={CircleSlash}
          label={`Anular cobro de ${payment.job.name}`}
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
            <Link className={opsTableLinkClass} href={`/dashboard/jobs/${payment.jobId}`}>
              {payment.job.name}
            </Link>
            <p className={cn(opsTableSublineClass, "md:hidden")}>
              {[date, payment.reference, isVoided ? "Anulado" : null].filter(Boolean).join(" · ")}
            </p>
          </div>
          <OpsRowMobileAside actions={actions} value={amount} />
        </div>
        {dialog === "edit" ? (
          <PaymentDialog
            defaultOpen
            jobs={jobs}
            onOpenChange={onOpenChange}
            payment={payment}
            trigger={null}
          />
        ) : null}
        {dialog === "void" ? (
          <FinancialVoidDialog
            description="El cobro seguirá visible como historial, pero no contará en totales ni atribución."
            onConfirm={() => onVoid(payment.id)}
            onOpenChange={onOpenChange}
            title="Anular cobro"
          />
        ) : null}
      </OpsTableCell>
      <OpsTableCell className="hidden lg:table-cell">
        <div className="max-w-64">
          <p className="truncate">{payment.reference || "Sin referencia"}</p>
          {payment.notes ? (
            <p className={cn(opsTableSublineClass, "truncate")} title={payment.notes}>
              {payment.notes}
            </p>
          ) : null}
        </div>
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
