"use client";

import { useState } from "react";
import { LoaderCircle, Pencil, Plus } from "lucide-react";

import { dashboardPrimaryActionClass, dashboardSecondaryActionClass } from "@/components/dashboard/dashboard-styles";
import { toCostNumber } from "@/components/ops/costs/cost-utils";
import { useOperationalCostMutations } from "@/components/ops/hooks/useOperationalCostMutations";
import {
  OpsFormBody,
  OpsFormDialogContent,
  OpsFormField,
  OpsFormFooter,
  OpsFormGrid,
  OpsFormHeader,
  opsFormControlClass,
  opsFormSelectTriggerClass,
  opsFormTextareaClass,
  useOpsSelectedMonth,
} from "@/components/ops/shared";
import type {
  OpsEmployee,
  OpsJobListItem,
  OpsOperationalCost,
  OpsOperationalCostCategory,
} from "@/components/ops/types";
import { getUtcMonthKey, parseUtcMonthKey, toDateInputValue } from "@/components/ops/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const noneValue = "NONE";

const getInitialState = (defaultMonthKey: string, cost?: OpsOperationalCost) => ({
  amount: cost ? String(toCostNumber(cost.amount)) : "",
  assignedMonth: cost?.assignedMonth
    ? getUtcMonthKey(new Date(cost.assignedMonth))
    : defaultMonthKey,
  categoryId: cost?.categoryId ?? "",
  costDate: toDateInputValue(cost?.costDate ?? new Date()),
  employeeId: cost?.employeeId ?? noneValue,
  jobId: cost?.jobId ?? noneValue,
  notes: cost?.notes ?? "",
  reference: cost?.reference ?? "",
});

export const CostDialog = ({
  categories,
  cost,
  employees,
  jobs,
}: {
  categories: OpsOperationalCostCategory[];
  cost?: OpsOperationalCost;
  employees: OpsEmployee[];
  jobs: OpsJobListItem[];
}) => {
  const { monthKey } = useOpsSelectedMonth();
  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState(getInitialState(monthKey, cost));
  const { createCostAsync, updateCostAsync, isCreating, isUpdating } =
    useOperationalCostMutations();
  const amount = toCostNumber(formState.amount);
  const isPending = isCreating || isUpdating;

  const handleSubmit = async () => {
    const assignedMonth = parseUtcMonthKey(formState.assignedMonth);
    if (!assignedMonth) return;

    const values = {
      amount,
      assignedMonth,
      categoryId: formState.categoryId,
      costDate: new Date(`${formState.costDate}T00:00:00`),
      employeeId: formState.employeeId === noneValue ? null : formState.employeeId,
      jobId: formState.jobId === noneValue ? null : formState.jobId,
      notes: formState.notes || undefined,
      reference: formState.reference || undefined,
      status: cost?.status ?? "RECORDED",
    };

    if (cost) {
      await updateCostAsync({ costId: cost.id, values });
    } else {
      await createCostAsync(values);
    }

    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) setFormState(getInitialState(monthKey, cost));
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        {cost ? (
          <Button variant="outline" size="sm" className={dashboardSecondaryActionClass}>
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        ) : (
          <Button className={dashboardPrimaryActionClass}>
            <Plus className="h-4 w-4" />
            Registrar coste
          </Button>
        )}
      </DialogTrigger>
      <OpsFormDialogContent size="md">
        <OpsFormHeader>
          <DialogTitle>{cost ? "Editar coste" : "Registrar coste"}</DialogTitle>
        </OpsFormHeader>
        <OpsFormBody className="grid gap-4">
          <OpsFormField label="Categoria">
            <Select value={formState.categoryId} onValueChange={(categoryId) => setFormState((current) => ({ ...current, categoryId }))}>
              <SelectTrigger className={opsFormSelectTriggerClass}><SelectValue placeholder="Seleccionar categoria" /></SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </OpsFormField>
          <OpsFormGrid>
            <OpsFormField label="Mes asignado"><Input className={opsFormControlClass} type="month" value={formState.assignedMonth} onChange={(event) => setFormState((current) => ({ ...current, assignedMonth: event.target.value }))} /></OpsFormField>
            <OpsFormField label="Fecha del coste"><Input className={opsFormControlClass} type="date" value={formState.costDate} onChange={(event) => setFormState((current) => ({ ...current, costDate: event.target.value }))} /></OpsFormField>
          </OpsFormGrid>
          <OpsFormGrid>
            <OpsFormField label="Monto"><Input className={opsFormControlClass} min="0.01" step="0.01" type="number" value={formState.amount} onChange={(event) => setFormState((current) => ({ ...current, amount: event.target.value }))} /></OpsFormField>
          </OpsFormGrid>
          <OpsFormGrid>
            <OpsFormField label="Trabajo">
              <Select value={formState.jobId} onValueChange={(jobId) => setFormState((current) => ({ ...current, jobId }))}>
                <SelectTrigger className={opsFormSelectTriggerClass}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={noneValue}>Sin trabajo</SelectItem>
                  {jobs.map((job) => <SelectItem key={job.id} value={job.id}>{job.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </OpsFormField>
            <OpsFormField label="Empleada">
              <Select value={formState.employeeId} onValueChange={(employeeId) => setFormState((current) => ({ ...current, employeeId }))}>
                <SelectTrigger className={opsFormSelectTriggerClass}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={noneValue}>Sin empleada</SelectItem>
                  {employees.map((employee) => <SelectItem key={employee.id} value={employee.id}>{employee.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </OpsFormField>
          </OpsFormGrid>
          <OpsFormField label="Referencia"><Input className={opsFormControlClass} value={formState.reference} onChange={(event) => setFormState((current) => ({ ...current, reference: event.target.value }))} /></OpsFormField>
          <OpsFormField label="Notas"><Textarea className={opsFormTextareaClass} value={formState.notes} onChange={(event) => setFormState((current) => ({ ...current, notes: event.target.value }))} /></OpsFormField>
        </OpsFormBody>
        <OpsFormFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button disabled={isPending || !formState.assignedMonth || !formState.categoryId || amount <= 0 || !formState.costDate} onClick={handleSubmit}>
            {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            Guardar coste
          </Button>
        </OpsFormFooter>
      </OpsFormDialogContent>
    </Dialog>
  );
};
