"use client";

import { useState } from "react";

import { useJobOccurrences } from "@/components/ops/hooks/useJobOccurrences";
import { OccurrenceStatusBadge } from "@/components/ops/jobs/status-badges";
import { formatDate, formatTime, getMonthKey, getMonthRange } from "@/components/ops/utils";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const CalendarPage = () => {
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const monthRange = getMonthRange(month);
  const monthKey = getMonthKey(month);
  const { occurrences, isLoading } = useJobOccurrences(
    {
      startDate: monthRange.start,
      endDate: monthRange.end,
      includeArchived: false,
    },
    monthKey
  );

  const selectedDayKey = selectedDate?.toDateString();
  const highlightedDates = occurrences.map(
    (occurrence) => new Date(occurrence.scheduledStartAt)
  );
  const selectedDayOccurrences = occurrences.filter(
    (occurrence) =>
      new Date(occurrence.scheduledStartAt).toDateString() === selectedDayKey
  );

  return (
    <div className="container grid w-full gap-6 xl:grid-cols-[minmax(0,420px)_1fr]">
      <Card className="border-0 bg-white/80 shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Calendario operativo</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            month={month}
            onMonthChange={setMonth}
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={{ hasOccurrences: highlightedDates }}
            modifiersClassNames={{
              hasOccurrences: "bg-emerald-50 text-emerald-800 font-semibold",
            }}
            className="rounded-md border"
          />
        </CardContent>
      </Card>
      <Card className="border-0 bg-white/80 shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>
            Agenda del {selectedDate ? formatDate(selectedDate) : "día seleccionado"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="min-h-48 animate-pulse rounded-lg bg-muted/40" />
          ) : selectedDayOccurrences.length ? (
            selectedDayOccurrences.map((occurrence) => (
              <div key={occurrence.id} className="space-y-2 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{occurrence.job.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(occurrence.scheduledStartAt)} - {formatTime(occurrence.scheduledEndAt)}
                    </p>
                  </div>
                  <OccurrenceStatusBadge status={occurrence.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {occurrence.isDetached ? "Separada de regla" : "Ligada a regla"} ·{" "}
                  {occurrence.notes || "Sin notas"}
                </p>
              </div>
            ))
          ) : (
            <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              No hay ocurrencias para este día.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
