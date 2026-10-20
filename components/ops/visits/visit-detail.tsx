"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { BriefcaseBusiness, Clock3, MapPin, MessageSquareText, Pencil, Repeat, UsersRound, X } from "lucide-react";

import type { VisitCandidate } from "@/lib/ops/visit-availability";
import { formatDayLabel } from "@/lib/ops/visit-calendar";
import {
  formatActualRange,
  formatVisitRange,
  getVisitAddress,
  getVisitDayKey,
  getVisitEmployees,
  getVisitTitle,
  isAttentionVisit,
  isRegistrableVisit,
} from "@/lib/ops/visit-day";
import type { OpsOccurrence } from "@/components/ops/types";
import { VisitAssignList } from "@/components/ops/visits/visit-assign-list";
import { VisitAttentionBadge, VisitStatusBadge } from "@/components/ops/visits/visit-bits";
import { getVisitRuleLabel, getVisitTeamLabel } from "@/components/ops/visits/visit-view-model";
import { cn } from "@/lib/utils";

export const VisitDetailHeader = ({
  large,
  onClose,
  visit,
}: {
  large?: boolean;
  onClose?: () => void;
  visit: OpsOccurrence;
}) => (
  <div className={cn("flex flex-none items-start gap-2", large ? "px-5 pt-2 pb-1" : "px-5 pt-[18px] pb-3.5")}>
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        <VisitStatusBadge status={visit.status} />
        {isAttentionVisit(visit) ? <VisitAttentionBadge /> : null}
      </div>
      <span className={cn("font-bold tracking-tight text-ops-text", large ? "text-[22px] leading-tight" : "text-[19px] leading-tight")}>
        {getVisitTitle(visit)}
      </span>
      <span className={cn("text-ops-text/75 tabular-nums", large ? "text-[15px]" : "text-[13.5px]")}>
        {formatDayLabel(getVisitDayKey(visit.scheduledStartAt))} · {formatVisitRange(visit)}
      </span>
    </div>
    {onClose ? (
      <button aria-label="Cerrar" className="flex size-8 items-center justify-center rounded-lg hover:bg-ops-surface-muted" onClick={onClose} type="button">
        <X className="size-[18px]" />
      </button>
    ) : null}
  </div>
);

const InfoRow = ({ icon, label, large, value }: { icon: ReactNode; label: string; large?: boolean; value: ReactNode }) => (
  <div className={cn("flex items-center gap-2.5 border-t border-ops-border/70 px-3 first:border-t-0", large ? "min-h-[52px] gap-3 px-3.5 py-2" : "py-2.5")}>
    {large ? icon : null}
    <span className={cn("shrink-0 text-ops-text-muted", large ? "w-24 text-sm" : "w-[92px] text-[13.5px]")}>{label}</span>
    <span className={cn("min-w-0 flex-1 font-medium text-ops-text", large ? "text-[15px]" : "text-[13.5px]")}>{value}</span>
  </div>
);

export const VisitDetailBody = ({
  candidates,
  large,
  onAssign,
  visit,
}: {
  candidates: VisitCandidate[];
  large?: boolean;
  onAssign?: (candidate: VisitCandidate) => void;
  visit: OpsOccurrence;
}) => {
  const unassigned = !getVisitEmployees(visit).length;
  const iconClass = "size-[18px] shrink-0 text-ops-text-muted";

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-col rounded-xl bg-ops-canvas dark:bg-ops-surface-muted">
        <InfoRow
          icon={<UsersRound className={iconClass} />}
          label="Equipo"
          large={large}
          value={<span className={unassigned ? "text-amber-800 dark:text-amber-200" : undefined}>{getVisitTeamLabel(visit)}</span>}
        />
        <InfoRow icon={<MapPin className={iconClass} />} label="Dirección" large={large} value={getVisitAddress(visit) ?? "Sin dirección registrada"} />
        <InfoRow icon={<Clock3 className={iconClass} />} label="Horario real" large={large} value={<span className="tabular-nums">{formatActualRange(visit) ?? "Sin registrar"}</span>} />
        <InfoRow icon={<Repeat className={iconClass} />} label="Regla" large={large} value={getVisitRuleLabel(visit)} />
      </div>
      {visit.notes ? (
        <div className={cn("flex gap-2.5 rounded-xl bg-amber-50 px-3 py-2.5 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200", large ? "text-sm" : "text-[13px]")}>
          {large ? <MessageSquareText className="mt-0.5 size-4 shrink-0" /> : null}
          {visit.notes}
        </div>
      ) : null}
      {unassigned && onAssign ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-ops-text-muted">Disponibilidad de {formatVisitRange(visit)}</span>
          <VisitAssignList candidates={candidates} onAssign={onAssign} />
        </div>
      ) : null}
    </div>
  );
};

const outline = "flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-ops-border font-semibold whitespace-nowrap text-ops-text hover:bg-ops-surface-muted";

export const VisitDetailFooter = ({
  bare = false,
  large,
  onEdit,
  onRegister,
  visit,
}: {
  // Sin borde ni margen propios: la hoja del celular ya pone su pie.
  bare?: boolean;
  large?: boolean;
  onEdit: () => void;
  onRegister: () => void;
  visit: OpsOccurrence;
}) => (
  <div className={cn("flex flex-none gap-2", large && "flex-col", !bare && "border-t border-ops-surface-muted px-5 pt-3 pb-4")}>
    {isRegistrableVisit(visit) ? (
      <button
        className={cn(
          "flex items-center justify-center gap-2 rounded-[10px] bg-ops-bamboo-strong font-semibold whitespace-nowrap text-white hover:bg-ops-bamboo-strong/90 dark:text-ops-canvas",
          large ? "h-[52px] rounded-[14px] text-base" : "h-10 flex-[1.4] text-[13.5px]"
        )}
        onClick={onRegister}
        type="button"
      >
        <Clock3 className="size-4" />
        Registrar horario
      </button>
    ) : null}
    <div className={cn("flex gap-2", large ? "w-full" : "contents")}>
      <button className={cn(outline, large ? "h-12 rounded-[14px] text-[15px]" : "h-10 text-[13.5px]")} onClick={onEdit} type="button">
        <Pencil className="size-3.5" />
        Editar
      </button>
      <Link className={cn(outline, large ? "h-12 rounded-[14px] text-[15px]" : "h-10 text-[13.5px]")} href={`/dashboard/jobs/${visit.jobId}`}>
        <BriefcaseBusiness className="size-3.5" />
        {large ? "Ver trabajo" : "Trabajo"}
      </Link>
    </div>
  </div>
);
