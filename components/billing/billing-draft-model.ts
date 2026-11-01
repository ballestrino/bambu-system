import type { OpsTone } from "@/components/ops/shared/ops-theme";
import type { DraftRow } from "@/lib/billing/billing-month-view";
import type { RepeatSkipKind } from "@/lib/billing/draft-repeat";

const SKIP_TONES: Record<RepeatSkipKind, OpsTone> = {
  annulled: "archived",
  billed: "active",
  no_items: "warning",
  note: "archived",
};

// El chip de una fila: por qué no va, o que el precio cambió contra el mes pasado.
export const getDraftRowChip = (row: DraftRow): { label: string; tone: OpsTone } | null =>
  row.skip
    ? { label: row.skip.label, tone: SKIP_TONES[row.skip.kind] }
    : row.priceChanged
      ? { label: "Precio cambiado", tone: "warning" }
      : null;

export const isDraftRowLocked = (row: DraftRow, draftStatus: string) =>
  draftStatus !== "DRAFT" || row.status !== "DRAFT";

// Lo que sale al tocar "Emitir": marcadas y todavía en borrador.
export const getMarkedRows = (rows: DraftRow[]) => rows.filter((row) => row.selected && row.status === "DRAFT");

export const getDraftTotals = (rows: DraftRow[]) => {
  const marked = getMarkedRows(rows);
  return {
    amount: Math.round(marked.reduce((sum, row) => sum + row.total, 0) * 100) / 100,
    count: marked.length,
    eFactura: marked.filter((row) => row.cfeType === 111).length,
    eTicket: marked.filter((row) => row.cfeType === 101).length,
  };
};
