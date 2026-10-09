"use client";

import { formatVisitRange, getVisitTitle } from "@/lib/ops/visit-day";
import type { VisitsController } from "@/components/ops/visits/hooks/use-visits-controller";
import { VisitRegisterForm } from "@/components/ops/visits/visit-register-form";
import { getVisitTeamLabel } from "@/components/ops/visits/visit-view-model";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Registro en modal para "Dia por empleada", donde no hay panel fijo.
export const VisitRegisterDialog = ({ ctrl }: { ctrl: VisitsController }) => {
  const visit = ctrl.selected;
  const open = Boolean(visit) && ctrl.desk.selection?.panel === "registrar";

  return (
    <Dialog
      onOpenChange={(next) => {
        if (!next && visit) ctrl.desk.open(visit.id, "detalle");
      }}
      open={open}
    >
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden rounded-2xl border-ops-border p-0 sm:max-w-[520px]">
        {visit ? (
          <>
            <DialogHeader className="border-b border-ops-surface-muted px-6 pt-5 pb-3.5 text-left">
              <DialogTitle className="text-lg font-bold">Registrar visita</DialogTitle>
              <DialogDescription className="text-[13.5px]">
                {getVisitTitle(visit)} · {getVisitTeamLabel(visit)} · programada {formatVisitRange(visit)}
              </DialogDescription>
            </DialogHeader>
            <VisitRegisterForm
              isPending={ctrl.isUpdating}
              key={visit.id}
              onCancel={() => ctrl.desk.open(visit.id, "detalle")}
              onSubmit={ctrl.register}
              visit={visit}
            />
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
