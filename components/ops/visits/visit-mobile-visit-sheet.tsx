"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";

import { formatVisitRange, getVisitTitle } from "@/lib/ops/visit-day";
import type { VisitsController } from "@/components/ops/visits/hooks/use-visits-controller";
import { VisitAssignList } from "@/components/ops/visits/visit-assign-list";
import { VisitDetailBody, VisitDetailFooter, VisitDetailHeader } from "@/components/ops/visits/visit-detail";
import { VisitRegisterForm } from "@/components/ops/visits/visit-register-form";
import { VisitSheet } from "@/components/ops/visits/visit-sheet";
import { getVisitTeamLabel } from "@/components/ops/visits/visit-view-model";

// La visita abierta en el celular: detalle, registrar o asignar en una hoja.
// Solo se abre en el diseño angosto (enabled); en escritorio va el panel.
export const VisitMobileVisitSheet = ({ ctrl, enabled }: { ctrl: VisitsController; enabled: boolean }) => {
  const visit = ctrl.selected;
  const panel = ctrl.desk.selection?.panel ?? "detalle";
  const [picked, setPicked] = useState<string | null>(null);
  const open = enabled && Boolean(visit);
  const onOpenChange = (next: boolean) => {
    if (!next) {
      ctrl.desk.close();
      setPicked(null);
    }
  };

  if (!visit) return <VisitSheet onOpenChange={onOpenChange} open={false} title="Visita">{null}</VisitSheet>;

  if (panel === "registrar") {
    return (
      <VisitSheet
        description={`${getVisitTitle(visit)} · ${getVisitTeamLabel(visit)}`}
        onOpenChange={onOpenChange}
        open={open}
        title="Registrar visita"
      >
        <VisitRegisterForm
          isPending={ctrl.isUpdating}
          key={visit.id}
          onCancel={() => ctrl.desk.open(visit.id, "detalle")}
          onSubmit={ctrl.register}
          size="lg"
          visit={visit}
        />
      </VisitSheet>
    );
  }

  if (panel === "asignar") {
    const chosen = ctrl.candidates.find((candidate) => candidate.employeeId === picked) ??
      ctrl.candidates.find((candidate) => candidate.isFree);

    return (
      <VisitSheet
        description={`${getVisitTitle(visit)} · ${formatVisitRange(visit)}`}
        footer={
          <button
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-ops-bamboo-strong text-base font-semibold whitespace-nowrap text-white disabled:opacity-50 dark:text-ops-canvas"
            disabled={!chosen || ctrl.isUpdating}
            onClick={() => chosen && ctrl.assign(chosen)}
            type="button"
          >
            <UserPlus className="size-[18px]" />
            {chosen ? `Asignar a ${chosen.name}` : "Nadie libre en ese horario"}
          </button>
        }
        onOpenChange={onOpenChange}
        open={open}
        title="Asignar empleada"
      >
        <div className="flex flex-col gap-2 px-5 pb-4">
          <span className="text-[13px] font-semibold text-ops-text-muted">Disponibilidad en ese horario</span>
          <VisitAssignList
            candidates={ctrl.candidates}
            onPick={(candidate) => setPicked(candidate.employeeId)}
            pickedId={chosen?.employeeId ?? null}
            size="lg"
          />
        </div>
      </VisitSheet>
    );
  }

  return (
    <VisitSheet
      footer={
        <VisitDetailFooter
          bare
          large
          onEdit={() => {
            ctrl.desk.close();
            ctrl.setEditing(visit);
          }}
          onRegister={() => ctrl.desk.open(visit.id, "registrar")}
          visit={visit}
        />
      }
      hideHeader
      onOpenChange={onOpenChange}
      open={open}
      title={getVisitTitle(visit)}
    >
      <VisitDetailHeader large visit={visit} />
      <div className="px-5 pt-3 pb-4">
        <VisitDetailBody candidates={[]} large visit={visit} />
      </div>
    </VisitSheet>
  );
};
