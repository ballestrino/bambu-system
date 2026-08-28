"use client";

import type { ReactElement, ReactNode } from "react";
import { CalendarClock, CalendarPlus } from "lucide-react";

import { JobOccurrenceDialogActions } from "@/components/ops/jobs/job-occurrence-dialog-actions";
import {
  OpsFormBody,
  OpsFormDialogContent,
  OpsFormFooter,
  OpsFormHeader,
} from "@/components/ops/shared";
import {
  Dialog,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

type JobOccurrenceDialogPresentationProps = {
  canSubmit: boolean;
  children: ReactNode;
  isEditing: boolean;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onRemove: () => void | Promise<void>;
  onSubmit: () => void;
  open: boolean;
  trigger: ReactElement;
};

const presentationCopy = (isEditing: boolean) => ({
  description: isEditing
    ? "Actualiza la planificación, el equipo o el estado sin perder el contexto de la agenda."
    : "Define la planificación. Puede quedar sin equipo para resolverla luego desde la agenda.",
  eyebrow: isEditing ? "Detalle de la agenda" : "Planificación de la agenda",
  title: isEditing ? "Editar visita" : "Crear visita",
});

export const JobOccurrenceDialogPresentation = ({
  canSubmit,
  children,
  isEditing,
  isPending,
  onOpenChange,
  onRemove,
  onSubmit,
  open,
  trigger,
}: JobOccurrenceDialogPresentationProps) => {
  const isMobile = useIsMobile();
  const copy = presentationCopy(isEditing);
  const Icon = isEditing ? CalendarClock : CalendarPlus;
  const actions = (
    <JobOccurrenceDialogActions
      canSubmit={canSubmit}
      isEditing={isEditing}
      isMobile={isMobile}
      isPending={isPending}
      onCancel={() => onOpenChange(false)}
      onRemove={onRemove}
      onSubmit={onSubmit}
    />
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent
          className="grid! h-[min(92dvh,820px)]! max-h-[92dvh] grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-t-[var(--ops-radius-dialog)] border-ops-border bg-ops-surface p-0 shadow-[var(--ops-shadow-elevated)]"
          side="bottom"
        >
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-ops-border" />
          <SheetHeader className="border-b border-ops-border bg-ops-surface-muted px-4 pb-4 pt-3 text-left">
            <div className="flex items-start gap-3 pr-8">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--ops-radius-control)] bg-ops-bamboo-soft text-ops-bamboo-strong">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 space-y-1">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ops-bamboo-strong">
                  {copy.eyebrow}
                </p>
                <SheetTitle className="text-xl leading-tight text-ops-text">
                  {copy.title}
                </SheetTitle>
                <SheetDescription className="leading-relaxed">
                  {copy.description}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-ops-canvas px-4 py-4">
            <div className="grid gap-4">{children}</div>
          </div>
          <div className="shrink-0 space-y-2 border-t border-ops-border bg-ops-surface/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
            {actions}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <OpsFormDialogContent size="md">
        <OpsFormHeader className="bg-ops-surface-muted">
          <div className="flex items-start gap-3 pr-8">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--ops-radius-control)] bg-ops-bamboo-soft text-ops-bamboo-strong">
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 space-y-1">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ops-bamboo-strong">
                {copy.eyebrow}
              </p>
              <DialogTitle className="text-xl leading-tight text-ops-text">
                {copy.title}
              </DialogTitle>
              <DialogDescription className="leading-relaxed">
                {copy.description}
              </DialogDescription>
            </div>
          </div>
        </OpsFormHeader>
        <OpsFormBody className="grid gap-4 bg-ops-canvas">{children}</OpsFormBody>
        <OpsFormFooter>{actions}</OpsFormFooter>
      </OpsFormDialogContent>
    </Dialog>
  );
};
