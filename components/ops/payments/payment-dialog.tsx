"use client";

import { useState } from "react";
import { LoaderCircle, Pencil, Plus } from "lucide-react";

import {
  dashboardPrimaryActionClass,
  dashboardSecondaryActionClass,
} from "@/components/dashboard/dashboard-styles";
import { useJobClientPaymentMutations } from "@/components/ops/hooks/useJobClientPaymentMutations";
import {
  OpsFormBody, OpsFormDialogContent, OpsFormField, OpsFormFooter,
  OpsFormGrid, OpsFormHeader, opsFormControlClass,
  opsFormSelectTriggerClass, opsFormTextareaClass,
  useOpsSelectedMonth,
} from "@/components/ops/shared";
import type { OpsJobClientPayment, OpsJobListItem } from "@/components/ops/types";
import { getUtcMonthKey, parseUtcMonthKey, toDateInputValue } from "@/components/ops/utils";
import { toMoneyNumber } from "@/components/ops/payments/payment-utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const getInitialState = (
  defaultMonthKey: string,
  payment?: OpsJobClientPayment,
  jobId?: string
) => ({
  assignedMonth: payment?.assignedMonth
    ? getUtcMonthKey(new Date(payment.assignedMonth))
    : defaultMonthKey,
  jobId: payment?.jobId ?? jobId ?? "",
  paymentDate: toDateInputValue(payment?.paymentDate ?? new Date()),
  amount: payment ? String(toMoneyNumber(payment.amount)) : "",
  reference: payment?.reference ?? "",
  notes: payment?.notes ?? "",
});

export const PaymentDialog = ({
  jobId,
  jobs,
  payment,
}: {
  jobId?: string;
  jobs: OpsJobListItem[];
  payment?: OpsJobClientPayment;
}) => {
  const { monthKey } = useOpsSelectedMonth();
  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState(
    getInitialState(monthKey, payment, jobId)
  );
  const { createPaymentAsync, updatePaymentAsync, isCreating, isUpdating } =
    useJobClientPaymentMutations(jobId ?? payment?.jobId);
  const isPending = isCreating || isUpdating;
  const amount = toMoneyNumber(formState.amount);

  const handleSubmit = async () => {
    const assignedMonth = parseUtcMonthKey(formState.assignedMonth);
    if (!assignedMonth) return;

    if (payment) {
      await updatePaymentAsync({
        paymentId: payment.id,
        values: {
          assignedMonth,
          paymentDate: new Date(`${formState.paymentDate}T00:00:00`),
          amount,
          reference: formState.reference,
          notes: formState.notes,
        },
      });
    } else {
      await createPaymentAsync({
        jobId: formState.jobId,
        assignedMonth,
        paymentDate: new Date(`${formState.paymentDate}T00:00:00`),
        amount,
        reference: formState.reference || undefined,
        notes: formState.notes || undefined,
        status: "RECORDED",
      });
    }

    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) setFormState(getInitialState(monthKey, payment, jobId));
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        {payment ? (
          <Button variant="outline" size="sm" className={dashboardSecondaryActionClass}>
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        ) : (
          <Button size="sm" className={dashboardPrimaryActionClass}>
            <Plus className="h-4 w-4" />
            Registrar cobro
          </Button>
        )}
      </DialogTrigger>
      <OpsFormDialogContent size="sm">
        <OpsFormHeader>
          <DialogTitle>{payment ? "Editar cobro" : "Registrar cobro"}</DialogTitle>
        </OpsFormHeader>
        <OpsFormBody className="grid gap-4">
          {!jobId && !payment ? (
            <OpsFormField label="Trabajo">
              <Select value={formState.jobId} onValueChange={(nextJobId) => setFormState((current) => ({ ...current, jobId: nextJobId }))}>
                <SelectTrigger className={opsFormSelectTriggerClass}><SelectValue placeholder="Seleccionar trabajo" /></SelectTrigger>
                <SelectContent>
                  {jobs.map((job) => <SelectItem key={job.id} value={job.id}>{job.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </OpsFormField>
          ) : null}
          <OpsFormGrid>
            <OpsFormField label="Mes asignado">
              <Input className={opsFormControlClass} type="month" value={formState.assignedMonth} onChange={(event) => setFormState((current) => ({ ...current, assignedMonth: event.target.value }))} />
            </OpsFormField>
            <OpsFormField label="Fecha de cobro">
              <Input className={opsFormControlClass} type="date" value={formState.paymentDate} onChange={(event) => setFormState((current) => ({ ...current, paymentDate: event.target.value }))} />
            </OpsFormField>
          </OpsFormGrid>
          <OpsFormGrid>
            <OpsFormField label="Monto">
              <Input className={opsFormControlClass} min="0.01" step="0.01" type="number" value={formState.amount} onChange={(event) => setFormState((current) => ({ ...current, amount: event.target.value }))} />
            </OpsFormField>
          </OpsFormGrid>
          <OpsFormField label="Referencia">
            <Input className={opsFormControlClass} value={formState.reference} onChange={(event) => setFormState((current) => ({ ...current, reference: event.target.value }))} />
          </OpsFormField>
          <OpsFormField label="Notas">
            <Textarea className={opsFormTextareaClass} value={formState.notes} onChange={(event) => setFormState((current) => ({ ...current, notes: event.target.value }))} />
          </OpsFormField>
        </OpsFormBody>
        <OpsFormFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button disabled={isPending || !formState.assignedMonth || !formState.paymentDate || amount <= 0 || (!payment && !formState.jobId)} onClick={handleSubmit}>
            {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            Guardar cobro
          </Button>
        </OpsFormFooter>
      </OpsFormDialogContent>
    </Dialog>
  );
};
