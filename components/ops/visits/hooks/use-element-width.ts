"use client";

import { useEffect, useRef, useState } from "react";

// Ancho de un elemento, para saber si la pagina esta en su diseño de
// escritorio (el panel se angosta con la barra lateral, no con la ventana).
export const useElementWidth = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
};
