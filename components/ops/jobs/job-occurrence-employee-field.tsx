"use client";

import { UsersRound } from "lucide-react";

import type { JobOccurrenceEmployeeOption } from "@/components/ops/jobs/job-occurrence-dialog-utils";
import { OpsFormField, opsFormPanelClass } from "@/components/ops/shared";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export const JobOccurrenceEmployeeField = ({
  employees,
  onChange,
  selectedEmployeeIds,
}: {
  employees: JobOccurrenceEmployeeOption[];
  onChange: (employeeIds: string[]) => void;
  selectedEmployeeIds: string[];
}) => {
  const selectedIds = new Set(selectedEmployeeIds);

  const toggleEmployee = (employeeId: string, checked: boolean) => {
    onChange(
      checked
        ? [...selectedEmployeeIds, employeeId]
        : selectedEmployeeIds.filter((id) => id !== employeeId)
    );
  };

  return (
    <OpsFormField
      description="Las empleadas archivadas o inactivas solo aparecen si ya estaban asignadas y pueden quitarse."
      label="Equipo"
    >
      <div className={cn(opsFormPanelClass, "space-y-3")}>
        {employees.length ? (
          employees.map((employee) => (
            <label
              key={employee.id}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 text-sm text-[#244C2D] transition-colors hover:bg-white dark:text-[#F0F3E8] dark:hover:bg-[#242D23]"
            >
              <Checkbox
                checked={selectedIds.has(employee.id)}
                onCheckedChange={(checked) =>
                  toggleEmployee(employee.id, checked === true)
                }
              />
              <span className="min-w-0 flex-1 truncate font-medium">
                {employee.name}
              </span>
              {employee.archivedAt ? (
                <Badge variant="outline" className="shrink-0 text-muted-foreground">
                  Archivada
                </Badge>
              ) : !employee.isActive ? (
                <Badge variant="outline" className="shrink-0 text-muted-foreground">
                  Inactiva
                </Badge>
              ) : null}
            </label>
          ))
        ) : (
          <div className="flex min-h-11 items-center gap-2 text-sm text-muted-foreground">
            <UsersRound className="h-4 w-4" />
            No hay empleadas activas.
          </div>
        )}
      </div>
    </OpsFormField>
  );
};
