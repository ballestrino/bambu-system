"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

export type ScheduleDragPayload = {
  employeeId: string | null;
  fromDateKey: string;
  visitId: string;
};

const DRAG_THRESHOLD_PX = 6;
const DAY_ATTRIBUTE = "data-schedule-day";

const findDayKeyAt = (x: number, y: number) =>
  document
    .elementFromPoint(x, y)
    ?.closest(`[${DAY_ATTRIBUTE}]`)
    ?.getAttribute(DAY_ATTRIBUTE) ?? null;

// Pointer events en vez de HTML5 drag and drop: el nativo no funciona con el
// dedo, y administracion tambien arma el cronograma desde la tablet.
export const useScheduleDrag = (onMove: (payload: ScheduleDragPayload, toDateKey: string) => void) => {
  const [dragging, setDragging] = useState<ScheduleDragPayload | null>(null);
  const [overDateKey, setOverDateKey] = useState<string | null>(null);
  const origin = useRef<{ payload: ScheduleDragPayload; x: number; y: number } | null>(null);

  const reset = () => {
    origin.current = null;
    setDragging(null);
    setOverDateKey(null);
  };

  const onPointerDown = (payload: ScheduleDragPayload) => (event: ReactPointerEvent) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    origin.current = { payload, x: event.clientX, y: event.clientY };
    // Falla si el pointer ya se solto; sin captura el arrastre sigue andando.
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // sin captura
    }
  };

  const onPointerMove = (event: ReactPointerEvent) => {
    const start = origin.current;
    if (!start) return;

    const movedEnough =
      Math.abs(event.clientX - start.x) > DRAG_THRESHOLD_PX ||
      Math.abs(event.clientY - start.y) > DRAG_THRESHOLD_PX;
    if (!movedEnough && !dragging) return;

    if (!dragging) setDragging(start.payload);
    setOverDateKey(findDayKeyAt(event.clientX, event.clientY));
  };

  const onPointerUp = (event: ReactPointerEvent) => {
    const start = origin.current;
    const wasDragging = Boolean(dragging);
    const target = findDayKeyAt(event.clientX, event.clientY);

    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // ya liberado
    }
    reset();

    if (start && wasDragging && target && target !== start.payload.fromDateKey) {
      onMove(start.payload, target);
    }
  };

  return {
    dayProps: (dateKey: string) => ({ [DAY_ATTRIBUTE]: dateKey }),
    dragging,
    handleProps: (payload: ScheduleDragPayload) => ({
      onPointerCancel: reset,
      onPointerDown: onPointerDown(payload),
      onPointerMove,
      onPointerUp,
      style: { touchAction: "none" as const },
    }),
    isDragging: (visitId: string, dateKey: string) =>
      dragging?.visitId === visitId && dragging.fromDateKey === dateKey,
    overDateKey,
  };
};

export type ScheduleDragState = ReturnType<typeof useScheduleDrag>;
