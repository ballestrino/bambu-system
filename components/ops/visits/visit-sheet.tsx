"use client";

import type { ReactNode } from "react";

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

// Hoja inferior del celular (2a): manija, titulo opcional, cuerpo con scroll y
// pie fijo. Sin titulo visible (el detalle trae el suyo) queda solo para
// lectores de pantalla.
export const VisitSheet = ({
  children,
  description,
  footer,
  hideHeader = false,
  onOpenChange,
  open,
  title,
}: {
  children: ReactNode;
  description?: string;
  footer?: ReactNode;
  hideHeader?: boolean;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
}) => (
  <Sheet onOpenChange={onOpenChange} open={open}>
    <SheetContent
      {...(description ? {} : { "aria-describedby": undefined })}
      className="max-h-[90dvh] gap-0 rounded-t-[22px] border-ops-border bg-ops-surface p-0 shadow-[0_-12px_40px_rgb(24_37_29/0.18)]"
      side="bottom"
    >
      <div className="flex flex-none justify-center pt-2 pb-0.5">
        <span className="h-[5px] w-9 rounded-full bg-ops-border" />
      </div>
      <div className={cn("flex flex-none flex-col gap-[3px] px-5 pt-1.5 pb-3", hideHeader && "sr-only")}>
        <SheetTitle className="pr-8 text-xl font-bold tracking-tight text-ops-text">{title}</SheetTitle>
        {description ? (
          <SheetDescription className="text-sm text-ops-text-muted">{description}</SheetDescription>
        ) : null}
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
      {footer ? (
        <div className="flex-none border-t border-ops-surface-muted px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {footer}
        </div>
      ) : null}
    </SheetContent>
  </Sheet>
);
