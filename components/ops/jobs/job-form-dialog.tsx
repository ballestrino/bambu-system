"use client";

import { useState } from "react";
import { LoaderCircle, Pencil, Plus } from "lucide-react";

import type { OpsJobDetail, OpsJobListItem } from "@/components/ops/types";
import { BudgetSourceSelector } from "@/components/ops/jobs/budget-source-selector";
import { useJobMutations } from "@/components/ops/hooks/useJobMutations";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { jobStatusValues } from "@/schemas/ops";

type EditableJob = {
  id: string;
  name: string;
  description?: string | null;
  serviceAddress?: string | null;
  serviceLocation?: string | null;
  operationalNotes?: string | null;
  status: string;
  sourceBudgetId?: string | null;
  sourceBudgetOptionId?: string | null;
};

const getInitialState = (job?: EditableJob) => ({
  name: job?.name ?? "",
  description: job?.description ?? "",
  serviceAddress: job?.serviceAddress ?? "",
  serviceLocation: job?.serviceLocation ?? "",
  operationalNotes: job?.operationalNotes ?? "",
  status: job?.status ?? "DRAFT",
  sourceBudgetId: job?.sourceBudgetId ?? "",
  sourceBudgetOptionId: job?.sourceBudgetOptionId ?? "",
});

export const JobFormDialog = ({
  job,
  triggerLabel,
}: {
  job?: EditableJob | OpsJobListItem | OpsJobDetail;
  triggerLabel?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState(getInitialState(job));
  const { createJobAsync, updateJobAsync, isCreating, isUpdating } = useJobMutations();

  const isPending = isCreating || isUpdating;

  const handleSubmit = async () => {
    const payload = {
      name: formState.name.trim(),
      description: formState.description,
      serviceAddress: formState.serviceAddress,
      serviceLocation: formState.serviceLocation,
      operationalNotes: formState.operationalNotes,
      status: formState.status as (typeof jobStatusValues)[number],
      sourceBudgetId: formState.sourceBudgetId || null,
      sourceBudgetOptionId: formState.sourceBudgetOptionId || null,
    };

    if (job) {
      await updateJobAsync({ jobId: job.id, values: payload });
    } else {
      await createJobAsync(payload);
    }

    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setFormState(getInitialState(job));
        }

        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        {job ? (
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4" />
            {triggerLabel ?? "Editar"}
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4" />
            {triggerLabel ?? "Nuevo trabajo"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{job ? "Editar trabajo" : "Crear trabajo"}</DialogTitle>
          <DialogDescription>
            Definí la operación base y, si querés, vinculala a un presupuesto existente.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={formState.name} onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={formState.status} onValueChange={(value) => setFormState((current) => ({ ...current, status: value }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {jobStatusValues.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea value={formState.description} onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Dirección de servicio</Label>
              <Input value={formState.serviceAddress} onChange={(event) => setFormState((current) => ({ ...current, serviceAddress: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Ubicación de referencia</Label>
              <Input value={formState.serviceLocation} onChange={(event) => setFormState((current) => ({ ...current, serviceLocation: event.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notas operativas</Label>
            <Textarea value={formState.operationalNotes} onChange={(event) => setFormState((current) => ({ ...current, operationalNotes: event.target.value }))} />
          </div>
          <BudgetSourceSelector
            sourceBudgetId={formState.sourceBudgetId}
            sourceBudgetOptionId={formState.sourceBudgetOptionId}
            onBudgetChange={(sourceBudgetId) => setFormState((current) => ({ ...current, sourceBudgetId }))}
            onOptionChange={(sourceBudgetOptionId) => setFormState((current) => ({ ...current, sourceBudgetOptionId }))}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button disabled={isPending || !formState.name.trim()} onClick={handleSubmit}>
            {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {job ? "Guardar cambios" : "Crear trabajo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
