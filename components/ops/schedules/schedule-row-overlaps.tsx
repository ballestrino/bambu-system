"use client";

import { TriangleAlert } from "lucide-react";

// Aviso al pie del nombre: la fila queda marcada sin robarle atencion a la
// carga de la semana, que es lo que se mira primero.
export const ScheduleRowOverlaps = ({ count }: { count: number }) => {
  if (!count) {
    return null;
  }

  return (
    <p className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-300">
      <TriangleAlert aria-hidden className="h-3 w-3 shrink-0" />
      {count} cruce{count === 1 ? "" : "s"} de horario
    </p>
  );
};
