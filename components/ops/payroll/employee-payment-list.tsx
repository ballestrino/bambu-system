"use client";

import Link from "next/link";

import { dashboardSecondaryActionClass } from "@/components/dashboard/dashboard-styles";
import DeleteDialog from "@/components/ui/delete-dialog";
import { getSummaryPeriodHref } from "@/components/ops/employees/employee-summary-utils";
import { PaymentStatusBadge } from "@/components/ops/payments/payment-status-badge";
import { PayrollDialog } from "@/components/ops/payroll/payroll-dialog";
import { formatPayrollMoney, toPayrollNumber } from "@/components/ops/payroll/payroll-utils";
import type { OpsEmployee, OpsEmployeePayment } from "@/components/ops/types";
import { formatDate, formatUtcMonth } from "@/components/ops/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const EmployeePaymentList = ({
  employees,
  isLoading,
  onVoid,
  payments,
  showEmployeeLink = true,
}: {
  employees: OpsEmployee[];
  isLoading?: boolean;
  onVoid: (paymentId: string) => Promise<void>;
  payments: OpsEmployeePayment[];
  showEmployeeLink?: boolean;
}) => (
  <Card className="border-0 bg-white/80 shadow-sm ring-1 ring-black/5 dark:bg-[#1A211A] dark:ring-white/10">
    <CardHeader><CardTitle>Pagos registrados</CardTitle></CardHeader>
    <CardContent className="space-y-3">
      {isLoading ? (
        <div className="min-h-40 animate-pulse rounded-lg bg-muted/40" />
      ) : payments.length ? (
        payments.map((payment) => (
          <div key={payment.id} className="flex flex-col gap-3 rounded-lg border border-black/5 bg-white p-4 lg:flex-row lg:items-center lg:justify-between dark:border-white/10 dark:bg-[#242D23]">
            <div className="space-y-1 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <PaymentStatusBadge status={payment.status} />
                <p className="font-medium">{formatPayrollMoney(toPayrollNumber(payment.amount))}</p>
                <p className="text-muted-foreground">Asignado: {formatUtcMonth(payment.assignedMonth)}</p>
              </div>
              <p>{payment.employee.name}</p>
              <p className="text-muted-foreground">Fecha de pago: {formatDate(payment.paymentDate)}</p>
              <p className="text-muted-foreground">
                Periodo {formatDate(payment.periodStart)} - {formatDate(payment.periodEnd)}
              </p>
              <p className="text-muted-foreground">
                {payment.reference || "Sin referencia"} · {payment.notes || "Sin notas"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {showEmployeeLink ? (
                <Button asChild size="sm" variant="outline" className={dashboardSecondaryActionClass}>
                  <Link href={`/dashboard/employees/${payment.employeeId}`}>Empleado</Link>
                </Button>
              ) : null}
              <Button asChild size="sm" variant="outline" className={dashboardSecondaryActionClass}>
                <Link href={getSummaryPeriodHref(payment.employeeId, payment.periodStart, payment.periodEnd)}>
                  Resumen de empleado
                </Link>
              </Button>
              <PayrollDialog employees={employees} payment={payment} />
              {payment.status === "RECORDED" ? (
                <DeleteDialog
                  title="Anular pago"
                  description="El pago seguirá visible como historial, pero no contará como pagado."
                  deleteButtonText="Anular"
                  deleteButtonVariant="default"
                  onConfirm={async () => {
                    await onVoid(payment.id);
                  }}
                  trigger={<Button size="sm" variant="outline" className={dashboardSecondaryActionClass}>Anular</Button>}
                />
              ) : null}
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">No hay pagos para estos filtros.</p>
      )}
    </CardContent>
  </Card>
);
