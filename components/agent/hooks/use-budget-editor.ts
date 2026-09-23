"use client";

import { useRef, useState } from "react";

import { isSameBudgetDraft } from "@/lib/agent/budget-draft";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

export type BudgetEditorTab = "detail" | "edit";

// Lo que abre el editor: un presupuesto que armó el agente (un cálculo o una
// propuesta de crear), identificado por la llamada a tool que lo armó.
export type BudgetEditorTarget = {
  toolCallId: string;
  source: "calculation" | "proposal";
  title: string;
  values: BudgetFormValues;
  // El cálculo parte de un presupuesto guardado: se guarda como uno nuevo.
  basedOn: string | null;
};

// El presupuesto abierto, con el borrador que tenía al abrirlo.
export type OpenBudgetTarget = BudgetEditorTarget & { draft: BudgetFormValues | null };

// El Sheet del editor y los borradores. Los cambios sin guardar se anotan en
// una ref en cada cambio (sin re-render por tecla) y se publican al cerrar:
// reabrir el Sheet los recupera y la tarjeta avisa que los hay. Un cambio que
// vuelve a los valores de la tarjeta deja de ser borrador.
export const useBudgetEditor = () => {
  const [target, setTarget] = useState<OpenBudgetTarget | null>(null);
  const [tab, setTab] = useState<BudgetEditorTab>("detail");
  const [open, setOpen] = useState(false);
  const [draftIds, setDraftIds] = useState<string[]>([]);
  const drafts = useRef(new Map<string, BudgetFormValues>());
  // El botón que abrió el editor: al cerrarlo el foco vuelve ahí (Radix no lo
  // encuentra solo cuando el editor está encima del Sheet de Presupuestos).
  const opener = useRef<HTMLElement | null>(null);

  const openBudget = (next: BudgetEditorTarget, nextTab: BudgetEditorTab) => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setTarget({ ...next, draft: drafts.current.get(next.toolCallId) ?? null });
    setTab(nextTab);
    setOpen(true);
  };

  const recordDraft = (toolCallId: string, values: BudgetFormValues, base: BudgetFormValues) => {
    if (isSameBudgetDraft(values, base)) drafts.current.delete(toolCallId);
    else drafts.current.set(toolCallId, values);
  };

  const dropDraft = (toolCallId: string) => {
    if (!drafts.current.delete(toolCallId)) return;
    setDraftIds([...drafts.current.keys()]);
  };

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setDraftIds([...drafts.current.keys()]);
  };

  const restoreFocus = (event: Event) => {
    const target = opener.current;
    if (!target?.isConnected) return;
    event.preventDefault();
    target.focus();
  };

  return {
    target,
    tab,
    setTab,
    open,
    onOpenChange,
    restoreFocus,
    openBudget,
    recordDraft,
    dropDraft,
    hasDraft: (toolCallId: string) => draftIds.includes(toolCallId),
  };
};

export type BudgetEditor = ReturnType<typeof useBudgetEditor>;
