"use client";

import { useIsMutating } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import { getDraftTotals, getMarkedRows } from "@/components/billing/billing-draft-model";
import { formatLongDate, formatMoney, getShortCfeLabel, pluralInvoices } from "@/components/billing/billing-format";
import { BillingIssueStatus } from "@/components/billing/billing-issue-status";
import { useIssueBillingBatch } from "@/components/billing/hooks/use-billing-issue";
import { billingQueryKeys } from "@/components/billing/query-keys";
import { OpsFormBody, OpsFormDialogContent, OpsFormFooter, OpsFormHeader } from "@/components/ops/shared/ops-form-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { BillingMonthView } from "@/data/billing/month";
import type { DraftRow } from "@/lib/billing/billing-month-view";

type Draft = NonNullable<BillingMonthView["draft"]>;

const isSettled = (row: DraftRow) => row.status !== "ISSUING";

// "Emitir N" (docs/billing.md, regla 2): lista lo marcado con la cantidad, el
// total y la fecha de emisión. Al confirmar manda lo que se ve; si el borrador
// cambió, el servidor lo rechaza y el diálogo muestra el nuevo. Después
// muestra el avance de cada factura, que llega releyendo el borrador.
export const BillingIssueDialog = ({
  draft,
  onOpenChange,
  open,
  view,
}: {
  draft: Draft;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  view: BillingMonthView;
}) => {
  const issue = useIssueBillingBatch(view.period);
  const editing = useIsMutating({ mutationKey: billingQueryKeys.draftRowMutation }) > 0;
  const [sentIds, setSentIds] = useState<string[] | null>(null);
  const totals = getDraftTotals(draft.rows);
  const issuing = draft.status === "ISSUING";

  // Lo enviado en este diálogo o, si se abrió con una emisión en curso, lo que ya salió del borrador.
  const rows = sentIds
    ? sentIds.flatMap((id) => draft.rows.filter((row) => row.id === id))
    : issuing
      ? draft.rows.filter((row) => row.status !== "DRAFT")
      : getMarkedRows(draft.rows);
  const phase = sentIds || issuing ? (issuing ? "running" : "done") : "confirm";
  const settled = rows.filter(isSettled).length;
  const failed = rows.filter((row) => row.status === "DRAFT" && row.error).length;
  const unknown = rows.filter((row) => row.status === "UNKNOWN").length;
  const canIssue = view.biller.configured && view.biller.issueEnabled && totals.count > 0 && !editing && !issue.isPending;

  const confirm = async () => {
    const ids = getMarkedRows(draft.rows).map((row) => row.id);
    try {
      await issue.mutateAsync({ batchId: draft.id, count: totals.count, total: totals.amount, updatedAt: draft.updatedAt });
      setSentIds(ids);
    } catch {
      // El aviso sale del hook y el mes se relee: el diálogo muestra el borrador nuevo.
    }
  };

  const changeOpen = (next: boolean) => {
    if (!next) setSentIds(null);
    onOpenChange(next);
  };

  return (
    <Dialog onOpenChange={changeOpen} open={open}>
      <OpsFormDialogContent size="md">
        <OpsFormHeader>
          <DialogTitle>
            {phase === "confirm" ? `Emitir ${pluralInvoices(totals.count)}` : phase === "running" ? "Emitiendo…" : "Emisión terminada"}
          </DialogTitle>
          <DialogDescription>
            Fecha de emisión {formatLongDate(view.issueDay)} ·{" "}
            {view.biller.environment === "production" ? "Producción: tienen valor fiscal." : "Biller test: sin valor fiscal."}{" "}
            Biller las manda por mail a los emails guardados de cada cliente.
          </DialogDescription>
        </OpsFormHeader>
        <OpsFormBody className="p-0 sm:px-0">
          <ul className="divide-y divide-ops-border/70">
            {rows.map((row) => (
              <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5 sm:px-6" key={row.id}>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-[15px] font-semibold text-ops-text">{row.name}</span>
                  <span className="text-xs text-ops-text-muted tabular-nums">
                    {getShortCfeLabel(row.cfeType)} · {formatMoney(row.total, row.currency)}
                  </span>
                  {phase !== "confirm" && row.status === "DRAFT" && row.error ? (
                    <span className="text-xs text-red-700 dark:text-red-300">{row.error}</span>
                  ) : null}
                </span>
                {phase === "confirm" ? null : <BillingIssueStatus pdf={phase === "done"} row={row} />}
              </li>
            ))}
          </ul>
        </OpsFormBody>
        <OpsFormFooter className="sm:items-center sm:justify-between">
          <p className="text-sm text-ops-text-muted tabular-nums" role="status">
            {phase === "confirm"
              ? `Total ${formatMoney(totals.amount)}`
              : phase === "running"
                ? `${settled} de ${rows.length} · podés cerrar, sigue emitiendo`
                : [`${rows.length - failed - unknown} emitidas`, failed ? `${failed} no salieron` : "", unknown ? `${unknown} sin confirmar` : ""]
                    .filter(Boolean)
                    .join(" · ")}
          </p>
          {phase === "confirm" ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button onClick={() => changeOpen(false)} variant="outline">Cancelar</Button>
              <Button disabled={!canIssue} onClick={() => void confirm()}>
                {issue.isPending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
                Emitir {totals.count} · {formatMoney(totals.amount)}
              </Button>
            </div>
          ) : (
            <Button onClick={() => changeOpen(false)} variant={phase === "running" ? "outline" : "default"}>
              {phase === "running" ? "Cerrar" : "Listo"}
            </Button>
          )}
        </OpsFormFooter>
      </OpsFormDialogContent>
    </Dialog>
  );
};
