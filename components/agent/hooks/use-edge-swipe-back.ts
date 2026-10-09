"use client";

import { useEffect, useEffectEvent, useRef } from "react";

// El gesto empieza pegado al borde izquierdo y vuelve si se soltó más allá de
// esto, como el "atrás" de iOS.
const EDGE_PX = 24;
const BACK_PX = 80;

// Deslizar desde el borde izquierdo para volver al historial (diseño 2b). Solo
// en la app instalada: en Safari ese gesto ya es el "atrás" del navegador.
// Mientras se arrastra, la conversación acompaña al dedo; si no llega, vuelve
// a su lugar.
export const useEdgeSwipeBack = <T extends HTMLElement>(onBack: () => void, enabled: boolean) => {
  const ref = useRef<T>(null);
  const back = useEffectEvent(onBack);

  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element || !window.matchMedia("(display-mode: standalone)").matches) return;
    let start: { x: number; y: number } | null = null;
    let dx = 0;

    const place = (offset: number, animate: boolean) => {
      element.style.transition = animate ? "transform 200ms ease-out" : "";
      element.style.transform = offset > 0 ? `translateX(${offset}px)` : "";
    };
    const onStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      dx = 0;
      start = event.touches.length === 1 && touch.clientX <= EDGE_PX ? { x: touch.clientX, y: touch.clientY } : null;
    };
    const onMove = (event: TouchEvent) => {
      if (!start) return;
      const touch = event.touches[0];
      dx = touch.clientX - start.x;
      // Un gesto vertical es scroll: se suelta.
      if (Math.abs(touch.clientY - start.y) > Math.max(dx, EDGE_PX)) {
        start = null;
        place(0, true);
        return;
      }
      place(Math.max(0, dx), false);
    };
    const onEnd = () => {
      if (!start) return;
      start = null;
      if (dx > BACK_PX) {
        place(0, false);
        back();
      } else {
        place(0, true);
      }
    };

    element.addEventListener("touchstart", onStart, { passive: true });
    element.addEventListener("touchmove", onMove, { passive: true });
    element.addEventListener("touchend", onEnd);
    element.addEventListener("touchcancel", onEnd);
    return () => {
      element.removeEventListener("touchstart", onStart);
      element.removeEventListener("touchmove", onMove);
      element.removeEventListener("touchend", onEnd);
      element.removeEventListener("touchcancel", onEnd);
      place(0, false);
    };
  }, [enabled]);

  return ref;
};
