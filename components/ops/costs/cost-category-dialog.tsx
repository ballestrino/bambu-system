"use client";

import { useState } from "react";
import { LoaderCircle, Pencil, Plus } from "lucide-react";

import { dashboardPrimaryActionClass, dashboardSecondaryActionClass } from "@/components/dashboard/dashboard-styles";
import { useOperationalCostCategoryMutations } from "@/components/ops/hooks/useOperationalCostCategoryMutations";
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
} from "@/components/ops/shared";
import type { OpsOperationalCostCategory } from "@/components/ops/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { OperationalCostCategoryKind } from "@prisma/client";

const getInitialState = (category?: OpsOperationalCostCategory) => ({
  color: category?.color ?? "#53985E",
  description: category?.description ?? "",
  kind: category?.kind ?? "GENERAL",
  name: category?.name ?? "",
});

export const CostCategoryDialog = ({
  category,
}: {
  category?: OpsOperationalCostCategory;
}) => {
  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState(getInitialState(category));
  const { createCategoryAsync, updateCategoryAsync, isCreating, isUpdating } =
    useOperationalCostCategoryMutations();
  const isPending = isCreating || isUpdating;

  const handleSubmit = async () => {
    const values = {
      color: formState.color,
      description: formState.description || undefined,
      isActive: true,
      kind: formState.kind as OperationalCostCategoryKind,
      name: formState.name.trim(),
    };

    if (category) {
      await updateCategoryAsync({ categoryId: category.id, values });
    } else {
      await createCategoryAsync(values);
    }

    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) setFormState(getInitialState(category));
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        {category ? (
          <Button variant="outline" size="sm" className={dashboardSecondaryActionClass}>
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        ) : (
          <Button variant="outline" className={dashboardPrimaryActionClass}>
            <Plus className="h-4 w-4" />
            Categoria
          </Button>
        )}
      </DialogTrigger>
      <OpsFormDialogContent size="sm">
        <OpsFormHeader>
          <DialogTitle>{category ? "Editar categoria" : "Crear categoria"}</DialogTitle>
        </OpsFormHeader>
        <OpsFormBody className="grid gap-4">
          <OpsFormGrid>
            <OpsFormField label="Nombre">
              <Input className={opsFormControlClass} value={formState.name} onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))} />
            </OpsFormField>
            <OpsFormField label="Color">
              <Input className={opsFormControlClass} type="color" value={formState.color} onChange={(event) => setFormState((current) => ({ ...current, color: event.target.value }))} />
            </OpsFormField>
          </OpsFormGrid>
          <OpsFormField label="Tipo">
            <Select value={formState.kind} onValueChange={(kind) => setFormState((current) => ({ ...current, kind: kind as OperationalCostCategoryKind }))}>
              <SelectTrigger className={opsFormSelectTriggerClass}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="GENERAL">General</SelectItem>
                <SelectItem value="BPS">BPS</SelectItem>
                <SelectItem value="TRANSPORT">Transporte</SelectItem>
              </SelectContent>
            </Select>
          </OpsFormField>
          <OpsFormField label="Descripcion">
            <Textarea className={opsFormTextareaClass} value={formState.description} onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))} />
          </OpsFormField>
        </OpsFormBody>
        <OpsFormFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button disabled={isPending || !formState.name.trim()} onClick={handleSubmit}>
            {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            Guardar categoria
          </Button>
        </OpsFormFooter>
      </OpsFormDialogContent>
    </Dialog>
  );
};
