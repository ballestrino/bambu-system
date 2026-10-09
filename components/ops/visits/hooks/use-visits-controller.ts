"use client";

import { useMemo, useState } from "react";

import { getVisitCandidates, type VisitCandidate } from "@/lib/ops/visit-availability";
import { getVisitEmployees, getVisitsOfDay, isAttentionVisit } from "@/lib/ops/visit-day";
import { hasActiveCalendarFilters } from "@/components/ops/calendar/calendar-filter-utils";
import type { OccurrenceDefaults } from "@/components/ops/jobs/job-occurrence-dialog-utils";
import type { OpsOccurrence } from "@/components/ops/types";
import type { VisitDayContent } from "@/components/ops/visits/visit-agenda-list";
import type { VisitActionKind } from "@/components/ops/visits/visit-view-model";
import { useVisitActions, type VisitRegistration } from "@/components/ops/visits/hooks/use-visit-actions";
import { useVisitsData } from "@/components/ops/visits/hooks/use-visits-data";
import { useVisitsDesk } from "@/components/ops/visits/hooks/use-visits-desk";

// Todo lo que las vistas de Visitas necesitan: estado, datos del dia, visita
// abierta con su disponibilidad y las acciones sobre ella.
export const useVisitsController = () => {
  const desk = useVisitsDesk();
  const data = useVisitsData(desk.filters);
  const actions = useVisitActions();
  const [editing, setEditing] = useState<OpsOccurrence | null>(null);
  const [creating, setCreating] = useState<OccurrenceDefaults | null>(null);

  const dayVisits = useMemo(() => getVisitsOfDay(data.filtered, desk.dayKey), [data.filtered, desk.dayKey]);
  const dayScoped = useMemo(() => getVisitsOfDay(data.scoped, desk.dayKey), [data.scoped, desk.dayKey]);
  const dayAttention = useMemo(() => dayScoped.filter(isAttentionVisit), [dayScoped]);
  const failed = !data.isLoading && !data.hasData;
  const body: VisitDayContent["body"] = data.isLoading
    ? "loading"
    : failed
      ? "error"
      : dayVisits.length
        ? "list"
        : "empty";

  const selected = desk.selection
    ? data.occurrences.find((visit) => visit.id === desk.selection?.id) ?? null
    : null;
  const candidates = useMemo<VisitCandidate[]>(
    () =>
      selected && !getVisitEmployees(selected).length
        ? getVisitCandidates({ employees: data.employees, rules: data.rules, visit: selected, visits: data.occurrences })
        : [],
    [data.employees, data.occurrences, data.rules, selected]
  );

  const content = {
    attentionCount: dayAttention.length,
    attentionOnly: desk.filters.attentionOnly,
    body,
    dayKey: desk.dayKey,
    onToggleAttention: () => desk.updateFilters({ attentionOnly: !desk.filters.attentionOnly }),
    total: dayScoped.length,
    visits: dayVisits,
  };

  const act = (visit: OpsOccurrence, kind: VisitActionKind) => {
    if (kind === "editar") {
      setEditing(visit);
      return;
    }
    desk.open(visit.id, kind);
  };

  return {
    act,
    assign: (candidate: VisitCandidate) => {
      if (!selected) return;
      void actions
        .assign(selected, { id: candidate.employeeId, name: candidate.name })
        .then(() => desk.open(selected.id, "detalle"))
        .catch(() => undefined);
    },
    candidates,
    content,
    creating,
    data,
    dayAttention,
    desk,
    editing,
    hasFilters: hasActiveCalendarFilters(desk.filters),
    isUpdating: actions.isUpdating,
    // Nueva visita en el dia elegido, de 09:00 a 13:00 como en el cronograma.
    newVisit: (employeeId?: string) =>
      setCreating({
        employeeIds: employeeId ? [employeeId] : [],
        scheduledEndAt: `${desk.dayKey}T13:00`,
        scheduledStartAt: `${desk.dayKey}T09:00`,
      }),
    register: (registration: VisitRegistration) => {
      if (!selected) return;
      void actions
        .register(selected, registration)
        .then(() => desk.open(selected.id, "detalle"))
        .catch(() => undefined);
    },
    select: (visit: OpsOccurrence) =>
      desk.open(visit.id, getVisitEmployees(visit).length ? "detalle" : "asignar"),
    selected,
    setCreating,
    setEditing,
  };
};

export type VisitsController = ReturnType<typeof useVisitsController>;
