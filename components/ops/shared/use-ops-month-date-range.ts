"use client";

import { useEffect, useState } from "react";

import { useOpsSelectedMonth } from "@/components/ops/shared/ops-month-provider";
import { getMonthRange, toDateInputValue } from "@/components/ops/utils";

type CustomRange = { endDate: string; monthKey: string; startDate: string };

const dateInputPattern = /^\d{4}-\d{2}-\d{2}$/;

const toLinkedRange = (start?: string, end?: string): CustomRange | null =>
  start && end && dateInputPattern.test(start) && dateInputPattern.test(end)
    ? { endDate: end, monthKey: start.slice(0, 7), startDate: start }
    : null;

// Desde/hasta que siguen al mes global: un rango editado a mano vale solo
// mientras el mes global sea ese. Un rango que llega por link (liquidación
// de sueldos) lleva el mes global al de su inicio.
export const useOpsMonthDateRange = (linked?: { end?: string; start?: string }) => {
  const { month, monthKey, setMonth } = useOpsSelectedMonth();
  const [custom, setCustom] = useState(() => toLinkedRange(linked?.start, linked?.end));
  const [linkedMonthKey] = useState(() => custom?.monthKey);

  useEffect(() => {
    if (!linkedMonthKey) return;
    const [year, monthNumber] = linkedMonthKey.split("-").map(Number);
    setMonth(new Date(year, monthNumber - 1, 1));
  }, [linkedMonthKey, setMonth]);

  const active = custom?.monthKey === monthKey ? custom : null;
  const monthRange = getMonthRange(month);

  return {
    endDate: active?.endDate ?? toDateInputValue(monthRange.end),
    isCustom: Boolean(active),
    setRange: (startDate: string, endDate: string) =>
      setCustom({ endDate, monthKey, startDate }),
    startDate: active?.startDate ?? toDateInputValue(monthRange.start),
  };
};
