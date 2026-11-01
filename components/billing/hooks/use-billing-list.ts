"use client";

import { useMemo, useState } from "react";

import type { BillingMonthView } from "@/data/billing/month";
import {
  countActiveFilters,
  EMPTY_BILLING_FILTERS,
  filterDraftRows,
  filterIssuedRows,
  type BillingFilters,
  type BillingView,
} from "@/lib/billing/billing-list-filters";

// La vista y los filtros de Facturación (48). Viven en la página: siguen al
// cambiar de mes. Filtrar es en el cliente, sobre el mes ya cargado, así que
// se aplica al instante. Las cuentas de cada vista siguen a los filtros.
export const useBillingList = (view: BillingMonthView | undefined) => {
  const [current, setView] = useState<BillingView>("draft");
  const [filters, setFilters] = useState<BillingFilters>(EMPTY_BILLING_FILTERS);

  const lists = useMemo(() => {
    const draftAll = view?.draft?.rows ?? [];
    const draft = filterDraftRows(draftAll, filters);
    const issued = filterIssuedRows(view?.issued ?? [], filters);
    const archived = filterIssuedRows(view?.archived ?? [], filters);
    // Marcadas que el filtro no muestra: "Emitir N" las cuenta igual.
    const hiddenMarked = draftAll.filter((row) => row.selected && row.status === "DRAFT" && !draft.includes(row)).length;
    return { archived, draft, hiddenMarked, issued };
  }, [filters, view]);

  return {
    ...lists,
    activeCount: countActiveFilters(filters, current),
    clearFilters: () => setFilters(EMPTY_BILLING_FILTERS),
    counts: { archived: lists.archived.length, draft: lists.draft.length, issued: lists.issued.length },
    filters,
    setFilters,
    setView,
    view: current,
  };
};

export type BillingList = ReturnType<typeof useBillingList>;
