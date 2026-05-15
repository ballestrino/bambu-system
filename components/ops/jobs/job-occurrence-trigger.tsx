import { forwardRef, type ComponentProps } from "react";
import { Pencil, Plus } from "lucide-react";

import {
  dashboardPrimaryActionClass,
  dashboardSecondaryActionClass,
} from "@/components/dashboard/dashboard-styles";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type JobOccurrenceTriggerProps = ComponentProps<typeof Button> & {
  isEditing: boolean;
  triggerClassName?: string;
  triggerLabel?: string;
  triggerVariant?: ComponentProps<typeof Button>["variant"];
};

export const JobOccurrenceTrigger = forwardRef<
  HTMLButtonElement,
  JobOccurrenceTriggerProps
>(
  (
    {
      className,
      isEditing,
      size = "sm",
      triggerClassName,
      triggerLabel,
      triggerVariant,
      variant,
      ...props
    },
    ref
  ) => {
    const Icon = isEditing ? Pencil : Plus;
    const fallbackClassName = isEditing
      ? dashboardSecondaryActionClass
      : dashboardPrimaryActionClass;

    return (
      <Button
        ref={ref}
        size={size}
        variant={triggerVariant ?? variant ?? (isEditing ? "outline" : "default")}
        className={cn(triggerClassName ?? fallbackClassName, className)}
        {...props}
      >
        <Icon className="h-4 w-4" />
        {triggerLabel ?? (isEditing ? "Editar" : "Nueva visita")}
      </Button>
    );
  }
);

JobOccurrenceTrigger.displayName = "JobOccurrenceTrigger";
