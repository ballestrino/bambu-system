"use client";

import { useState } from "react";

import type { OccurrenceGenerationPreview } from "@/components/ops/occurrences/occurrence-generation-summary";
import type { ReplacementReason } from "@/lib/ops/occurrence-replacement";

const visitsLabel = (count: number) => `${count} visita${count === 1 ? "" : "s"}`;

// Which of the visits that no longer match get replaced. Nothing starts
// picked: there can be hundreds, so deleting is always an explicit choice.
export const useReplacementSelection = (preview?: OccurrenceGenerationPreview) => {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const replaceable = preview?.replaceable ?? [];
  const chosen = replaceable.filter((occurrence) => selected.has(occurrence.id));
  const createCount = (preview?.visits ?? 0) + chosen.filter((occurrence) => occurrence.recreated).length;
  const deleteCount = chosen.length;

  const setMany = (ids: string[], select: boolean) =>
    setSelected((current) => {
      const next = new Set(current);
      ids.forEach((id) => (select ? next.add(id) : next.delete(id)));
      return next;
    });

  return {
    createCount,
    deleteCount,
    label:
      createCount && deleteCount
        ? `Generar ${visitsLabel(createCount)} y borrar ${deleteCount}`
        : deleteCount
          ? `Borrar ${visitsLabel(deleteCount)}`
          : createCount
            ? `Generar ${visitsLabel(createCount)}`
            : "Generar",
    replaceIds: chosen.map((occurrence) => occurrence.id),
    reset: () => setSelected(new Set()),
    selected,
    toggle: (id: string) => setMany([id], !selected.has(id)),
    toggleAll: (select: boolean) => setMany(replaceable.map((occurrence) => occurrence.id), select),
    toggleReason: (reason: ReplacementReason, select: boolean) =>
      setMany(
        replaceable.filter((occurrence) => occurrence.reasons.includes(reason)).map((occurrence) => occurrence.id),
        select
      ),
  };
};
