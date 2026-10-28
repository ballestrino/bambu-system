"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { OpsMonthPicker } from "@/components/ops/shared/ops-month-picker";
import { getMonthKey, getMonthRange } from "@/components/ops/utils";

const STORAGE_KEY = "bambu.ops.selectedMonth";
const STORAGE_EVENT = "bambu-ops-selected-month-change";
// Lugar a la izquierda del selector de mes, para `OpsBackButton`.
export const OPS_MONTH_BAR_START_ID = "ops-month-bar-start";

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
      <div className="container mb-5 flex w-full items-center gap-2 print:hidden">
        <div className="flex empty:hidden" id={OPS_MONTH_BAR_START_ID} />
        <div className="flex min-w-0 flex-1 sm:flex-none md:ml-auto">
          <OpsSelectedMonthSelector />
        </div>
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
  const { goToNextMonth, goToPreviousMonth, month, resetToCurrentMonth, setMonth } =
    useOpsSelectedMonth();

  return (
    <OpsMonthPicker
      month={month}
      onChange={setMonth}
      onNext={goToNextMonth}
      onPrevious={goToPreviousMonth}
      onReset={resetToCurrentMonth}
    />
  );
};
