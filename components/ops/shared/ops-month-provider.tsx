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
      <div className="container mb-5 flex w-full justify-end">
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
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#53985E]/15 bg-white/80 px-3 py-2 shadow-sm shadow-[#244C2D]/5 dark:bg-[#1A211A] dark:ring-white/10">
      <CalendarDays className="h-4 w-4 text-[#53985E]" />
      <span className="min-w-32 text-sm font-medium capitalize">
        {formatMonth(month)}
      </span>
      <Button
        aria-label="Mes anterior"
        onClick={goToPreviousMonth}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Input
        aria-label="Mes operativo"
        className="h-8 w-36"
        onChange={(event) => {
          const nextMonth = parseMonthKey(event.target.value);
          if (nextMonth) setMonth(nextMonth);
        }}
        type="month"
        value={monthKey}
      />
      <Button
        aria-label="Mes siguiente"
        onClick={goToNextMonth}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        aria-label="Volver al mes actual"
        onClick={resetToCurrentMonth}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
};
