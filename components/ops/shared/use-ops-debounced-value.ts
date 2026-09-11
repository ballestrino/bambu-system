"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Debounced value plus a `flush` callback that commits the pending value right
 * away (por ejemplo al presionar Enter en un buscador).
 */
export const useOpsFlushableDebouncedValue = <T,>(value: T, delayMs = 1500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [delayMs, value]);

  const flush = useCallback(() => {
    setDebouncedValue(value);
  }, [value]);

  return [debouncedValue, flush] as const;
};

export const useOpsDebouncedValue = <T,>(value: T, delayMs = 1500) =>
  useOpsFlushableDebouncedValue(value, delayMs)[0];
