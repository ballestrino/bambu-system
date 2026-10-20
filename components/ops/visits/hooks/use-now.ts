"use client";

import { useEffect, useState } from "react";

// La hora actual, refrescada cada minuto para la linea de "ahora". Arranca en
// null: el servidor no sabe la hora del navegador.
export const useNow = (intervalMs = 60_000) => {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
};
