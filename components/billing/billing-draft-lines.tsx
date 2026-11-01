"use client";

import { formatMoney } from "@/components/billing/billing-format";
import { AmountInput, CommitInput, detailInputClass } from "@/components/billing/billing-inputs";
import type { DraftRow } from "@/lib/billing/billing-month-view";
import { BILLING_ITEM_CONCEPT_MAX } from "@/schemas/billing";

export type LineEdit = { concepto?: string; index: number; precio?: number };

// Las líneas de una factura de varias: concepto y precio de cada una.
export const BillingDraftLines = ({
  locked,
  onEdit,
  row,
}: {
  locked: boolean;
  onEdit: (line: LineEdit) => void;
  row: DraftRow;
}) => (
  <div className="ml-11 flex-[1_1_100%] rounded-[10px] border border-ops-border bg-ops-surface-muted/60 px-3 py-1.5">
    {row.lines.map((line, index) => (
      <div className="flex flex-wrap items-center gap-2.5 border-b border-ops-border/70 py-1.5 last:border-b-0" key={index}>
        <CommitInput
          aria-label={`Detalle de la línea ${index + 1} de ${row.name}`}
          className={`${detailInputClass} min-w-0 flex-[1_1_240px]`}
          disabled={locked}
          maxLength={BILLING_ITEM_CONCEPT_MAX}
          onCommit={(concepto) => (concepto ? onEdit({ concepto, index }) : false)}
          value={line.concepto}
        />
        {line.prevSubtotal !== null ? (
          <span className="text-[13px] text-ops-text-muted tabular-nums">{formatMoney(line.prevSubtotal, row.currency)}</span>
        ) : null}
        {line.cantidad !== 1 ? <span className="text-[13px] text-ops-text-muted tabular-nums">{line.cantidad} ×</span> : null}
        <AmountInput
          amount={line.precio}
          aria-label={`Precio de ${line.concepto}`}
          currency={row.currency}
          disabled={locked}
          onCommit={(precio) => onEdit({ index, precio })}
        />
      </div>
    ))}
  </div>
);
