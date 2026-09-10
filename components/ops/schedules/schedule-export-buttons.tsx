"use client";

import { useState } from "react";
import { FileDown, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import type { ScheduleEmployee, WeeklySchedule } from "@/lib/ops/schedule-types";
import {
  downloadEmployeeSchedulePdf,
  downloadTeamSchedulePdf,
} from "@/components/ops/schedules/schedule-downloads";
import { Button } from "@/components/ui/button";

const useScheduleExport = (run: () => Promise<void>, errorMessage: string) => {
  const [isExporting, setIsExporting] = useState(false);

  const start = async () => {
    setIsExporting(true);
    try {
      await run();
    } catch {
      toast.error(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  return { isExporting, start };
};

export const ScheduleEmployeeExportButton = ({
  employee,
  schedule,
}: {
  employee: ScheduleEmployee;
  schedule: WeeklySchedule;
}) => {
  const { isExporting, start } = useScheduleExport(async () => {
    await downloadEmployeeSchedulePdf(employee, schedule);
    toast.success(`Cronograma de ${employee.name} descargado`);
  }, "No pudimos generar el cronograma en PDF");

  return (
    <Button disabled={isExporting} onClick={start} size="sm" type="button" variant="outline">
      {isExporting ? <LoaderCircle className="animate-spin" /> : <FileDown />}
      {isExporting ? "Generando..." : "Descargar PDF"}
    </Button>
  );
};

export const ScheduleTeamExportButton = ({ schedule }: { schedule: WeeklySchedule }) => {
  const { isExporting, start } = useScheduleExport(async () => {
    await downloadTeamSchedulePdf(schedule);
    toast.success("Cronogramas del equipo descargados");
  }, "No pudimos generar los cronogramas del equipo");

  return (
    <Button
      disabled={isExporting || !schedule.employees.length}
      onClick={start}
      size="sm"
      type="button"
      variant="outline"
    >
      {isExporting ? <LoaderCircle className="animate-spin" /> : <FileDown />}
      {isExporting ? "Generando..." : "PDF del equipo"}
    </Button>
  );
};
