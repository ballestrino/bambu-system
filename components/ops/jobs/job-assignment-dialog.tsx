"use client";

import { useState } from "react";
import { LoaderCircle, Pencil, Plus } from "lucide-react";

import { useEmployees } from "@/components/ops/hooks/useEmployees";
import { useJobEmployeeAssignmentMutations } from "@/components/ops/hooks/useJobEmployeeAssignmentMutations";
import type { OpsJobEmployeeAssignment } from "@/components/ops/types";
import { toDateTimeLocalValue } from "@/components/ops/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  const handleSubmit = async () => {
    if (assignment) {
      await updateAssignmentAsync({
        assignmentId: assignment.id,
        values: {
          roleLabel: formState.roleLabel,
          assignedFrom: new Date(formState.assignedFrom),
          assignedTo: formState.assignedTo ? new Date(formState.assignedTo) : null,
        },
      });
    } else {
      await createAssignmentAsync({
        jobId,
        employeeId: formState.employeeId,
        roleLabel: formState.roleLabel || undefined,
        assignedFrom: new Date(formState.assignedFrom),
        assignedTo: formState.assignedTo ? new Date(formState.assignedTo) : undefined,
      });
    }

    setOpen(false);
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
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Asignar empleado
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{assignment ? "Editar asignación" : "Asignar empleado"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Empleado</Label>
            {assignment ? (
              <Input value={assignment.employee.name} disabled />
            ) : (
              <Select value={formState.employeeId} onValueChange={(employeeId) => setFormState((current) => ({ ...current, employeeId }))}>
                <SelectTrigger className="w-full">
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
          </div>
          <div className="space-y-2">
            <Label>Rol</Label>
            <Input value={formState.roleLabel} onChange={(event) => setFormState((current) => ({ ...current, roleLabel: event.target.value }))} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Desde</Label>
              <Input type="datetime-local" value={formState.assignedFrom} onChange={(event) => setFormState((current) => ({ ...current, assignedFrom: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Hasta</Label>
              <Input type="datetime-local" value={formState.assignedTo} onChange={(event) => setFormState((current) => ({ ...current, assignedTo: event.target.value }))} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button disabled={isPending || !formState.assignedFrom || (!assignment && !formState.employeeId)} onClick={handleSubmit}>
            {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {assignment ? "Guardar cambios" : "Asignar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
