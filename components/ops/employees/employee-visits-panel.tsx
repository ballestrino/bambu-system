"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { useJobOccurrences } from "@/components/ops/hooks/useJobOccurrences";
import { OccurrenceStatusBadge } from "@/components/ops/jobs/status-badges";
import type { OpsOccurrence } from "@/components/ops/types";
import { formatDate, formatTime, getMonthRange, toDateInputValue } from "@/components/ops/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { occurrenceStatusValues } from "@/schemas/ops";

const getWorkedHours = (occurrence: OpsOccurrence) => {
  if (occurrence.status !== "DONE" || !occurrence.actualStartAt || !occurrence.actualEndAt) {
    return 0;
  }

  return Math.max(
    0,
    (new Date(occurrence.actualEndAt).getTime() -
      new Date(occurrence.actualStartAt).getTime()) /
      3600000
  );
};

const formatHours = (hours: number) =>
  new Intl.NumberFormat("es-UY", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(hours);

const realTimingMatches = (occurrence: OpsOccurrence, filter: string) => {
  const hasRealTiming = Boolean(occurrence.actualStartAt && occurrence.actualEndAt);

  if (filter === "WITH_REAL") {
    return hasRealTiming;
  }

  if (filter === "WITHOUT_REAL") {
    return !hasRealTiming;
  }

  return true;
};

export const EmployeeVisitsPanel = ({ employeeId }: { employeeId: string }) => {
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

  const stats = filteredOccurrences.reduce(
    (acc, occurrence) => {
      acc.hours += getWorkedHours(occurrence);
      acc.total += 1;
      acc.done += occurrence.status === "DONE" ? 1 : 0;
      acc.canceled += occurrence.status === "CANCELED" ? 1 : 0;
      acc.pending += occurrence.status === "SCHEDULED" ? 1 : 0;
      return acc;
    },
    { hours: 0, total: 0, done: 0, canceled: 0, pending: 0 }
  );

  return (
    <Card className="border-0 bg-white/80 shadow-sm ring-1 ring-black/5">
      <CardHeader>
        <CardTitle>Visitas y horas para pago</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-5">
          <div className="space-y-2">
            <Label>Desde</Label>
            <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Hasta</Label>
            <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                {occurrenceStatusValues.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Trabajo</Label>
            <Select value={jobId} onValueChange={setJobId}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                {jobOptions.map((job) => <SelectItem key={job.id} value={job.id}>{job.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Horario real</Label>
            <Select value={realTiming} onValueChange={setRealTiming}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="WITH_REAL">Con horario</SelectItem>
                <SelectItem value="WITHOUT_REAL">Sin horario</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          <Badge variant="outline">Horas: {formatHours(stats.hours)}</Badge>
          <Badge variant="outline">Visitas: {stats.total}</Badge>
          <Badge variant="outline">Completadas: {stats.done}</Badge>
          <Badge variant="outline">Pendientes: {stats.pending}</Badge>
          <Badge variant="outline">Canceladas: {stats.canceled}</Badge>
        </div>
        <div className="rounded-lg border">
          {isLoading ? (
            <div className="min-h-40 animate-pulse rounded-lg bg-muted/40" />
          ) : filteredOccurrences.length ? (
            filteredOccurrences.map((occurrence) => (
              <div key={occurrence.id} className="grid gap-3 border-b p-4 last:border-b-0 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
                <div>
                  <p className="font-medium">{formatDate(occurrence.scheduledStartAt)}</p>
                  <p className="text-sm text-muted-foreground">{occurrence.job.name}</p>
                </div>
                <p className="text-sm">Plan {formatTime(occurrence.scheduledStartAt)} - {formatTime(occurrence.scheduledEndAt)}</p>
                <p className="text-sm">Real {formatTime(occurrence.actualStartAt)} - {formatTime(occurrence.actualEndAt)}</p>
                <div className="space-y-1 text-sm">
                  <OccurrenceStatusBadge status={occurrence.status} />
                  <p>{formatHours(getWorkedHours(occurrence))} hs</p>
                  <p className="text-muted-foreground">{occurrence.notes || "Sin notas"}</p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/dashboard/jobs/${occurrence.jobId}`}>Trabajo</Link>
                </Button>
              </div>
            ))
          ) : (
            <p className="p-4 text-sm text-muted-foreground">No hay visitas para estos filtros.</p>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          El pago estimado queda pendiente hasta configurar una tarifa por empleada.
        </p>
      </CardContent>
    </Card>
  );
};
