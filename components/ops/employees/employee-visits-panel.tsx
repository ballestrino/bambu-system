"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BadgeDollarSign, CalendarDays, CheckCircle2, Clock3, TimerReset, XCircle } from "lucide-react";

import { dashboardSecondaryActionClass } from "@/components/dashboard/dashboard-styles";
import {
  formatHours,
  formatMoney,
  getEstimatedPay,
  getWorkedHours,
  realTimingMatches,
  summarizeEmployeeVisits,
} from "@/components/ops/employees/employee-payroll";
import { useJobOccurrences } from "@/components/ops/hooks/useJobOccurrences";
import { getOccurrenceEmployeesLabel } from "@/components/ops/jobs/occurrence-employees";
import { OccurrenceStatusBadge } from "@/components/ops/jobs/status-badges";
import {
  OpsDateFilterInput,
  OpsDetailInset,
  OpsDetailRow,
  OpsFilterField,
  OpsMetricsGrid,
  OpsSection, getOpsStatusConfig,
  opsFilterControlClass,
  opsOccurrenceStatus,
} from "@/components/ops/shared";
import type { OpsOccurrence } from "@/components/ops/types";
import { formatDate, formatTime, getMonthRange, toDateInputValue } from "@/components/ops/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { occurrenceStatusValues } from "@/schemas/ops";

