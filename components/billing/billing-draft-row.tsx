"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";

import { BillingChip } from "@/components/billing/billing-chip";
import { getDraftRowChip } from "@/components/billing/billing-draft-model";
import { BillingDraftLines, type LineEdit } from "@/components/billing/billing-draft-lines";
import { formatMoney, getShortCfeLabel } from "@/components/billing/billing-format";
import { AmountInput, CommitInput, detailInputClass } from "@/components/billing/billing-inputs";
import { BillingIssueStatus } from "@/components/billing/billing-issue-status";
import { JobsCheckbox } from "@/components/ops/jobs/jobs-checkbox";
import type { DraftRow } from "@/lib/billing/billing-month-view";
import { cn } from "@/lib/utils";
import { BILLING_ITEM_CONCEPT_MAX } from "@/schemas/billing";

export type DraftRowProps = {
  locked: boolean;
  onEditLine: (line: LineEdit) => void;
  onToggle: () => void;
  row: DraftRow;
};

// Una fila del borrador en escritorio: casilla, receptor y tipo, detalle
// editable, monto anterior → monto nuevo y la forma de pago. Una factura de
// varias líneas abre sus líneas.
export const BillingDraftRow = ({ locked, onEditLine, onToggle, row }: DraftRowProps) => {
  const [open, setOpen] = useState(false);
  const chip = getDraftRowChip(row);
  const single = row.lines.length === 1;
  const line = row.lines[0];

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-ops-border/70 py-2.5 pr-[18px] pl-2 last:border-b-0",
        !row.selected && "bg-ops-surface-muted/50"
      )}
    >
      <label className="flex size-11 flex-none cursor-pointer items-center justify-center">
        <JobsCheckbox checked={row.selected} disabled={locked} label={`Emitir a ${row.name}`} onCheckedChange={onToggle} />
      </label>
      <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-semibold text-ops-text">{row.name}</span>
          <BillingChip className="h-5 text-[11px]">{getShortCfeLabel(row.cfeType)}</BillingChip>
          {row.status !== "DRAFT" || row.error ? (
            <BillingIssueStatus row={row} />
          ) : chip ? (
            <BillingChip tone={chip.tone}>{chip.label}</BillingChip>
          ) : null}
        </div>
        {row.status === "DRAFT" && row.error ? <span className="text-xs text-red-700 dark:text-red-300">{row.error}</span> : null}
        {single && line ? (
          <CommitInput
            aria-label={`Detalle de ${row.name}`}
            className={detailInputClass}
            disabled={locked}
            maxLength={BILLING_ITEM_CONCEPT_MAX}
            onCommit={(concepto) => (concepto ? onEditLine({ concepto, index: 0 }) : false)}
            value={line.concepto}
          />
        ) : (
          <span className="truncate py-1 text-[13px] text-ops-text-muted">
            {row.lines.length ? `${row.lines.length} líneas · ${row.lines.map((item) => item.concepto).join(", ")}` : "Sin ítems"}
          </span>
        )}
      </div>
      <div className="flex flex-none items-center gap-2.5 tabular-nums">
        <span className={cn("text-[13px] text-ops-text-muted", row.priceChanged && "line-through")}>
          {row.prevSubtotal === null ? "—" : formatMoney(row.prevSubtotal, row.currency)}
        </span>
        <ArrowRight aria-hidden className="size-3.5 text-ops-text-muted/70" />
        {single && line ? (
          <>
            {line.cantidad !== 1 ? <span className="text-[13px] text-ops-text-muted">{line.cantidad} ×</span> : null}
            <AmountInput
              amount={line.precio}
              aria-label={`Monto de ${row.name}`}
              currency={row.currency}
              disabled={locked}
              onCommit={(precio) => onEditLine({ index: 0, precio })}
            />
          </>
        ) : (
          <button
            aria-expanded={open}
            aria-label={`Editar las líneas de ${row.name}`}
            className="h-[38px] w-28 rounded-[10px] border border-dashed border-[#b9c8b5] bg-ops-surface-muted/60 text-sm font-semibold text-ops-text tabular-nums hover:bg-ops-surface-muted disabled:opacity-60"
            disabled={!row.lines.length}
            onClick={() => setOpen((value) => !value)}
            type="button"
          >
            {formatMoney(row.subtotal, row.currency)}
          </button>
        )}
      </div>
      <div className="flex flex-[0_0_150px] flex-col items-end text-[13px] text-ops-text-muted">
        <span>{row.paymentLabel}</span>
        {row.taxed ? <span className="text-xs">+ IVA · {formatMoney(row.total, row.currency)}</span> : null}
      </div>
      {open && !single ? <BillingDraftLines locked={locked} onEdit={onEditLine} row={row} /> : null}
    </div>
  );
};
