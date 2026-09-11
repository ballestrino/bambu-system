"use client";

import { useState } from "react";
import { CalendarOff } from "lucide-react";

import { useEmployeeAvailability } from "@/components/ops/hooks/useEmployeeAvailability";
import { useEmployeeAvailabilityMutations } from "@/components/ops/hooks/useEmployeeAvailabilityMutations";
import { ScheduleAvailabilityForm } from "@/components/ops/schedules/schedule-availability-form";
import { ScheduleAvailabilityRules } from "@/components/ops/schedules/schedule-availability-rules";
import { SchedulePanelDialog } from "@/components/ops/schedules/schedule-panel-dialog";
import { OpsFormField, opsFilterControlClass } from "@/components/ops/shared";
import { SearchableSelect } from "@/components/ui/searchable-select";

export const ScheduleAvailabilityDialog = ({
  employeeOptions,
  onOpenChange,
  open,
}: {
  employeeOptions: { id: string; name: string }[];
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const { isLoading, rules } = useEmployeeAvailability();
  const { createRuleAsync, deleteRuleAsync, isCreating, isDeleting } =
    useEmployeeAvailabilityMutations();
  const employeeId = employeeOptions.some((employee) => employee.id === selectedEmployeeId)
    ? selectedEmployeeId
    : employeeOptions[0]?.id ?? "";
  const employeeRules = rules.filter((rule) => rule.employeeId === employeeId);

  return (
    <SchedulePanelDialog
      description="Los horarios que la empleada no puede tomar quedan fuera de los huecos libres y avisan cuando una visita cae ahí."
      eyebrow="Cronograma"
      icon={CalendarOff}
      onOpenChange={onOpenChange}
      open={open}
      title="Disponibilidad del equipo"
    >
      <div className="space-y-4">
        <OpsFormField label="Empleada">
          <SearchableSelect
            aria-label="Elegir empleada"
            className={opsFilterControlClass}
            onValueChange={setSelectedEmployeeId}
            options={employeeOptions.map((employee) => ({
              label: employee.name,
              value: employee.id,
            }))}
            placeholder="Elegí una empleada"
            searchPlaceholder="Buscar empleada..."
            value={employeeId}
          />
        </OpsFormField>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando disponibilidad...</p>
        ) : (
          <ScheduleAvailabilityRules
            isDeleting={isDeleting}
            onDelete={(ruleId) => {
              void deleteRuleAsync(ruleId).catch(() => undefined);
            }}
            rules={employeeRules}
          />
        )}

        <ScheduleAvailabilityForm
          employeeId={employeeId}
          isPending={isCreating}
          onSubmit={async (values) => {
            await createRuleAsync(values).catch(() => undefined);
          }}
        />
      </div>
    </SchedulePanelDialog>
  );
};
