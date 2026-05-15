"use client";

import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const optionClassName =
  "h-8 rounded-[10px] px-3 text-xs font-medium sm:text-sm";

export const JobBudgetTaxModeToggle = ({
  disabled = false,
  isPending = false,
  label,
  value,
  onValueChange,
}: {
  disabled?: boolean;
  isPending?: boolean;
  label?: string;
  value: boolean;
  onValueChange: (nextValue: boolean) => void;
}) => (
  <div className="space-y-2">
    {label ? (
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">{label}</p>
        {isPending ? (
          <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : null}
      </div>
    ) : isPending ? (
      <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />
    ) : null}
    <div className="inline-flex rounded-xl border border-border bg-muted/40 p-1">
      <Button
        type="button"
        size="sm"
        variant={value ? "default" : "ghost"}
        className={cn(optionClassName, !value && "text-muted-foreground")}
        disabled={disabled || isPending}
        onClick={() => onValueChange(true)}
      >
        Con IVA
      </Button>
      <Button
        type="button"
        size="sm"
        variant={!value ? "default" : "ghost"}
        className={cn(optionClassName, value && "text-muted-foreground")}
        disabled={disabled || isPending}
        onClick={() => onValueChange(false)}
      >
        Sin IVA
      </Button>
    </div>
  </div>
);
