"use client";

import { plural } from "@/lib/ops/visit-day";
import { jobsPrimaryButtonClass } from "@/components/ops/jobs/jobs-styles";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { PendingResolution } from "@/schemas/ops";
import { cn } from "@/lib/utils";

type Resolution = Exclude<PendingResolution, "ASSIGN">;

const COPY: Record<Resolution, { action: (count: number) => string; body: string; title: (count: number) => string }> = {
  CANCELED: {
    action: (count) => (count === 1 ? "Cancelar visita" : "Cancelar visitas"),
    body: "Quedan canceladas en el historial, sin horario real ni pago. No se borran: podés cambiarlas una por una después.",
    title: (count) => `Cancelar ${plural(count, "visita", "visitas")}`,
  },
  DELETE: {
    action: (count) => (count === 1 ? "Eliminar visita" : "Eliminar visitas"),
    body: "Dejan de aparecer en el calendario y en el historial activo, y el cronograma no las vuelve a generar. Sirve para las que se generaron por error; si la visita existió pero no se hizo, mejor omitila o cancelala.",
    title: (count) => `Eliminar ${plural(count, "visita", "visitas")}`,
  },
  DONE: {
    action: (count) => (count === 1 ? "Registrar como hecha" : "Registrar como hechas"),
    body: "Se usa el horario programado como horario real y se suman al pago de cada empleada. Si alguna tuvo otro horario, corregila después.",
    title: (count) => `Registrar ${plural(count, "visita", "visitas")} como ${count === 1 ? "hecha" : "hechas"}`,
  },
  SKIPPED: {
    action: (count) => (count === 1 ? "Marcar omitida" : "Marcar omitidas"),
    body: "Quedan como omitidas en el historial, sin horario real ni pago. Sirve para las que el cronograma generó y no se hicieron.",
    title: (count) => `Marcar ${plural(count, "visita", "visitas")} como ${count === 1 ? "omitida" : "omitidas"}`,
  },
};

// Confirmacion de las acciones en lote que cambian el estado. Todas o ninguna.
export const PendingConfirmDialog = ({
  action,
  count,
  isBusy,
  onCancel,
  onConfirm,
}: {
  action: Resolution | null;
  count: number;
  isBusy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  const copy = action ? COPY[action] : null;

  return (
    <Dialog onOpenChange={(open) => !open && onCancel()} open={Boolean(copy)}>
      <DialogContent className="flex max-w-[460px] flex-col gap-4 rounded-[14px] border-ops-border p-[22px] shadow-[var(--ops-shadow-elevated)]">
        {copy ? (
          <>
            <div className="flex flex-col gap-1.5">
              <DialogTitle className="text-[17px] font-semibold text-ops-text">{copy.title(count)}</DialogTitle>
              <DialogDescription className="text-[13.5px] leading-normal text-ops-text-muted">{copy.body}</DialogDescription>
            </div>
            <div className="flex justify-end gap-2">
              <Button className="h-10 rounded-[10px] border-ops-border px-4 text-[13.5px] font-semibold shadow-none" onClick={onCancel} type="button" variant="outline">
                Volver
              </Button>
              <Button
                className={cn(jobsPrimaryButtonClass, (action === "CANCELED" || action === "DELETE") && "bg-red-700 hover:bg-red-700/90 dark:bg-red-500 dark:text-white")}
                disabled={isBusy}
                onClick={onConfirm}
                type="button"
              >
                {copy.action(count)}
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
