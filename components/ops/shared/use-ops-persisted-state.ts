"use client";

import { useEffect, useState } from "react";

export const useOpsPersistedState = <T extends Record<string, unknown>>(
  key: string,
  defaultValue: T
) => {
  const [value, setValue] = useState(defaultValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(key);

      if (storedValue) {
        setValue({ ...defaultValue, ...JSON.parse(storedValue) });
      }
    } catch {
      setValue(defaultValue);
    } finally {
      setHydrated(true);
    }
  }, [defaultValue, key]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(value));
  }, [hydrated, key, value]);

  return [value, setValue] as const;
};
