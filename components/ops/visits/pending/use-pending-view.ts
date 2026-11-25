"use client";

import { useMemo, useState } from "react";

import {
  DEFAULT_PENDING_FILTERS,
  filterPendingVisits,
  getPendingWeekdays,
  groupPendingByJob,
  type PendingFilters,
  type PendingGroup,
} from "@/lib/ops/pending-visit-groups";
import type { OpsOccurrence } from "@/components/ops/types";

// Los primeros trabajos abiertos y cuantas filas se ven antes de "Mostrar".
const OPEN_GROUPS = 2;
const GROUP_PREVIEW = 5;
const GROUPS_PREVIEW = 8;

export type PendingCheck = boolean | "indeterminate";

const checkIds = (ids: string[], selected: Set<string>): PendingCheck => {
  const count = ids.filter((id) => selected.has(id)).length;
  return count === 0 ? false : count === ids.length ? true : "indeterminate";
};

const checkState = (visits: OpsOccurrence[], selected: Set<string>) =>
  checkIds(visits.map((visit) => visit.id), selected);

// Estado de la vista Pendientes: filtros, seleccion, grupos abiertos y cuanto
// se muestra. Lo seleccionado que un filtro esconde no entra en las acciones.
export const usePendingView = (visits: OpsOccurrence[], todayKey: string | null) => {
  const [filters, setFilters] = useState<PendingFilters>(DEFAULT_PENDING_FILTERS);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [expandedRows, setExpandedRows] = useState<Set<string>>(() => new Set());
  const [allGroups, setAllGroups] = useState(false);

  const filtered = useMemo(
    () => (todayKey ? filterPendingVisits(visits, filters, todayKey) : []),
    [filters, todayKey, visits]
  );
  const groups = useMemo(() => groupPendingByJob(filtered), [filtered]);
  const selectedVisits = useMemo(() => filtered.filter((visit) => selected.has(visit.id)), [filtered, selected]);

  const setMany = (ids: string[], on: boolean) =>
    setSelected((current) => {
      const next = new Set(current);
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
      return next;
    });

  const isOpen = (group: PendingGroup<OpsOccurrence>, index: number) => open[group.jobId] ?? index < OPEN_GROUPS;
  const rowsOf = (group: PendingGroup<OpsOccurrence>) =>
    expandedRows.has(group.jobId) ? group.visits : group.visits.slice(0, GROUP_PREVIEW);

  return {
    allCheck: checkState(filtered, selected),
    clear: () => setSelected(new Set()),
    filtered,
    filters,
    groupCheck: (group: PendingGroup<OpsOccurrence>) => checkState(group.visits, selected),
    hiddenGroups: allGroups ? 0 : Math.max(0, groups.length - GROUPS_PREVIEW),
    // Seleccionadas que quedan debajo de "Mostrar": se avisa cuantas son.
    hiddenSelected: (group: PendingGroup<OpsOccurrence>) =>
      group.visits.slice(rowsOf(group).length).filter((visit) => selected.has(visit.id)).length,
    idsCheck: (ids: string[]) => checkIds(ids, selected),
    isOpen,
    isSelected: (id: string) => selected.has(id),
    rowsOf,
    selectedVisits,
    setFilters: (changes: Partial<PendingFilters>) => setFilters((current) => ({ ...current, ...changes })),
    showAllGroups: () => setAllGroups(true),
    showAllRows: (jobId: string) => setExpandedRows((current) => new Set(current).add(jobId)),
    toggle: (id: string) => setMany([id], !selected.has(id)),
    toggleAll: () => setMany(filtered.map((visit) => visit.id), checkState(filtered, selected) !== true),
    // Un dia de la semana de un trabajo: todas o ninguna de esas visitas.
    toggleIds: (ids: string[]) => setMany(ids, checkIds(ids, selected) !== true),
    toggleGroup: (group: PendingGroup<OpsOccurrence>) =>
      setMany(group.visits.map((visit) => visit.id), checkState(group.visits, selected) !== true),
    // Contraer o expandir todos los trabajos, tambien los que estan debajo de
    // "Ver los restantes".
    anyOpen: groups.slice(0, allGroups ? groups.length : GROUPS_PREVIEW).some(isOpen),
    setAllOpen: (next: boolean) => setOpen(Object.fromEntries(groups.map((group) => [group.jobId, next]))),
    toggleOpen: (group: PendingGroup<OpsOccurrence>, index: number) =>
      setOpen((current) => ({ ...current, [group.jobId]: !isOpen(group, index) })),
    visibleGroups: allGroups ? groups : groups.slice(0, GROUPS_PREVIEW),
    weekdaysOf: (group: PendingGroup<OpsOccurrence>) => getPendingWeekdays(group.visits),
  };
};

export type PendingView = ReturnType<typeof usePendingView>;
