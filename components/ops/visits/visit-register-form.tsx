"use client";

import { useState } from "react";
import { Check, CircleCheck, CircleX, SkipForward } from "lucide-react";

import { formatMinuteOfDay, parseMinuteOfDay } from "@/lib/ops/minute-ranges";
import { formatVisitRange, getVisitMinutes } from "@/lib/ops/visit-day";
import type { OpsOccurrence } from "@/components/ops/types";
import type { VisitRegistration } from "@/components/ops/visits/hooks/use-visit-actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const STATUSES = [
  { icon: CircleCheck, label: "Realizada", value: "DONE" },
  { icon: SkipForward, label: "Omitida", value: "SKIPPED" },
  { icon: CircleX, label: "Cancelada", value: "CANCELED" },
] as const;

const labelClass = "text-[12.5px] font-semibold text-ops-text-muted";

const initialTimes = (visit: OpsOccurrence) => {
  const actual = visit.actualStartAt && visit.actualEndAt
    ? getVisitMinutes({ ...visit, scheduledEndAt: visit.actualEndAt, scheduledStartAt: visit.actualStartAt })
    : getVisitMinutes(visit);
  return { end: formatMinuteOfDay(actual.endMinute), start: formatMinuteOfDay(actual.startMinute) };
};

// Registrar como quedo la visita: estado, horario real y notas. El mismo
// formulario va en el panel de la Agenda, el modal del dia y la hoja del celular.
export const VisitRegisterForm = ({
  isPending,
  onCancel,
  onSubmit,
  size = "md",
  visit,
}: {
  isPending?: boolean;
  onCancel: () => void;
  onSubmit: (registration: VisitRegistration) => void;
  size?: "lg" | "md";
  visit: OpsOccurrence;
}) => {
  const large = size === "lg";
  const [status, setStatus] = useState<VisitRegistration["status"]>(
    visit.status === "SKIPPED" || visit.status === "CANCELED" ? visit.status : "DONE"
  );
  const [times, setTimes] = useState(() => initialTimes(visit));
  const [notes, setNotes] = useState(visit.notes ?? "");
  const startMinute = parseMinuteOfDay(times.start);
  const endMinute = parseMinuteOfDay(times.end);
  const isDone = status === "DONE";
  const validTimes = startMinute !== null && endMinute !== null && endMinute >= startMinute;
  const scheduled = getVisitMinutes(visit);
  const onSchedule = startMinute === scheduled.startMinute && endMinute === scheduled.endMinute;

  const submit = () => {
    if (isDone && !validTimes) return;
    onSubmit({ endMinute: endMinute ?? 0, notes, startMinute: startMinute ?? 0, status });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={cn("flex min-h-0 flex-1 flex-col overflow-y-auto", large ? "gap-5 px-5 pb-4" : "gap-4 px-5 py-4")}>
        <div className="flex flex-col gap-2">
          <span className={labelClass}>Estado</span>
          <div className="grid grid-cols-3 gap-2">
            {STATUSES.map(({ icon: Icon, label, value }) => (
              <button
                aria-pressed={status === value}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-[10px] text-[13px] transition-colors",
                  large ? "h-16 flex-col rounded-[14px] text-sm" : "h-[42px]",
                  status === value
                    ? "border-2 border-ops-bamboo-strong bg-ops-bamboo-soft font-semibold text-ops-bamboo-strong"
                    : "border border-ops-border text-ops-text hover:bg-ops-surface-muted"
                )}
                key={value}
                onClick={() => setStatus(value)}
                type="button"
              >
                <Icon className={cn(large ? "size-5" : "size-[15px]", status !== value && "text-ops-text-muted")} />
                {label}
              </button>
            ))}
          </div>
        </div>
        {isDone ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className={labelClass}>Horario real</span>
              <span className="text-xs text-ops-text-muted tabular-nums">Programado {formatVisitRange(visit)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["start", "end"] as const).map((key) => (
                <label className="flex flex-col gap-1" key={key}>
                  <span className="text-xs text-ops-text-muted">{key === "start" ? "Inicio" : "Fin"}</span>
                  <Input
                    className={cn("border-ops-border font-semibold tabular-nums shadow-none", large ? "h-12 text-base" : "h-10")}
                    onChange={(event) => setTimes((current) => ({ ...current, [key]: event.target.value }))}
                    type="time"
                    value={times[key]}
                  />
                </label>
              ))}
            </div>
            <span className={cn("text-xs", validTimes ? "text-ops-text-muted" : "text-red-700 dark:text-red-300")}>
              {!validTimes
                ? "El fin tiene que ser igual o posterior al inicio."
                : onSchedule
                  ? "Se completó con el horario programado."
                  : "Se registra con el horario ajustado."}
            </span>
          </div>
        ) : null}
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Notas</span>
          <Textarea
            className={cn("min-h-[72px] border-ops-border shadow-none", large && "text-base")}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={isDone ? "Opcional" : "Contá por qué no se hizo (opcional)"}
            value={notes}
          />
        </label>
      </div>
      <div className={cn("grid flex-none gap-2 border-t border-ops-surface-muted px-5 pt-3", large ? "grid-cols-[1fr_1.7fr] pb-[max(1.25rem,env(safe-area-inset-bottom))]" : "grid-cols-[1fr_1.6fr] pb-4")}>
        <button
          className={cn("rounded-[10px] border border-ops-border font-semibold text-ops-text hover:bg-ops-surface-muted", large ? "h-[52px] rounded-[14px] text-base" : "h-10 text-[13.5px]")}
          onClick={onCancel}
          type="button"
        >
          Cancelar
        </button>
        <button
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-[10px] bg-ops-bamboo-strong font-semibold whitespace-nowrap text-white hover:bg-ops-bamboo-strong/90 disabled:opacity-50 dark:text-ops-canvas",
            large ? "h-[52px] rounded-[14px] text-base" : "h-10 text-[13.5px]"
          )}
          disabled={isPending || (isDone && !validTimes)}
          onClick={submit}
          type="button"
        >
          <Check className="size-4" />
          {isDone ? "Completar visita" : "Guardar registro"}
        </button>
      </div>
    </div>
  );
};
