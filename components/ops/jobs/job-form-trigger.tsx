import type { ComponentProps } from "react";
import { Pencil, Plus } from "lucide-react";

import {
  dashboardPrimaryActionClass,
  dashboardSecondaryActionClass,
} from "@/components/dashboard/dashboard-styles";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type JobFormTriggerProps = {
  isEditing?: boolean;
  triggerClassName?: string;
  triggerLabel?: string;
  triggerVariant?: ComponentProps<typeof Button>["variant"];
} & Omit<
  ComponentProps<typeof Button>,
  "children" | "className" | "size" | "variant"
>;

export const JobFormTrigger = ({
  isEditing = false,
  triggerClassName,
  triggerLabel,
  triggerVariant,
  ...buttonProps
}: JobFormTriggerProps) => {
  const Icon = isEditing ? Pencil : Plus;
  const useSecondaryStyle = isEditing || triggerVariant === "outline";

  return (
    <Button
      {...buttonProps}
      className={cn(
        useSecondaryStyle
          ? dashboardSecondaryActionClass
          : dashboardPrimaryActionClass,
        triggerClassName
      )}
      size={isEditing ? "sm" : "default"}
      variant={triggerVariant ?? (isEditing ? "outline" : "default")}
    >
      <Icon className="h-4 w-4" />
      {triggerLabel ?? (isEditing ? "Editar" : "Nuevo trabajo")}
    </Button>
  );
};
