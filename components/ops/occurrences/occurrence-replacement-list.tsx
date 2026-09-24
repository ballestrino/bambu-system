"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { formatDate, formatTime } from "@/components/ops/utils";
import {
  replacementReasonLabels,
  type ReplacementReason,
} from "@/lib/ops/occurrence-replacement";

export type ReplaceableOccurrencePreview = {
  endAt: string;
  id: string;
  jobName: string;
  reasons: ReplacementReason[];
  recreated: boolean;
  startAt: string;
};

const reasonOrder: ReplacementReason[] = ["inactiveRule", "schedule", "duration", "team"];
const plural = (count: number) => (count === 1 ? "" : "s");

// The visits that no longer match their rule. None starts picked: the user
// marks them one by one, by reason, or all. Only untouched future visits
// get here; edited ones are only counted.
export const OccurrenceReplacementList = ({
  kept,
  onToggle,
  onToggleAll,
  onToggleReason,
  replaceable,
  selected,
}: {
  kept: number;
  onToggle: (id: string) => void;
  onToggleAll: (select: boolean) => void;
  onToggleReason: (reason: ReplacementReason, select: boolean) => void;
  replaceable: ReplaceableOccurrencePreview[];
  selected: Set<string>;
}) => {
  if (!replaceable.length && !kept) return null;
  const allPicked = replaceable.every((occurrence) => selected.has(occurrence.id));
  const groups = reasonOrder
    .map((reason) => {
      const ids = replaceable.filter((occurrence) => occurrence.reasons.includes(reason)).map((o) => o.id);
      return { ids, picked: ids.every((id) => selected.has(id)), reason };
    })
    .filter((group) => group.ids.length);

  return (
    <div className="space-y-2 rounded-md border border-amber-500/30 bg-amber-50/60 p-3 dark:bg-amber-500/10">
      {replaceable.length ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">
              {replaceable.length} visita{plural(replaceable.length)} ya no coincide
              {replaceable.length === 1 ? "" : "n"} con su regla
            </p>
            <button
              className="text-xs font-medium text-primary underline-offset-2 hover:underline"
              onClick={() => onToggleAll(!allPicked)}
              type="button"
            >
              {allPicked ? "Desmarcar todas" : "Marcar todas"}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Marcá las que quieras reemplazar: se borran y, si la regla todavía tiene ese día, se
            crean de nuevo como corresponde. Las que no marques quedan como están.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {groups.map((group) => (
              <button
                aria-pressed={group.picked}
                className="rounded-full border border-border bg-background px-2.5 py-1 text-xs aria-pressed:border-primary aria-pressed:bg-primary/10"
                key={group.reason}
                onClick={() => onToggleReason(group.reason, !group.picked)}
                type="button"
              >
                {replacementReasonLabels[group.reason]} ({group.ids.length})
              </button>
            ))}
          </div>
          <ul className="max-h-48 space-y-1 overflow-y-auto pr-1">
            {replaceable.map((occurrence) => {
              const id = `replace-${occurrence.id}`;
              return (
                <li className="flex items-start gap-2 text-sm" key={occurrence.id}>
                  <Checkbox
                    checked={selected.has(occurrence.id)}
                    className="mt-0.5"
                    id={id}
                    onCheckedChange={() => onToggle(occurrence.id)}
                  />
                  <label className="min-w-0 flex-1 cursor-pointer" htmlFor={id}>
                    <span className="font-medium">{occurrence.jobName}</span>
                    <span className="block text-xs text-muted-foreground">
                      {formatDate(occurrence.startAt)} · {formatTime(occurrence.startAt)} a{" "}
                      {formatTime(occurrence.endAt)} · cambió:{" "}
                      {occurrence.reasons.map((reason) => replacementReasonLabels[reason]).join(", ")}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
      {kept ? (
        <p className="text-xs text-muted-foreground">
          {kept} visita{plural(kept)} tampoco coincide{kept === 1 ? "" : "n"}, pero se mantiene
          {kept === 1 ? "" : "n"} porque fue{kept === 1 ? "" : "ron"} editada{plural(kept)} o
          registrada{plural(kept)}.
        </p>
      ) : null}
    </div>
  );
};
