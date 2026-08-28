"use client";

import { useState } from "react";
import { LoaderCircle, Pencil, Plus } from "lucide-react";

import {
  dashboardPrimaryActionClass,
  dashboardSecondaryActionClass,
} from "@/components/dashboard/dashboard-styles";
import { useEmployeePaymentMutations } from "@/components/ops/hooks/useEmployeePaymentMutations";
import { formatPayrollMoney, toPayrollNumber } from "@/components/ops/payroll/payroll-utils";
import {
  OpsFormBody, OpsFormDialogContent, OpsFormField, OpsFormFooter,
  OpsFormGrid, OpsFormHeader, opsFormControlClass, opsFormPanelClass,
  opsFormSelectTriggerClass, opsFormTextareaClass,
  useOpsSelectedMonth,
} from "@/components/ops/shared";
import type { OpsEmployee, OpsEmployeePayment } from "@/components/ops/types";
import {
  getUtcMonthKey,
  parseUtcMonthKey,
  toDateInputValue,
} from "@/components/ops/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";

const getInitialState = (
  payment?: OpsEmployeePayment,
  defaults?: { assignedMonth?: string; employeeId?: string; periodEnd?: string; periodStart?: string; suggestedAmount?: number | null }
) => ({
  assignedMonth: payment?.assignedMonth
    ? getUtcMonthKey(new Date(payment.assignedMonth))
    : defaults?.assignedMonth ?? "",
  amount: payment ? String(toPayrollNumber(payment.amount)) : defaults?.suggestedAmount ? String(defaults.suggestedAmount) : "",
  employeeId: payment?.employeeId ?? defaults?.employeeId ?? "",
  notes: payment?.notes ?? "",
  paymentDate: toDateInputValue(payment?.paymentDate ?? new Date()),
  periodEnd: payment
    ? toDateInputValue(payment.periodEnd)
    : defaults?.periodEnd ?? "",
  periodStart: payment
    ? toDateInputValue(payment.periodStart)
    : defaults?.periodStart ?? "",
  reference: payment?.reference ?? "",
});

export const PayrollDialog = ({
  employeeId,
  employees,
  payment,
  periodEnd,
  periodStart,
  suggestedAmount,
}: {
  employeeId?: string;
  employees: OpsEmployee[];
  payment?: OpsEmployeePayment;
  periodEnd?: string;
  periodStart?: string;
  suggestedAmount?: number | null;
}) => {
  const { monthKey } = useOpsSelectedMonth();
  const defaults = {
    assignedMonth: monthKey,
    employeeId,
    periodEnd,
    periodStart,
    suggestedAmount,
  };
  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState(getInitialState(payment, defaults));
  const { createPaymentAsync, updatePaymentAsync, isCreating, isUpdating } =
    useEmployeePaymentMutations(employeeId ?? payment?.employeeId);
  const isPending = isCreating || isUpdating;
  const amount = toPayrollNumber(formState.amount);

  const handleSubmit = async () => {
    const assignedMonth = parseUtcMonthKey(formState.assignedMonth);
    if (!assignedMonth) return;

    if (payment) {
      await updatePaymentAsync({
        paymentId: payment.id,
        values: {
          assignedMonth,
          amount,
          notes: formState.notes,
          paymentDate: new Date(`${formState.paymentDate}T00:00:00`),
          periodEnd: new Date(`${formState.periodEnd}T23:59:59`),
          periodStart: new Date(`${formState.periodStart}T00:00:00`),
          reference: formState.reference,
        },
      });
    } else {
      await createPaymentAsync({
        assignedMonth,
        amount,
        employeeId: formState.employeeId,
        notes: formState.notes || undefined,
        paymentDate: new Date(`${formState.paymentDate}T00:00:00`),
        periodEnd: new Date(`${formState.periodEnd}T23:59:59`),
        periodStart: new Date(`${formState.periodStart}T00:00:00`),
        reference: formState.reference || undefined,
        status: "RECORDED",
      });
    }

    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) setFormState(getInitialState(payment, defaults));
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        {payment ? (
          <Button variant="outline" size="sm" className={dashboardSecondaryActionClass}><Pencil className="h-4 w-4" />Editar</Button>
        ) : (
          <Button size="sm" className={dashboardPrimaryActionClass}><Plus className="h-4 w-4" />Registrar pago</Button>
        )}
      </DialogTrigger>
      <OpsFormDialogContent size="sm">
        <OpsFormHeader>
          <DialogTitle>{payment ? "Editar pago" : "Registrar pago"}</DialogTitle>
        </OpsFormHeader>
        <OpsFormBody className="grid gap-4">
          {!employeeId && !payment ? (
            <OpsFormField label="Empleado">
              <SearchableSelect
                aria-label="Seleccionar empleada"
                className={opsFormSelectTriggerClass}
                onValueChange={(nextEmployeeId) => setFormState((current) => ({ ...current, employeeId: nextEmployeeId }))}
                options={employees.map((employee) => ({ label: employee.name, value: employee.id }))}
                placeholder="Seleccionar empleada"
                searchPlaceholder="Buscar empleada..."
                value={formState.employeeId}
              />
            </OpsFormField>
          ) : null}
          {suggestedAmount ? (
            <p className={opsFormPanelClass}>
              Sugerido para el periodo: {formatPayrollMoney(suggestedAmount)}
            </p>
          ) : null}
          <OpsFormGrid>
            <OpsFormField label="Mes asignado"><Input className={opsFormControlClass} type="month" value={formState.assignedMonth} onChange={(event) => setFormState((current) => ({ ...current, assignedMonth: event.target.value }))} /></OpsFormField>
            <OpsFormField label="Fecha de pago"><Input className={opsFormControlClass} type="date" value={formState.paymentDate} onChange={(event) => setFormState((current) => ({ ...current, paymentDate: event.target.value }))} /></OpsFormField>
          </OpsFormGrid>
          <OpsFormGrid>
            <OpsFormField label="Periodo desde"><Input className={opsFormControlClass} type="date" value={formState.periodStart} onChange={(event) => setFormState((current) => ({ ...current, periodStart: event.target.value }))} /></OpsFormField>
            <OpsFormField label="Periodo hasta"><Input className={opsFormControlClass} type="date" value={formState.periodEnd} onChange={(event) => setFormState((current) => ({ ...current, periodEnd: event.target.value }))} /></OpsFormField>
          </OpsFormGrid>
          <OpsFormField label="Monto"><Input className={opsFormControlClass} min="0.01" step="0.01" type="number" value={formState.amount} onChange={(event) => setFormState((current) => ({ ...current, amount: event.target.value }))} /></OpsFormField>
          <OpsFormField label="Referencia"><Input className={opsFormControlClass} value={formState.reference} onChange={(event) => setFormState((current) => ({ ...current, reference: event.target.value }))} /></OpsFormField>
          <OpsFormField label="Notas"><Textarea className={opsFormTextareaClass} value={formState.notes} onChange={(event) => setFormState((current) => ({ ...current, notes: event.target.value }))} /></OpsFormField>
        </OpsFormBody>
        <OpsFormFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button disabled={isPending || amount <= 0 || !formState.assignedMonth || !formState.employeeId || !formState.paymentDate || !formState.periodStart || !formState.periodEnd} onClick={handleSubmit}>
            {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            Guardar pago
          </Button>
        </OpsFormFooter>
      </OpsFormDialogContent>
    </Dialog>
  );
};
