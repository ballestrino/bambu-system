"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { CalendarDays, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMonth, getMonthKey, getMonthRange } from "@/components/ops/utils";

const STORAGE_KEY = "bambu.ops.selectedMonth";
const STORAGE_EVENT = "bambu-ops-selected-month-change";

type OpsSelectedMonthContextValue = {
  goToNextMonth: () => void;
  goToPreviousMonth: () => void;
  month: Date;
  monthKey: string;
  monthRange: ReturnType<typeof getMonthRange>;
  resetToCurrentMonth: () => void;
  setMonth: (month: Date) => void;
};

const OpsSelectedMonthContext =
  createContext<OpsSelectedMonthContextValue | null>(null);

const normalizeMonth = (month: Date) =>
  new Date(month.getFullYear(), month.getMonth(), 1);

const parseMonthKey = (value: string | null) => {
  if (!value) return null;

  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const [, year, month] = match;
  const date = new Date(Number(year), Number(month) - 1, 1);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getDefaultMonthKey = () => getMonthKey(normalizeMonth(new Date()));

const getStoredMonthKey = () => {
  if (typeof window === "undefined") {
    return getDefaultMonthKey();
  }

  const value = window.localStorage.getItem(STORAGE_KEY);
  return parseMonthKey(value) ? value ?? getDefaultMonthKey() : getDefaultMonthKey();
};

const subscribeToMonthChanges = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener(STORAGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(STORAGE_EVENT, callback);
  };
};

const persistMonthKey = (monthKey: string) => {
  window.localStorage.setItem(STORAGE_KEY, monthKey);
  window.dispatchEvent(new Event(STORAGE_EVENT));
};

export const OpsSelectedMonthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const storedMonthKey = useSyncExternalStore(
    subscribeToMonthChanges,
    getStoredMonthKey,
    getDefaultMonthKey
  );
  const month = parseMonthKey(storedMonthKey) ?? normalizeMonth(new Date());

  const setMonth = useCallback((nextMonth: Date) => {
    persistMonthKey(getMonthKey(normalizeMonth(nextMonth)));
  }, []);

  const goToPreviousMonth = useCallback(() => {
    persistMonthKey(
      getMonthKey(new Date(month.getFullYear(), month.getMonth() - 1, 1))
    );
  }, [month]);

  const goToNextMonth = useCallback(() => {
    persistMonthKey(
      getMonthKey(new Date(month.getFullYear(), month.getMonth() + 1, 1))
    );
  }, [month]);

  const resetToCurrentMonth = useCallback(() => {
    persistMonthKey(getDefaultMonthKey());
  }, []);

  const value = useMemo(
    () => ({
      goToNextMonth,
      goToPreviousMonth,
      month,
      monthKey: getMonthKey(month),
      monthRange: getMonthRange(month),
      resetToCurrentMonth,
      setMonth,
    }),
    [goToNextMonth, goToPreviousMonth, month, resetToCurrentMonth, setMonth]
  );

  return (
    <OpsSelectedMonthContext.Provider value={value}>
      <div className="container mb-5 flex w-full md:justify-end">
        <OpsSelectedMonthSelector />
      </div>
      {children}
    </OpsSelectedMonthContext.Provider>
  );
};

export const useOpsSelectedMonth = () => {
  const value = useContext(OpsSelectedMonthContext);

  if (!value) {
    throw new Error("useOpsSelectedMonth must be used inside OpsSelectedMonthProvider");
  }

  return value;
};

export const OpsSelectedMonthSelector = () => {
  const {
    goToNextMonth,
    goToPreviousMonth,
    month,
    monthKey,
    resetToCurrentMonth,
    setMonth,
  } = useOpsSelectedMonth();

  return (
    <div className="flex w-full min-w-0 flex-nowrap items-center gap-1 rounded-[var(--ops-radius-row)] bg-ops-surface-muted px-2 py-2 sm:w-auto sm:gap-2 sm:px-3">
      <CalendarDays className="hidden h-4 w-4 text-ops-bamboo sm:block" />
      <span className="hidden min-w-32 text-sm font-medium capitalize sm:inline">
        {formatMonth(month)}
      </span>
      <Button
        aria-label="Mes anterior"
        className="size-11 sm:size-10"
        onClick={goToPreviousMonth}
        size="icon-lg"
        type="button"
        variant="ghost"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Input
        aria-label="Mes operativo"
        className="h-11 min-w-0 flex-1 rounded-[var(--ops-radius-control)] border-ops-border bg-ops-surface shadow-none sm:w-36 sm:flex-none"
        onChange={(event) => {
          const nextMonth = parseMonthKey(event.target.value);
          if (nextMonth) setMonth(nextMonth);
        }}
        type="month"
        value={monthKey}
      />
      <Button
        aria-label="Mes siguiente"
        className="size-11 sm:size-10"
        onClick={goToNextMonth}
        size="icon-lg"
        type="button"
        variant="ghost"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        aria-label="Volver al mes actual"
        className="size-11 sm:size-10"
        onClick={resetToCurrentMonth}
        size="icon-lg"
        type="button"
        variant="ghost"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
};
