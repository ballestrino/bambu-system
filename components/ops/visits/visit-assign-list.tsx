"use client";

import { Circle, CircleCheck, CircleSlash } from "lucide-react";

import type { VisitCandidate } from "@/lib/ops/visit-availability";
import { VisitAvatar } from "@/components/ops/visits/visit-bits";
import { cn } from "@/lib/utils";

const textTone = (candidate: VisitCandidate) =>
  candidate.isFree ? "text-emerald-800 dark:text-emerald-200" : "text-amber-800 dark:text-amber-200";

// Disponibilidad para una visita sin equipo. En el panel cada libre tiene su
// boton; en la hoja del celular se elige una fila y se confirma abajo.
export const VisitAssignList = ({
  candidates,
  onAssign,
  onPick,
  pickedId,
  size = "md",
}: {
  candidates: VisitCandidate[];
  onAssign?: (candidate: VisitCandidate) => void;
  onPick?: (candidate: VisitCandidate) => void;
  pickedId?: string | null;
  size?: "lg" | "md";
}) => {
  const large = size === "lg";

  if (!candidates.length) {
    return <p className="text-[13px] text-ops-text-muted">No hay empleadas activas para asignar.</p>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {candidates.map((candidate) => {
        const picked = pickedId === candidate.employeeId;
        const Icon = picked ? CircleCheck : candidate.isFree ? Circle : CircleSlash;
        const row = (
          <>
            <VisitAvatar className={large ? "size-9 text-xs" : undefined} name={candidate.name} />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
              <span className={cn("font-semibold text-ops-text", large ? "text-[15px]" : "text-[13px]")}>{candidate.name}</span>
              <span className={cn("tabular-nums", large ? "text-[13px]" : "text-xs", textTone(candidate))}>{candidate.text}</span>
            </span>
          </>
        );

        if (onPick) {
          return (
            <button
              aria-pressed={picked}
              className={cn(
                "flex min-h-16 items-center gap-3 rounded-[14px] px-3.5 py-2",
                picked ? "border-2 border-ops-bamboo-strong bg-ops-bamboo-soft" : "border border-ops-border bg-ops-surface",
                !candidate.isFree && "opacity-60"
              )}
              disabled={!candidate.isFree}
              key={candidate.employeeId}
              onClick={() => onPick(candidate)}
              type="button"
            >
              {row}
              <Icon className={cn("size-[22px]", picked ? "text-ops-bamboo-strong" : "text-ops-text-muted/60")} />
            </button>
          );
        }

        return (
          <div
            className={cn("flex items-center gap-2.5 rounded-[10px] border border-ops-border px-2.5 py-2", !candidate.isFree && "opacity-60")}
            key={candidate.employeeId}
          >
            {row}
            {candidate.isFree && onAssign ? (
              <button
                className="inline-flex h-[30px] items-center rounded-lg bg-ops-bamboo-strong px-2.5 text-xs font-semibold text-white hover:bg-ops-bamboo-strong/90 dark:text-ops-canvas"
                onClick={() => onAssign(candidate)}
                type="button"
              >
                Asignar
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
