"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { BillingDeleteDraft } from "@/components/billing/billing-delete-draft";
import { formatMoney } from "@/components/billing/billing-format";
import { DraftEditorChanges } from "@/components/billing/draft-editor/draft-editor-changes";
import { useDraftEditorMutations } from "@/components/billing/hooks/use-draft-editor";
import { NewInvoiceAdenda } from "@/components/billing/new-invoice/new-invoice-adenda";
import { NewInvoiceClient } from "@/components/billing/new-invoice/new-invoice-client";
import { NewInvoiceItems } from "@/components/billing/new-invoice/new-invoice-items";
import { NewInvoiceVoucher } from "@/components/billing/new-invoice/new-invoice-voucher";
import type { DraftInvoiceEditorView } from "@/data/billing/draft-invoice";
import type { DraftRow } from "@/lib/billing/billing-month-view";
import { getNewInvoiceProblems, getNewInvoiceTotals, type NewInvoiceForm } from "@/lib/billing/new-invoice";

const secondaryClass =
  "inline-flex h-11 items-center justify-center rounded-[10px] border border-ops-border bg-ops-surface px-3.5 text-sm font-medium text-ops-text hover:bg-ops-surface-muted disabled:opacity-60";

// El cuerpo del editor lateral (49): lo que cambió contra el mes pasado y
// quién la cambió, el formulario de Nueva factura y el pie con el total, lo
// que falta, Guardar, Quitar del borrador y Borrar. Se monta de nuevo con
// cada versión de la factura (key con su updatedAt): después de guardar, o
// cuando alguien la cambió mientras tanto, muestra la versión nueva.
export const DraftEditorForm = ({
  data,
  onDeleted,
  onDirtyChange,
  periodKey,
  row,
}: {
  data: DraftInvoiceEditorView;
  onDeleted: () => void;
  onDirtyChange: (dirty: boolean) => void;
  periodKey: string;
  row: DraftRow | null;
}) => {
  const [form, setForm] = useState<NewInvoiceForm>(data.form);
  const { save, select } = useDraftEditorMutations(periodKey, data.id);
  const busy = save.isPending || select.isPending;
  const locked = Boolean(data.block) || busy;
  const dirty = JSON.stringify(form) !== JSON.stringify(data.form);
  const problems = getNewInvoiceProblems(form, data.today);
  const totals = getNewInvoiceTotals(form);
  const change = (patch: Partial<NewInvoiceForm>) => setForm((current) => ({ ...current, ...patch }));

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-5">
        {data.block ? (
          <p className="flex items-start gap-2 rounded-[var(--ops-radius-control)] bg-ops-surface-muted px-3.5 py-2.5 text-sm text-ops-text-muted" role="status">
            <AlertTriangle aria-hidden className="mt-0.5 size-4 flex-none" />
            {data.block}
          </p>
        ) : null}
        {data.issueError ? <p className="text-sm text-red-700 dark:text-red-300">No salió: {data.issueError}</p> : null}
        <DraftEditorChanges data={data} />
        <NewInvoiceVoucher disabled={locked} form={form} onChange={change} today={data.today} />
        <NewInvoiceClient disabled={locked} form={form} onChange={change} />
        <NewInvoiceItems defaultIndicator={form.items[0]?.indicador ?? 3} disabled={locked} form={form} onChange={change} />
        <NewInvoiceAdenda disabled={locked} form={form} onChange={change} />
      </div>
      <footer className="flex flex-none flex-col gap-2.5 border-t border-ops-border bg-ops-surface px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-5">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="min-w-0 truncate text-ops-text-muted">
            {dirty && problems.length ? problems[0] : data.selected ? "Marcada para emitir" : "Desmarcada: no se emite este mes"}
          </span>
          <strong className="whitespace-nowrap tabular-nums text-ops-text">
            {formatMoney(totals.total, form.currency)}
            {totals.taxes.length ? <span className="font-normal text-ops-text-muted"> con IVA</span> : null}
          </strong>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {data.block ? null : (
            <>
              {row ? <BillingDeleteDraft onDeleted={onDeleted} periodKey={periodKey} row={row} variant="icon" /> : null}
              <button
                className={secondaryClass}
                disabled={busy || dirty}
                onClick={() => select.mutate({ selected: !data.selected, updatedAt: data.updatedAt })}
                title={dirty ? "Guardá o descartá los cambios primero" : undefined}
                type="button"
              >
                {select.isPending ? <Loader2 aria-hidden className="mr-1.5 size-4 animate-spin" /> : null}
                {data.selected ? "Quitar del borrador" : "Volver a marcar"}
              </button>
            </>
          )}
          <span className="flex-1" />
          {dirty ? (
            <button className={secondaryClass} disabled={busy} onClick={() => setForm(data.form)} type="button">
              Descartar
            </button>
          ) : null}
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-ops-bamboo-strong px-5 text-[15px] font-semibold text-white hover:bg-ops-bamboo-strong/90 disabled:opacity-60 dark:text-ops-canvas"
            disabled={locked || !dirty || problems.length > 0}
            onClick={() => save.mutate({ form, updatedAt: data.updatedAt })}
            title={problems[0]}
            type="button"
          >
            {save.isPending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
            Guardar
          </button>
        </div>
      </footer>
    </>
  );
};
