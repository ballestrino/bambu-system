import type { ComponentProps } from "react";
import { Pencil, Plus } from "lucide-react";

import {
  dashboardPrimaryActionClass,
  dashboardSecondaryActionClass,
} from "@/components/dashboard/dashboard-styles";
import { Button } from "@/components/ui/button";

export const JobOccurrenceTrigger = ({
  isEditing,
  triggerClassName,
  triggerLabel,
  triggerVariant,
}: {
  isEditing: boolean;
  triggerClassName?: string;
  triggerLabel?: string;
  triggerVariant?: ComponentProps<typeof Button>["variant"];
}) => {
  const Icon = isEditing ? Pencil : Plus;

  return (
    <Button
      size="sm"
      variant={triggerVariant ?? (isEditing ? "outline" : "default")}
      className={
        triggerClassName ??
        (isEditing ? dashboardSecondaryActionClass : dashboardPrimaryActionClass)
      }
    >
      <Icon className="h-4 w-4" />
      {triggerLabel ?? (isEditing ? "Editar" : "Nueva visita")}
    </Button>
  );
};