export const EmployeeVisitsPanel = ({
  employeeId,
  hourlyRate,
}: {
  employeeId: string;
  hourlyRate?: unknown;
}) => {
  const currentMonth = getMonthRange(new Date());
  const [startDate, setStartDate] = useState(toDateInputValue(currentMonth.start));
  const [endDate, setEndDate] = useState(toDateInputValue(currentMonth.end));
  const [status, setStatus] = useState("ALL");
  const [jobId, setJobId] = useState("ALL");
  const [realTiming, setRealTiming] = useState("ALL");

  const { occurrences, isLoading } = useJobOccurrences({
    employeeId,
    startDate: startDate ? new Date(`${startDate}T00:00:00`) : undefined,
    endDate: endDate ? new Date(`${endDate}T23:59:59`) : undefined,
    statuses: status === "ALL" ? undefined : [status as OpsOccurrence["status"]],
    includeArchived: false,
  }, `employee-visits-${employeeId}-${startDate}-${endDate}-${status}`);

  const jobOptions = useMemo(
    () =>
      Array.from(
        new Map(occurrences.map((occurrence) => [occurrence.jobId, occurrence.job])).values()
      ),
    [occurrences]
  );

  const filteredOccurrences = occurrences.filter(
    (occurrence) =>
      (jobId === "ALL" || occurrence.jobId === jobId) &&
      realTimingMatches(occurrence, realTiming)
  );

  const stats = summarizeEmployeeVisits(filteredOccurrences);
  const estimatedPay = getEstimatedPay(stats.hours, hourlyRate);

  return (
    <OpsSection
      className="bg-white dark:bg-background/95"
      description="Filtra las visitas realizadas para revisar horas reales y estimar el pago del periodo."
      title="Visitas y horas para pago"
    >
      <div className="space-y-5">
        <OpsDetailInset className="grid gap-3 xl:grid-cols-5">
          <OpsFilterField label="Desde"><OpsDateFilterInput value={startDate} onChange={(event) => setStartDate(event.target.value)} /></OpsFilterField>
          <OpsFilterField label="Hasta"><OpsDateFilterInput value={endDate} onChange={(event) => setEndDate(event.target.value)} /></OpsFilterField>
          <OpsFilterField label="Estado">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className={opsFilterControlClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                {occurrenceStatusValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {getOpsStatusConfig(opsOccurrenceStatus, value).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </OpsFilterField>
          <OpsFilterField label="Trabajo">
            <Select value={jobId} onValueChange={setJobId}>
              <SelectTrigger className={opsFilterControlClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                {jobOptions.map((job) => <SelectItem key={job.id} value={job.id}>{job.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </OpsFilterField>
          <OpsFilterField label="Horario real">
            <Select value={realTiming} onValueChange={setRealTiming}>
              <SelectTrigger className={opsFilterControlClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="WITH_REAL">Con horario</SelectItem>
                <SelectItem value="WITHOUT_REAL">Sin horario</SelectItem>
              </SelectContent>
            </Select>
          </OpsFilterField>
        </OpsDetailInset>

        <OpsMetricsGrid
          className="grid-cols-2 xl:grid-cols-3"
          metrics={[
            { className: "border-black/5 bg-white dark:bg-background/80", helper: "real acumulado", icon: Clock3, label: "Horas", size: "compact", tone: "active", value: formatHours(stats.hours) },
            { className: "border-black/5 bg-white dark:bg-background/80", helper: "ocurrencias visibles", icon: CalendarDays, label: "Visitas", size: "compact", tone: "neutral", value: stats.total },
            { className: "border-black/5 bg-white dark:bg-background/80", helper: "quedaron realizadas", icon: CheckCircle2, label: "Completadas", size: "compact", tone: "success", value: stats.done },
            { className: "border-black/5 bg-white dark:bg-background/80", helper: "aun pendientes", icon: TimerReset, label: "Pendientes", size: "compact", tone: "warning", value: stats.pending },
            { className: "border-black/5 bg-white dark:bg-background/80", helper: "no ejecutadas", icon: XCircle, label: "Canceladas", size: "compact", tone: "danger", value: stats.canceled },
            {
              className: "border-black/5 bg-white dark:bg-background/80",
              helper: estimatedPay === null ? "falta tarifa horaria" : "estimado del periodo",
              icon: BadgeDollarSign,
              label: "Pago",
              size: "compact",
              tone: estimatedPay === null ? "archived" : "money",
              value: estimatedPay === null ? "Sin tarifa" : formatMoney(estimatedPay),
            },
          ]}
        />

        <div className="space-y-3">
          {isLoading ? (
            <div className="min-h-40 animate-pulse rounded-2xl bg-muted/40" />
          ) : filteredOccurrences.length ? (
            filteredOccurrences.map((occurrence) => (
              <OpsDetailRow key={occurrence.id} className="border-black/5 bg-white dark:bg-background/80" actions={<Button asChild size="sm" variant="outline" className={dashboardSecondaryActionClass}><Link href={`/dashboard/jobs/${occurrence.jobId}`}>Trabajo</Link></Button>}>
                <div className="grid gap-4 text-center md:grid-cols-2 xl:grid-cols-[1.15fr_1fr_1fr_1fr] xl:text-left">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Fecha</p>
                    <p className="font-semibold">{formatDate(occurrence.scheduledStartAt)}</p>
                    <p className="text-sm text-muted-foreground">{occurrence.job.name}</p>
                  </div>
                  <div className="space-y-1 xl:border-l xl:border-black/5 xl:pl-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Plan</p>
                    <p className="font-semibold">
                      {formatTime(occurrence.scheduledStartAt)} - {formatTime(occurrence.scheduledEndAt)}
                    </p>
                    <p className="text-sm text-muted-foreground">agenda base</p>
                  </div>
                  <div className="space-y-1 xl:border-l xl:border-black/5 xl:pl-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Real</p>
                    <p className="font-semibold">
                      {formatTime(occurrence.actualStartAt)} - {formatTime(occurrence.actualEndAt)}
                    </p>
                    <p className="text-sm text-muted-foreground">{getOccurrenceEmployeesLabel(occurrence)}</p>
                  </div>
                  <div className="space-y-2 xl:border-l xl:border-black/5 xl:pl-4">
                    <div className="flex justify-center xl:justify-start">
                      <OccurrenceStatusBadge status={occurrence.status} />
                    </div>
                    <p className="font-semibold">{formatHours(getWorkedHours(occurrence))} hs</p>
                    <p className="text-sm text-muted-foreground">{occurrence.notes || "Sin notas"}</p>
                  </div>
                </div>
              </OpsDetailRow>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-black/10 bg-white p-5 text-sm text-muted-foreground dark:bg-background/80">
              No hay visitas para estos filtros.
            </p>
          )}
        </div>
        {estimatedPay === null ? (
          <p className="text-xs text-muted-foreground">
            El pago estimado queda pendiente hasta configurar una tarifa por empleada.
          </p>
        ) : null}
      </div>
    </OpsSection>
  );
};
