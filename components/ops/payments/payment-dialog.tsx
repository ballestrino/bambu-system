"use client";

import { useState } from "react";
import { LoaderCircle, Pencil, Plus } from "lucide-react";

import { useJobClientPaymentMutations } from "@/components/ops/hooks/useJobClientPaymentMutations";
import type { OpsJobClientPayment, OpsJobListItem } from "@/components/ops/types";
import { toDateInputValue } from "@/components/ops/utils";
import { toMoneyNumber } from "@/components/ops/payments/payment-utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const getInitialState = (payment?: OpsJobClientPayment, jobId?: string) => ({
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
  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState(getInitialState(payment, jobId));
  const { createPaymentAsync, updatePaymentAsync, isCreating, isUpdating } =
    useJobClientPaymentMutations(jobId ?? payment?.jobId);
  const isPending = isCreating || isUpdating;
  const amount = toMoneyNumber(formState.amount);

  const handleSubmit = async () => {
    if (payment) {
      await updatePaymentAsync({
        paymentId: payment.id,
        values: {
          paymentDate: new Date(`${formState.paymentDate}T00:00:00`),
          amount,
          reference: formState.reference,
          notes: formState.notes,
        },
      });
    } else {
      await createPaymentAsync({
        jobId: formState.jobId,
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
        if (nextOpen) setFormState(getInitialState(payment, jobId));
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        {payment ? (
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Registrar cobro
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{payment ? "Editar cobro" : "Registrar cobro"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          {!jobId && !payment ? (
            <div className="space-y-2">
              <Label>Trabajo</Label>
              <Select value={formState.jobId} onValueChange={(nextJobId) => setFormState((current) => ({ ...current, jobId: nextJobId }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Seleccionar trabajo" /></SelectTrigger>
                <SelectContent>
                  {jobs.map((job) => <SelectItem key={job.id} value={job.id}>{job.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={formState.paymentDate} onChange={(event) => setFormState((current) => ({ ...current, paymentDate: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Monto</Label>
              <Input min="0.01" step="0.01" type="number" value={formState.amount} onChange={(event) => setFormState((current) => ({ ...current, amount: event.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Referencia</Label>
            <Input value={formState.reference} onChange={(event) => setFormState((current) => ({ ...current, reference: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea value={formState.notes} onChange={(event) => setFormState((current) => ({ ...current, notes: event.target.value }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button disabled={isPending || !formState.paymentDate || amount <= 0 || (!payment && !formState.jobId)} onClick={handleSubmit}>
            {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            Guardar cobro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
