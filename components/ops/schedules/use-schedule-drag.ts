"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import type { ScheduleMoveTarget } from "@/lib/ops/schedule-move";

export type ScheduleDragPayload = {
  durationMinutes: number;
  employeeId: string | null;
  fromDateKey: string;
  visitId: string;
};

const DRAG_THRESHOLD_PX = 6;
const DAY_ATTRIBUTE = "data-schedule-day";
const EMPLOYEE_ATTRIBUTE = "data-schedule-employee";
const MINUTE_ATTRIBUTE = "data-schedule-minute";

// La celda entera recibe la visita con su hora original; el hueco, anidado
// dentro de la celda, gana el elementFromPoint y ademas fija la hora.
const findTargetAt = (x: number, y: number): ScheduleMoveTarget | null => {
  const element = document.elementFromPoint(x, y)?.closest(`[${DAY_ATTRIBUTE}]`);
  const dateKey = element?.getAttribute(DAY_ATTRIBUTE);
  if (!element || !dateKey) {
    return null;
  }

  const minute = element.getAttribute(MINUTE_ATTRIBUTE);

  return {
    dateKey,
    employeeId: element.getAttribute(EMPLOYEE_ATTRIBUTE) || null,
    startMinute: minute === null ? null : Number(minute),
  };
};

const isSamePlace = (payload: ScheduleDragPayload, target: ScheduleMoveTarget) =>
  target.startMinute == null &&
  target.dateKey === payload.fromDateKey &&
  target.employeeId === payload.employeeId;

// Pointer events en vez de HTML5 drag and drop: el nativo no funciona con el
// dedo, y administracion tambien arma el cronograma desde la tablet.
export const useScheduleDrag = (
  onMove: (payload: ScheduleDragPayload, target: ScheduleMoveTarget) => void
) => {
  const [dragging, setDragging] = useState<ScheduleDragPayload | null>(null);
  const [target, setTarget] = useState<ScheduleMoveTarget | null>(null);
  const origin = useRef<{ payload: ScheduleDragPayload; x: number; y: number } | null>(
    null
  );

  const reset = () => {
    origin.current = null;
    setDragging(null);
    setTarget(null);
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
    setTarget(findTargetAt(event.clientX, event.clientY));
  };

  const onPointerUp = (event: ReactPointerEvent) => {
    const start = origin.current;
    const wasDragging = Boolean(dragging);
    const dropTarget = findTargetAt(event.clientX, event.clientY);

    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // ya liberado
    }
    reset();

    if (start && wasDragging && dropTarget && !isSamePlace(start.payload, dropTarget)) {
      onMove(start.payload, dropTarget);
    }
  };

  return {
    canDrop: (dateKey: string, employeeId: string | null) =>
      Boolean(dragging) &&
      (dragging?.fromDateKey !== dateKey || dragging?.employeeId !== employeeId),
    dayProps: (dateKey: string, employeeId: string | null) => ({
      [DAY_ATTRIBUTE]: dateKey,
      [EMPLOYEE_ATTRIBUTE]: employeeId ?? "",
    }),
    dragging,
    handleProps: (payload: ScheduleDragPayload) => ({
      onPointerCancel: reset,
      onPointerDown: onPointerDown(payload),
      onPointerMove,
      onPointerUp,
      style: { touchAction: "none" as const },
    }),
    isDragging: (visitId: string, dateKey: string, employeeId: string | null) =>
      dragging?.visitId === visitId &&
      dragging.fromDateKey === dateKey &&
      dragging.employeeId === employeeId,
    isOver: (dateKey: string, employeeId: string | null) =>
      Boolean(dragging) &&
      target?.dateKey === dateKey &&
      target?.employeeId === employeeId,
    slotProps: (dateKey: string, employeeId: string | null, startMinute: number) => ({
      [DAY_ATTRIBUTE]: dateKey,
      [EMPLOYEE_ATTRIBUTE]: employeeId ?? "",
      [MINUTE_ATTRIBUTE]: String(startMinute),
    }),
    target,
  };
};

export type ScheduleDragState = ReturnType<typeof useScheduleDrag>;
