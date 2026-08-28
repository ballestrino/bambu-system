"use client";

import type { ComponentProps, ReactNode } from "react";

import {
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const dialogSizeClass = {
  sm: "sm:max-w-lg",
  md: "sm:max-w-xl",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-3xl",
} as const;

type OpsFormDialogContentProps = ComponentProps<typeof DialogContent> & {
  size?: keyof typeof dialogSizeClass;
};

type OpsFormFieldProps = {
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  label: string;
};

type OpsFormGridProps = {
  children: ReactNode;
  className?: string;
  columns?: 2 | 3;
};

export const opsFormControlClass =
  "min-h-11 w-full rounded-[var(--ops-radius-control)] border-ops-border bg-ops-surface px-3 text-ops-text shadow-none transition-colors placeholder:text-ops-text-muted hover:bg-ops-surface-muted focus-visible:border-ops-bamboo focus-visible:ring-ops-bamboo/20 disabled:bg-muted/60";

export const opsFormSelectTriggerClass =
  "h-11! min-h-11 w-full rounded-[var(--ops-radius-control)] border-ops-border bg-ops-surface px-3 text-ops-text shadow-none transition-colors hover:bg-ops-surface-muted focus:border-ops-bamboo focus:ring-ops-bamboo/20 data-[size=default]:h-11!";

export const opsFormTextareaClass =
  "min-h-24 w-full rounded-[var(--ops-radius-control)] border-ops-border bg-ops-surface px-3 py-2 text-ops-text shadow-none transition-colors placeholder:text-ops-text-muted hover:bg-ops-surface-muted focus-visible:border-ops-bamboo focus-visible:ring-ops-bamboo/20";

export const opsFormToggleClass =
  "flex min-h-12 w-full items-center justify-between gap-3 rounded-[var(--ops-radius-control)] border border-ops-border bg-ops-surface px-3 py-2 text-sm text-ops-text shadow-none";

export const opsFormSwitchClass =
  "data-[state=checked]:bg-[#53985E] data-[state=unchecked]:bg-[#E2EADF] dark:data-[state=unchecked]:bg-[#2D372C]";

export const opsFormPanelClass =
  "rounded-[var(--ops-radius-row)] bg-ops-surface-muted p-4";

export const OpsFormDialogContent = ({
  children,
  className,
  size = "md",
  ...props
}: OpsFormDialogContentProps) => (
  <DialogContent
    className={cn(
      "grid max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-[var(--ops-radius-dialog)] border-ops-border bg-ops-surface p-0 shadow-[var(--ops-shadow-elevated)] sm:max-h-[min(88vh,760px)]",
      dialogSizeClass[size],
      className
    )}
    {...props}
  >
    {children}
  </DialogContent>
);

export const OpsFormHeader = ({
  className,
  ...props
}: ComponentProps<typeof DialogHeader>) => (
  <DialogHeader
    className={cn(
      "border-b border-ops-border px-4 py-4 text-left sm:px-6",
      className
    )}
    {...props}
  />
);

export const OpsFormBody = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div className={cn("min-h-0 overflow-y-auto px-4 py-4 sm:px-6", className)}>
    {children}
  </div>
);

export const OpsFormFooter = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <DialogFooter
    className={cn(
      "border-t border-ops-border bg-ops-surface/95 px-4 py-3 backdrop-blur sm:px-6 [&>button]:w-full sm:[&>button]:w-auto",
      className
    )}
  >
    {children}
  </DialogFooter>
);

export const OpsFormField = ({
  children,
  className,
  description,
  label,
}: OpsFormFieldProps) => (
  <div className={cn("space-y-2", className)}>
    <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </Label>
    {children}
    {description ? (
      <p className="text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
    ) : null}
  </div>
);

export const OpsFormGrid = ({
  children,
  className,
  columns = 2,
}: OpsFormGridProps) => (
  <div
    className={cn(
      "grid gap-4",
      columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2",
      className
    )}
  >
    {children}
  </div>
);
