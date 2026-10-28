"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

// Casilla de la tabla de empleados (1a): verde bambú y con guion cuando la
// selección es parcial.
export const EmployeeCheckbox = ({
  checked,
  label,
  onCheckedChange,
}: {
  checked: boolean | "indeterminate";
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) => (
  <CheckboxPrimitive.Root
    aria-label={label}
    checked={checked}
    className={cn(
      "flex size-[18px] items-center justify-center rounded-[5px] border-[1.5px] border-[#B9C6B5] bg-ops-surface text-white outline-none focus-visible:ring-2 focus-visible:ring-ops-bamboo/40 dark:border-ops-border",
      "data-[state=checked]:border-ops-bamboo-strong data-[state=checked]:bg-ops-bamboo-strong data-[state=indeterminate]:border-ops-bamboo-strong data-[state=indeterminate]:bg-ops-bamboo-strong dark:text-ops-canvas"
    )}
    onCheckedChange={(value) => onCheckedChange(value === true)}
    onClick={(event) => event.stopPropagation()}
  >
    <CheckboxPrimitive.Indicator>
      {checked === "indeterminate" ? (
        <Minus className="size-[13px] stroke-3" />
      ) : (
        <Check className="size-[13px] stroke-3" />
      )}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
);
