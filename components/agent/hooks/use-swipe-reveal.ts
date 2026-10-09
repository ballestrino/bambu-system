"use client";

import { useRef, useState } from "react";

// Cuánto hay que mover el dedo para decidir si el gesto es de costado o de
// scroll.
const INTENT_PX = 8;

type Gesture = { x: number; y: number; base: number; horizontal: boolean | null };

// Deslizar una fila a la izquierda para ver sus acciones, como en iOS. Solo
// con el dedo o el lápiz: con mouse está el "…". La fila lleva touch-action
// pan-y, así el scroll vertical sigue siendo del navegador (que cancela el
// gesto) y los movimientos de costado llegan acá. Se suelta abierta si pasó la
// mitad de las acciones. Un toque justo después de deslizar no abre la fila.
export const useSwipeReveal = ({
  open,
  width,
  onOpenChange,
}: {
  open: boolean;
  width: number;
  onOpenChange: (open: boolean) => void;
}) => {
  const [drag, setDrag] = useState<number | null>(null);
  const gesture = useRef<Gesture | null>(null);
  const dragRef = useRef<number | null>(null);
  const swiped = useRef(false);

  const move = (value: number | null) => {
    dragRef.current = value;
    setDrag(value);
  };

  const reset = () => {
    gesture.current = null;
    move(null);
  };

  const handlers = {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse") return;
      swiped.current = false;
      gesture.current = { x: event.clientX, y: event.clientY, base: open ? -width : 0, horizontal: null };
    },
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      const current = gesture.current;
      if (!current) return;
      const dx = event.clientX - current.x;
      const dy = event.clientY - current.y;
      if (current.horizontal === null) {
        if (Math.abs(dx) < INTENT_PX && Math.abs(dy) < INTENT_PX) return;
        current.horizontal = Math.abs(dx) > Math.abs(dy);
        if (current.horizontal) event.currentTarget.setPointerCapture(event.pointerId);
      }
      if (!current.horizontal) return;
      swiped.current = true;
      move(Math.min(0, Math.max(-width, current.base + dx)));
    },
    onPointerUp: () => {
      const offset = dragRef.current;
      reset();
      if (offset !== null) onOpenChange(offset < -width / 2);
    },
    onPointerCancel: reset,
    onClickCapture: (event: React.MouseEvent<HTMLElement>) => {
      if (!swiped.current) return;
      swiped.current = false;
      event.preventDefault();
      event.stopPropagation();
    },
  };

  return { offset: drag ?? (open ? -width : 0), dragging: drag !== null, handlers };
};
