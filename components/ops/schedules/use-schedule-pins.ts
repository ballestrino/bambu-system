"use client";

import { useOpsPersistedState } from "@/components/ops/shared";

const defaultPinState = { compare: false, pins: [] as string[] };

// Hasta dos empleadas fijadas para comparar su semana. Con la comparacion
// activa sus filas suben al principio del cronograma.
export const useSchedulePins = () => {
  const [state, setState] = useOpsPersistedState("bambu:ops:schedule:pins", defaultPinState);
  const pins = Array.isArray(state.pins) ? state.pins : [];

  return {
    compare: Boolean(state.compare),
    pins,
    toggleCompare: () => setState((current) => ({ ...current, compare: !current.compare })),
    togglePin: (employeeId: string) =>
      setState((current) => {
        const list = Array.isArray(current.pins) ? current.pins : [];
        const next = list.includes(employeeId)
          ? list.filter((id) => id !== employeeId)
          : [...list, employeeId].slice(-2);
        return { ...current, pins: next };
      }),
  };
};

export type SchedulePins = ReturnType<typeof useSchedulePins>;
