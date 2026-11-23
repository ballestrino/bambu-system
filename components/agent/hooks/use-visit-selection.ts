"use client";

import { useAgentChatContext } from "@/components/agent/agent-chat-context";
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
  // Pendiente: cuántas y cuáles van marcadas (null si no es un lote), y
  // desmarcar las que se cruzan con otra visita.
  checkedCount: number | null;
  checked: boolean[] | null;
  dropClashes: (() => void) | null;
};

const NONE: VisitSelection = {
  selection: undefined,
  visitIndexes: undefined,
  confirmText: null,
  canConfirm: true,
  checkedCount: null,
  checked: null,
  dropClashes: null,
};

// Las marcadas de un lote, o undefined si van todas (como antes).
export const selectedVisitIndexes = (count: number, unchecked: number[] | undefined) =>
  unchecked?.length ? Array.from({ length: count }, (_, index) => index).filter((index) => !unchecked.includes(index)) : undefined;

// Cómo se dice en cada lote: agendar visitas nuevas o cambiar las que hay.
const WORDING = {
  CREATE_VISITS: { verb: "agenda", skippedLabel: "No se agendó" },
  UPDATE_VISITS: { verb: "cambia", skippedLabel: "Sin cambios" },
} as const;

// Las visitas de un lote que se agendan o cambian: todas marcadas al
// principio, y el usuario desmarca las que no quiere antes de confirmar. Con
// una sola no hay nada que elegir: sacarla es rechazar. Ya confirmado, result
// dice cuáles se escribieron. Las desmarcadas viven en la conversación
// (AgentChat): la barra de pendientes confirma con las mismas.
export const useVisitSelection = ({
  proposalId,
  kind,
  items,
  status,
  result,
  canAct,
}: {
  proposalId: string;
  kind: AgentProposalKind;
  items: ProposalSummary["items"];
  status: ProposalDisplayStatus;
  result: ProposalResult | null | undefined;
  canAct: boolean;
}): VisitSelection => {
  const { visitSelections, setVisitUnchecked } = useAgentChatContext();
  const unchecked = visitSelections[proposalId] ?? [];
  if ((kind !== "CREATE_VISITS" && kind !== "UPDATE_VISITS") || !items || items.length < 2) return NONE;
  const { verb, skippedLabel } = WORDING[kind];
  if (status === "CONFIRMED") {
    return result?.visitIndexes ? { ...NONE, selection: { skippedLabel, done: result.visitIndexes } } : NONE;
  }
  if (status !== "PENDING") return NONE;

  const checked = items.map((_, index) => !unchecked.includes(index));
  const indexes = checked.flatMap((isChecked, index) => (isChecked ? [index] : []));
  const onToggle = (index: number) =>
    setVisitUnchecked(
      proposalId,
      unchecked.includes(index) ? unchecked.filter((value) => value !== index) : [...unchecked, index]
    );
  const clashes = items.flatMap((item, index) => (item.detail && checked[index] ? [index] : []));
  return {
    selection: { skippedLabel, checked, disabled: !canAct, onToggle },
    visitIndexes: unchecked.length ? indexes : undefined,
    confirmText: !indexes.length
      ? "Marcá al menos una visita, o rechazá la propuesta."
      : unchecked.length
        ? `Confirmar ${verb} ${indexes.length} de ${items.length} visitas juntas.`
        : null,
    canConfirm: indexes.length > 0,
    checkedCount: indexes.length,
    checked,
    dropClashes: clashes.length && canAct ? () => setVisitUnchecked(proposalId, [...unchecked, ...clashes]) : null,
  };
};
