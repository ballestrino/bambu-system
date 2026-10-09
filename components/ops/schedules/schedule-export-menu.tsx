"use client";

import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import type { WeeklySchedule } from "@/lib/ops/schedule-types";
import {
  downloadEmployeeSchedulePdf,
  downloadTeamSchedulePdf,
} from "@/components/ops/schedules/schedule-downloads";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { scheduleToolButton } from "@/components/ops/schedules/schedule-tool-button";

// "Exportar" del cronograma: el PDF del equipo y el de cada empleada.
export const ScheduleExportMenu = ({
  schedule,
  visibleWeekdays,
}: {
  schedule: WeeklySchedule;
  visibleWeekdays: number[];
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const run = async (task: () => Promise<void>, done: string, failed: string) => {
    setIsExporting(true);
    try {
      await task();
      toast.success(done);
    } catch {
      toast.error(failed);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={scheduleToolButton} disabled={isExporting || !schedule.employees.length} type="button">
          {isExporting ? <LoaderCircle className="size-[15px] animate-spin" /> : <Download className="size-[15px]" />}
          {isExporting ? "Generando..." : "Exportar"}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 w-64 overflow-y-auto">
        <DropdownMenuItem
          onSelect={() =>
            void run(
              () => downloadTeamSchedulePdf(schedule, visibleWeekdays),
              "Cronogramas del equipo descargados",
              "No pudimos generar los cronogramas del equipo"
            )
          }
        >
          PDF del equipo
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-ops-text-muted">Por empleada</DropdownMenuLabel>
        {schedule.employees.map((employee) => (
          <DropdownMenuItem
            key={employee.id}
            onSelect={() =>
              void run(
                () => downloadEmployeeSchedulePdf(employee, schedule, visibleWeekdays),
                `Cronograma de ${employee.name} descargado`,
                "No pudimos generar el cronograma en PDF"
              )
            }
          >
            {employee.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
