"use client";

import { useSyncExternalStore } from "react";

import { toDateInputValue } from "@/components/ops/utils";

const subscribeToNothing = () => () => undefined;

// The visitor's local day as YYYY-MM-DD. The server does not know it, and a
// day computed there can differ from the browser's in the evening, so the
// server render and the hydration pass read null until the browser answers.
export const useTodayKey = () =>
  useSyncExternalStore(
    subscribeToNothing,
    () => toDateInputValue(new Date()),
    () => null
  );
