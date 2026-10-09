"use client";

import { useState } from "react";

import { getDayKeyMonth, getDefaultDayKey } from "@/lib/ops/visit-calendar";
import {
  DEFAULT_CALENDAR_FILTERS,
  type CalendarFilters,
} from "@/components/ops/calendar/calendar-filter-utils";
import { useTodayKey } from "@/components/ops/hooks/useTodayKey";
import { useOpsPersistedState, useOpsSelectedMonth } from "@/components/ops/shared";

export type VisitsView = "agenda" | "dia" | "cron";
export type VisitPanel = "asignar" | "detalle" | "registrar";
export type VisitSelection = { id: string; panel: VisitPanel };

// Las vistas guardadas antes del rediseño siguen abriendo algo razonable.
const VIEW_ALIASES: Record<string, VisitsView> = {
  agenda: "agenda",
  calendar: "agenda",
  cards: "agenda",
  cron: "cron",
  dia: "dia",
  list: "agenda",
  schedule: "cron",
};

export const toVisitsView = (value: unknown): VisitsView =>
  VIEW_ALIASES[String(value)] ?? "agenda";

const defaultViewState = { view: "agenda" as string };

// Estado de la pantalla: vista, dia elegido dentro del mes global, visita
// abierta y filtros. El dia cruza de mes moviendo el selector global.
export const useVisitsDesk = () => {
  const { month, setMonth } = useOpsSelectedMonth();
  const todayKey = useTodayKey();
  const [viewState, setViewState] = useOpsPersistedState(
    "bambu:ops:visits:view",
    defaultViewState
  );
  const [pickedDay, setPickedDay] = useState<string | null>(null);
  const [selection, setSelection] = useState<VisitSelection | null>(null);
  const [filters, setFilters] = useState<CalendarFilters>(DEFAULT_CALENDAR_FILTERS);

  const year = month.getFullYear();
  const monthNumber = month.getMonth() + 1;
  const pickedMonth = pickedDay ? getDayKeyMonth(pickedDay) : null;
  const dayKey =
    pickedDay && pickedMonth?.year === year && pickedMonth.month === monthNumber
      ? pickedDay
      : getDefaultDayKey(year, monthNumber, todayKey);

  const goToDay = (nextDayKey: string) => {
    const next = getDayKeyMonth(nextDayKey);
    if (next.year !== year || next.month !== monthNumber) {
      setMonth(new Date(next.year, next.month - 1, 1));
    }
    setPickedDay(nextDayKey);
    setSelection(null);
  };

  return {
    clearFilters: () => setFilters(DEFAULT_CALENDAR_FILTERS),
    dayKey,
    filters,
    goToDay,
    goToToday: () => {
      if (todayKey) goToDay(todayKey);
    },
    month: { month: monthNumber, year },
    open: (id: string, panel: VisitPanel = "detalle") => setSelection({ id, panel }),
    close: () => setSelection(null),
    selection,
    setView: (view: VisitsView) => {
      setViewState({ view });
      setSelection(null);
    },
    todayKey,
    updateFilters: (changes: Partial<CalendarFilters>) =>
      setFilters((current) => ({ ...current, ...changes })),
    view: toVisitsView(viewState.view),
  };
};

export type VisitsDesk = ReturnType<typeof useVisitsDesk>;
