"use client";

import type { ReactNode } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import DeleteDialog from "@/components/ui/delete-dialog";

type JobOccurrenceDialogActionsProps = {
  canSubmit: boolean;
  isEditing: boolean;
  isMobile: boolean;
  isPending: boolean;
  onCancel: () => void;
  onRemove: () => void | Promise<void>;
  onSubmit: () => void;
  removeNotice?: ReactNode;
  submitLabel: string;
};

const DeleteVisitAction = ({
  isMobile,
  isPending,
  onRemove,
  removeNotice,
}: Pick<
  JobOccurrenceDialogActionsProps,
  "isMobile" | "isPending" | "onRemove" | "removeNotice"
>) => (
  <DeleteDialog
    title="Eliminar visita"
    description="La visita dejará de aparecer en el calendario y el historial activo. Esta acción no cambia solamente su estado."
    deleteButtonText="Eliminar visita"
    onConfirm={onRemove}
    trigger={
      <Button
        type="button"
        variant={isMobile ? "ghost" : "destructive"}
        className={
          isMobile
            ? "min-h-11 w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
            : "sm:mr-auto"
        }
        disabled={isPending}
      >
        <Trash2 className="h-4 w-4" />
        Eliminar visita
      </Button>
    }
  >
    {removeNotice}
  </DeleteDialog>
);

const PrimaryActions = ({
  canSubmit,
  isPending,
  onCancel,
  onSubmit,
  submitLabel,
}: Pick<
  JobOccurrenceDialogActionsProps,
  "canSubmit" | "isPending" | "onCancel" | "onSubmit" | "submitLabel"
>) => (
  <>
    <Button className="min-h-11" variant="outline" onClick={onCancel}>
      Cancelar
    </Button>
    <Button className="min-h-11" disabled={!canSubmit} onClick={onSubmit}>
      {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      {submitLabel}
    </Button>
  </>
);

export const JobOccurrenceDialogActions = (
  props: JobOccurrenceDialogActionsProps
) => {
  if (props.isMobile) {
    return (
      <>
        <div className="grid grid-cols-2 gap-2">
          <PrimaryActions {...props} />
        </div>
        {props.isEditing ? <DeleteVisitAction {...props} /> : null}
      </>
    );
  }

  return (
    <>
      {props.isEditing ? <DeleteVisitAction {...props} /> : null}
      <PrimaryActions {...props} />
    </>
  );
};
