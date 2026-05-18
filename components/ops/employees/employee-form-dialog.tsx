"use client";

import { useState } from "react";
import { LoaderCircle, Pencil, Plus } from "lucide-react";

import {
  dashboardPrimaryActionClass,
  dashboardSecondaryActionClass,
} from "@/components/dashboard/dashboard-styles";
import { getHourlyRateNumber } from "@/components/ops/employees/employee-payroll";
import {
  OpsFormBody,
  OpsFormDialogContent,
  OpsFormField,
  OpsFormFooter,
  OpsFormGrid,
  OpsFormHeader,
  opsFormControlClass,
  opsFormSwitchClass,
  opsFormTextareaClass,
  opsFormToggleClass,
} from "@/components/ops/shared";
import type { OpsEmployee, OpsEmployeeDetail } from "@/components/ops/types";
import { useEmployeeMutations } from "@/components/ops/hooks/useEmployeeMutations";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type EditableEmployee = Pick<
  OpsEmployee | OpsEmployeeDetail,
  "id" | "name" | "email" | "phone" | "hourlyRate" | "notes" | "isActive"
>;

const getInitialState = (employee?: EditableEmployee) => ({
  name: employee?.name ?? "",
  email: employee?.email ?? "",
  phone: employee?.phone ?? "",
  hourlyRate:
    employee?.hourlyRate === null || employee?.hourlyRate === undefined
      ? ""
      : String(getHourlyRateNumber(employee.hourlyRate) ?? ""),
  notes: employee?.notes ?? "",
  isActive: employee?.isActive ?? true,
});

export const EmployeeFormDialog = ({
  employee,
}: {
  employee?: EditableEmployee;
}) => {
  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState(getInitialState(employee));
  const { createEmployeeAsync, updateEmployeeAsync, isCreating, isUpdating } =
    useEmployeeMutations();
  const isPending = isCreating || isUpdating;
  const hourlyRate = getHourlyRateNumber(formState.hourlyRate);
  const hasHourlyRate = formState.hourlyRate.trim() !== "";
  const isHourlyRateInvalid = hasHourlyRate && hourlyRate === null;

  const handleSubmit = async () => {
    if (isHourlyRateInvalid) {
      return;
    }

    const payload = {
      name: formState.name.trim(),
      email: formState.email,
      phone: formState.phone,
      notes: formState.notes,
      isActive: formState.isActive,
    };

    if (employee) {
      await updateEmployeeAsync({
        employeeId: employee.id,
        values: {
          ...payload,
          hourlyRate: hasHourlyRate ? hourlyRate ?? undefined : null,
        },
      });
    } else {
      await createEmployeeAsync({
        ...payload,
        hourlyRate: hasHourlyRate ? hourlyRate ?? undefined : undefined,
      });
    }

    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) setFormState(getInitialState(employee));
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        {employee ? (
          <Button variant="outline" size="sm" className={dashboardSecondaryActionClass}>
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        ) : (
          <Button className={dashboardPrimaryActionClass}>
            <Plus className="h-4 w-4" />
            Nuevo empleado
          </Button>
        )}
      </DialogTrigger>
      <OpsFormDialogContent size="md">
        <OpsFormHeader>
          <DialogTitle>{employee ? "Editar empleado" : "Crear empleado"}</DialogTitle>
        </OpsFormHeader>
        <OpsFormBody className="grid gap-4">
          <OpsFormField label="Nombre">
            <Input className={opsFormControlClass} value={formState.name} onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))} />
          </OpsFormField>
          <OpsFormGrid>
            <OpsFormField label="Email">
              <Input className={opsFormControlClass} value={formState.email} onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))} />
            </OpsFormField>
            <OpsFormField label="Teléfono">
              <Input className={opsFormControlClass} value={formState.phone} onChange={(event) => setFormState((current) => ({ ...current, phone: event.target.value }))} />
            </OpsFormField>
          </OpsFormGrid>
          <OpsFormField label="Tarifa horaria">
            <Input
              className={opsFormControlClass}
              min="0"
              step="0.01"
              type="number"
              value={formState.hourlyRate}
              onChange={(event) => setFormState((current) => ({ ...current, hourlyRate: event.target.value }))}
            />
          </OpsFormField>
          <OpsFormField label="Notas">
            <Textarea className={opsFormTextareaClass} value={formState.notes} onChange={(event) => setFormState((current) => ({ ...current, notes: event.target.value }))} />
          </OpsFormField>
          <label className={opsFormToggleClass}>
            Activo
            <Switch className={opsFormSwitchClass} checked={formState.isActive} onCheckedChange={(isActive) => setFormState((current) => ({ ...current, isActive }))} />
          </label>
        </OpsFormBody>
        <OpsFormFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button disabled={isPending || !formState.name.trim() || isHourlyRateInvalid} onClick={handleSubmit}>
            {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {employee ? "Guardar cambios" : "Crear empleado"}
          </Button>
        </OpsFormFooter>
      </OpsFormDialogContent>
    </Dialog>
  );
};
