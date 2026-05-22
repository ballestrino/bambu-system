"use client";

import { useState } from "react";
import { LoaderCircle, Pencil, Plus } from "lucide-react";

import {
  dashboardPrimaryActionClass,
  dashboardSecondaryActionClass,
} from "@/components/dashboard/dashboard-styles";
import { useEmployees } from "@/components/ops/hooks/useEmployees";
import { useJobEmployeeAssignmentMutations } from "@/components/ops/hooks/useJobEmployeeAssignmentMutations";
import {
  OpsFormBody, OpsFormDialogContent, OpsFormField, OpsFormFooter,
  OpsFormGrid, OpsFormHeader, opsFormControlClass,
  opsFormSelectTriggerClass,
} from "@/components/ops/shared";
import type { OpsJobEmployeeAssignment } from "@/components/ops/types";
import { toDateTimeLocalValue } from "@/components/ops/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const getInitialState = (assignment?: OpsJobEmployeeAssignment) => ({
  employeeId: assignment?.employeeId ?? "",
  roleLabel: assignment?.roleLabel ?? "",
  assignedFrom: toDateTimeLocalValue(assignment?.assignedFrom ?? new Date()),
  assignedTo: toDateTimeLocalValue(assignment?.assignedTo),
});

export const JobAssignmentDialog = ({
  jobId,
  assignment,
}: {
  jobId: string;
  assignment?: OpsJobEmployeeAssignment;
}) => {
  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState(getInitialState(assignment));
  const { employees } = useEmployees({ isActive: true });
  const { createAssignmentAsync, updateAssignmentAsync, isCreating, isUpdating } =
    useJobEmployeeAssignmentMutations(jobId, assignment?.employeeId);
  const isPending = isCreating || isUpdating;

  const handleSubmit = () => {
    setOpen(false);

    if (assignment) {
      void updateAssignmentAsync({
        assignmentId: assignment.id,
        onErrorAction: () => setOpen(true),
        values: {
          roleLabel: formState.roleLabel,
          assignedFrom: new Date(formState.assignedFrom),
          assignedTo: formState.assignedTo ? new Date(formState.assignedTo) : null,
        },
      }).catch(() => undefined);
    } else {
      void createAssignmentAsync({
        jobId,
        onErrorAction: () => setOpen(true),
        employeeId: formState.employeeId,
        roleLabel: formState.roleLabel || undefined,
        assignedFrom: new Date(formState.assignedFrom),
        assignedTo: formState.assignedTo ? new Date(formState.assignedTo) : undefined,
      }).catch(() => undefined);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) setFormState(getInitialState(assignment));
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        {assignment ? (
          <Button variant="outline" size="sm" className={dashboardSecondaryActionClass}>
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        ) : (
          <Button size="sm" className={dashboardPrimaryActionClass}>
            <Plus className="h-4 w-4" />
            Asignar empleado
          </Button>
        )}
      </DialogTrigger>
      <OpsFormDialogContent size="sm">
        <OpsFormHeader>
          <DialogTitle>{assignment ? "Editar asignación" : "Asignar empleado"}</DialogTitle>
        </OpsFormHeader>
        <OpsFormBody className="grid gap-4">
          <OpsFormField label="Empleado">
            {assignment ? (
              <Input className={opsFormControlClass} value={assignment.employee.name} disabled />
            ) : (
              <Select value={formState.employeeId} onValueChange={(employeeId) => setFormState((current) => ({ ...current, employeeId }))}>
                <SelectTrigger className={opsFormSelectTriggerClass}>
                  <SelectValue placeholder="Seleccionar empleado activo" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </OpsFormField>
          <OpsFormField label="Rol">
            <Input className={opsFormControlClass} value={formState.roleLabel} onChange={(event) => setFormState((current) => ({ ...current, roleLabel: event.target.value }))} />
          </OpsFormField>
          <OpsFormGrid>
            <OpsFormField label="Desde">
              <Input className={opsFormControlClass} type="datetime-local" value={formState.assignedFrom} onChange={(event) => setFormState((current) => ({ ...current, assignedFrom: event.target.value }))} />
            </OpsFormField>
            <OpsFormField label="Hasta">
              <Input className={opsFormControlClass} type="datetime-local" value={formState.assignedTo} onChange={(event) => setFormState((current) => ({ ...current, assignedTo: event.target.value }))} />
            </OpsFormField>
          </OpsFormGrid>
        </OpsFormBody>
        <OpsFormFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button disabled={isPending || !formState.assignedFrom || (!assignment && !formState.employeeId)} onClick={handleSubmit}>
            {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {assignment ? "Guardar cambios" : "Asignar"}
          </Button>
        </OpsFormFooter>
      </OpsFormDialogContent>
    </Dialog>
  );
};
