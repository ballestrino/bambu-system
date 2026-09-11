"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import {
  OpsFormBody,
  OpsFormDialogContent,
  OpsFormHeader,
} from "@/components/ops/shared";
import { Dialog, DialogDescription, DialogTitle } from "@/components/ui/dialog";

// Cascara comun de los paneles del cronograma (huecos y disponibilidad) para no
// repetir el encabezado del dialogo en cada uno.
export const SchedulePanelDialog = ({
  children,
  description,
  eyebrow,
  icon: Icon,
  onOpenChange,
  open,
  title,
}: {
  children: ReactNode;
  description: string;
  eyebrow: string;
  icon: LucideIcon;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <OpsFormDialogContent size="lg">
      <OpsFormHeader className="bg-ops-surface-muted">
        <div className="flex items-start gap-3 pr-8">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--ops-radius-control)] bg-ops-bamboo-soft text-ops-bamboo-strong">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ops-bamboo-strong">
              {eyebrow}
            </p>
            <DialogTitle className="text-xl leading-tight text-ops-text">
              {title}
            </DialogTitle>
            <DialogDescription className="leading-relaxed">
              {description}
            </DialogDescription>
          </div>
        </div>
      </OpsFormHeader>
      <OpsFormBody className="bg-ops-canvas">{children}</OpsFormBody>
    </OpsFormDialogContent>
  </Dialog>
);
