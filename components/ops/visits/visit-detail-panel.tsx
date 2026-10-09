"use client";

import type { VisitsController } from "@/components/ops/visits/hooks/use-visits-controller";
import { VisitDetailBody, VisitDetailFooter, VisitDetailHeader } from "@/components/ops/visits/visit-detail";
import { VisitRegisterForm } from "@/components/ops/visits/visit-register-form";

// Panel de la visita abierta: detalle o, en la Agenda, el registro en el lugar.
// En "Dia por empleada" el registro abre un modal, asi que el panel sigue en
// detalle (registerInline=false).
export const VisitDetailPanel = ({
  ctrl,
  onClose,
  onRegister,
  registerInline = true,
}: {
  ctrl: VisitsController;
  onClose?: () => void;
  onRegister?: () => void;
  registerInline?: boolean;
}) => {
  const visit = ctrl.selected;

  if (!visit) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-[13.5px] text-ops-text-muted">
        Elegí una visita para ver el detalle.
      </div>
    );
  }

  const registering = registerInline && ctrl.desk.selection?.panel === "registrar";

  return (
    <>
      <div className="border-b border-ops-surface-muted">
        <VisitDetailHeader onClose={onClose} visit={visit} />
      </div>
      {registering ? (
        <>
          <span className="px-5 pt-4 text-[15px] font-semibold text-ops-text">Registrar visita</span>
          <VisitRegisterForm
            isPending={ctrl.isUpdating}
            key={visit.id}
            onCancel={() => ctrl.desk.open(visit.id, "detalle")}
            onSubmit={ctrl.register}
            visit={visit}
          />
        </>
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3.5">
            <VisitDetailBody candidates={ctrl.candidates} onAssign={ctrl.assign} visit={visit} />
          </div>
          <VisitDetailFooter
            onEdit={() => ctrl.setEditing(visit)}
            onRegister={onRegister ?? (() => ctrl.desk.open(visit.id, "registrar"))}
            visit={visit}
          />
        </>
      )}
    </>
  );
};
