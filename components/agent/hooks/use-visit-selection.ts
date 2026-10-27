"use client";

import { useState } from "react";

import type { ProposalItemsSelection } from "@/components/agent/cards/agent-proposal-items";
import type { ProposalDisplayStatus } from "@/lib/agent/proposal-outcome";
import type { AgentProposalKind, ProposalResult, ProposalSummary } from "@/lib/agent/proposals";

type VisitSelection = {
  selection: ProposalItemsSelection | undefined;
  // Las marcadas para confirmar; undefined si están todas (como antes).
  visitIndexes: number[] | undefined;
  // Pendiente: qué dice el pie en vez del texto de confirmar, y si se puede.
  confirmText: string | null;
  canConfirm: boolean;
};

const NONE: VisitSelection = { selection: undefined, visitIndexes: undefined, confirmText: null, canConfirm: true };

// Cómo se dice en cada lote: agendar visitas nuevas o cambiar las que hay.
const WORDING = {
  CREATE_VISITS: { verb: "agenda", skippedLabel: "No se agendó" },
  UPDATE_VISITS: { verb: "cambia", skippedLabel: "Sin cambios" },
} as const;

// Las visitas de un lote que se agendan o cambian: todas marcadas al
// principio, y el usuario desmarca las que no quiere antes de confirmar. Con
// una sola no hay nada que elegir: sacarla es rechazar. Ya confirmado, result
// dice cuáles se escribieron.
export const useVisitSelection = ({
  kind,
  items,
  status,
  result,
  canAct,
}: {
  kind: AgentProposalKind;
  items: ProposalSummary["items"];
  status: ProposalDisplayStatus;
  result: ProposalResult | null | undefined;
  canAct: boolean;
}): VisitSelection => {
  const [unchecked, setUnchecked] = useState<number[]>([]);
  if ((kind !== "CREATE_VISITS" && kind !== "UPDATE_VISITS") || !items || items.length < 2) return NONE;
  const { verb, skippedLabel } = WORDING[kind];
  if (status === "CONFIRMED") {
    return result?.visitIndexes ? { ...NONE, selection: { skippedLabel, done: result.visitIndexes } } : NONE;
  }
  if (status !== "PENDING") return NONE;

  const checked = items.map((_, index) => !unchecked.includes(index));
  const indexes = checked.flatMap((isChecked, index) => (isChecked ? [index] : []));
  const onToggle = (index: number) =>
    setUnchecked((current) => (current.includes(index) ? current.filter((value) => value !== index) : [...current, index]));
  return {
    selection: { skippedLabel, checked, disabled: !canAct, onToggle },
    visitIndexes: unchecked.length ? indexes : undefined,
    confirmText: !indexes.length
      ? "Marcá al menos una visita, o rechazá la propuesta."
      : unchecked.length
        ? `Confirmar ${verb} ${indexes.length} de ${items.length} visitas juntas.`
        : null,
    canConfirm: indexes.length > 0,
  };
};
