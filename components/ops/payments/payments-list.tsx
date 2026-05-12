"use client";

import Link from "next/link";

import DeleteDialog from "@/components/ui/delete-dialog";
import { PaymentDialog } from "@/components/ops/payments/payment-dialog";
import { PaymentStatusBadge } from "@/components/ops/payments/payment-status-badge";
import { formatMoney, toMoneyNumber } from "@/components/ops/payments/payment-utils";
import type { OpsJobClientPayment, OpsJobListItem } from "@/components/ops/types";
import { formatDate } from "@/components/ops/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const PaymentsList = ({
  isLoading,
  jobs,
  onVoid,
  payments,
  showJobLink = true,
}: {
  isLoading?: boolean;
  jobs: OpsJobListItem[];
  onVoid: (paymentId: string) => Promise<void>;
  payments: OpsJobClientPayment[];
  showJobLink?: boolean;
}) => (
  <Card className="border-0 bg-white/80 shadow-sm ring-1 ring-black/5">
    <CardHeader>
      <CardTitle>Cobros</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {isLoading ? (
        <div className="min-h-40 animate-pulse rounded-lg bg-muted/40" />
      ) : payments.length ? (
        payments.map((payment) => (
          <div key={payment.id} className="flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <PaymentStatusBadge status={payment.status} />
                <p className="font-medium">{formatMoney(toMoneyNumber(payment.amount))}</p>
                <p className="text-muted-foreground">{formatDate(payment.paymentDate)}</p>
              </div>
              <p>{payment.job.name}</p>
              <p className="text-muted-foreground">
                {payment.reference || "Sin referencia"} · {payment.notes || "Sin notas"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {showJobLink ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/dashboard/jobs/${payment.jobId}`}>Trabajo</Link>
                </Button>
              ) : null}
              <PaymentDialog jobs={jobs} payment={payment} />
              {payment.status === "RECORDED" ? (
                <DeleteDialog
                  title="Anular cobro"
                  description="El cobro seguirá visible como historial, pero no contará en totales ni atribución."
                  deleteButtonText="Anular"
                  deleteButtonVariant="default"
                  onConfirm={async () => {
                    await onVoid(payment.id);
                  }}
                  trigger={<Button size="sm" variant="outline">Anular</Button>}
                />
              ) : null}
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">No hay cobros para estos filtros.</p>
      )}
    </CardContent>
  </Card>
);
