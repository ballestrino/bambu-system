"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarRange, UsersRound } from "lucide-react";

import { getScheduleWeek, parseScheduleWeekParam } from "@/lib/ops/schedule-week";
import { useWeeklySchedule } from "@/components/ops/hooks/useWeeklySchedule";
import { ScheduleEmployeePanel } from "@/components/ops/schedules/schedule-employee-panel";
import { ScheduleTeamExportButton } from "@/components/ops/schedules/schedule-export-buttons";
import {
  ScheduleTeamGrid,
  ScheduleUnassignedNotice,
} from "@/components/ops/schedules/schedule-team-grid";
import { ScheduleTeamList } from "@/components/ops/schedules/schedule-team-list";
import { ScheduleWeekNav } from "@/components/ops/schedules/schedule-week-nav";
import {
  OpsEmptyState,
  OpsPageHeader,
  OpsPageShell,
  OpsRecordSkeleton,
} from "@/components/ops/shared";
import { Button } from "@/components/ui/button";

export const SchedulesPage = ({
  initialEmployeeId,
  initialWeek,
}: {
  initialEmployeeId?: string;
  initialWeek?: string;
}) => {
  const router = useRouter();
  // Normaliza al lunes: la URL puede traer un dia cualquiera de la semana o un
  // valor invalido, y parseScheduleWeekParam cae a hoy en ese caso.
  const [weekStart, setWeekStart] = useState(
    () => getScheduleWeek(parseScheduleWeekParam(initialWeek)).startKey
  );
  const [employeeId, setEmployeeId] = useState(initialEmployeeId ?? "");
  const { error, isLoading, refetch, schedule } = useWeeklySchedule(weekStart);

  // El estado vive en el componente y se espeja a la URL: useSearchParams
  // obligaria a envolver la pagina en Suspense.
  const syncUrl = (nextWeek: string, nextEmployeeId: string) => {
    const params = new URLSearchParams({ week: nextWeek });
    if (nextEmployeeId) {
      params.set("employeeId", nextEmployeeId);
    }
    router.replace(`/dashboard/schedules?${params.toString()}`, { scroll: false });
  };
  const changeWeek = (nextWeek: string) => {
    setWeekStart(nextWeek);
    syncUrl(nextWeek, employeeId);
  };
  const selectEmployee = (nextEmployeeId: string) => {
    setEmployeeId(nextEmployeeId);
    syncUrl(weekStart, nextEmployeeId);
  };

  const selected = schedule?.employees.find((employee) => employee.id === employeeId);

  return (
    <OpsPageShell>
      <OpsPageHeader
        actions={
          schedule ? <ScheduleTeamExportButton schedule={schedule} /> : null
        }
        description="Semana de lunes a domingo del equipo. Descargá el PDF con el logo Bambú para enviárselo a cada empleada."
        eyebrow="Operaciones"
        title="Cronogramas"
      />

      <ScheduleWeekNav
        onWeekChange={changeWeek}
        weekLabel={schedule?.weekLabel ?? "Cargando semana..."}
        weekStart={weekStart}
      />

      {isLoading ? <OpsRecordSkeleton /> : null}

      {error && !isLoading ? (
        <OpsEmptyState
          action={
            <Button onClick={() => refetch()} size="sm" type="button" variant="outline">
              Reintentar
            </Button>
          }
          description="No pudimos cargar el cronograma de esta semana."
          icon={CalendarRange}
          title="Error al cargar"
        />
      ) : null}

      {schedule && !isLoading && !error ? (
        selected ? (
          <ScheduleEmployeePanel
            employee={selected}
            onBack={() => selectEmployee("")}
            schedule={schedule}
          />
        ) : schedule.employees.length ? (
          <div className="space-y-3">
            <ScheduleUnassignedNotice schedule={schedule} />
            <ScheduleTeamGrid onSelectEmployee={selectEmployee} schedule={schedule} />
            <ScheduleTeamList onSelectEmployee={selectEmployee} schedule={schedule} />
          </div>
        ) : (
          <OpsEmptyState
            description="Activá empleadas en la sección Empleados para armar el cronograma."
            icon={UsersRound}
            title="No hay empleadas activas"
          />
        )
      ) : null}
    </OpsPageShell>
  );
};
