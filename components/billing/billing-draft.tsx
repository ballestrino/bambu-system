"use client";

import { useState } from "react";

import { canEditDraftRow, isDraftRowLocked } from "@/components/billing/billing-draft-model";
import { BillingDraftPhoneRow } from "@/components/billing/billing-draft-phone";
import { BillingDraftReview } from "@/components/billing/billing-draft-review";
import { BillingDraftRow } from "@/components/billing/billing-draft-row";
import { getMonthName } from "@/components/billing/billing-format";
import { BillingIssueBar, BillingIssueNotice } from "@/components/billing/billing-issue-bar";
import { BillingNoMatches } from "@/components/billing/billing-no-matches";
import { BillingRepeatNotice } from "@/components/billing/billing-repeat-notice";
import { BillingDraftEditor } from "@/components/billing/draft-editor/billing-draft-editor";
import { useDraftRowMutation } from "@/components/billing/hooks/use-billing-draft-mutations";
import type { BillingMonthView } from "@/data/billing/month";
import type { DraftRow } from "@/lib/billing/billing-month-view";
import { cn } from "@/lib/utils";

type Draft = NonNullable<BillingMonthView["draft"]>;

// El borrador del mes: "Para emitir" y "No van este mes" (ya facturadas,
// anuladas, notas), y la barra con lo marcado y "Emitir N". Lo emitido queda
// en su fila con la serie, el número y el estado ante DGI. Con filtros (48)
// muestra `rows`; la barra y "Emitir N" cuentan siempre todo el borrador.
// Tocar una factura de "Para emitir" la abre en el editor lateral (49), con
// anterior y siguiente sobre las que se ven.
export const BillingDraft = ({
  draft,
  filtered,
  hiddenMarked,
  onClearFilters,
  rows,
  view,
}: {
  draft: Draft;
  filtered: boolean;
  hiddenMarked: number;
  onClearFilters: () => void;
  rows: DraftRow[];
  view: BillingMonthView;
}) => {
  const goRows = rows.filter((row) => !row.skip);
  const skipRows = rows.filter((row) => row.skip);
  const prevMonth = getMonthName(view.previousPeriod);
  const [editorId, setEditorId] = useState<string | null>(null);
  const editable = [...goRows, ...skipRows].filter((row) => canEditDraftRow(row, draft.status)).map((row) => row.id);
  const rowProps = { choices: draft.jobChoices, draftStatus: draft.status, onOpen: setEditorId, periodKey: view.period, prevMonth };

  return (
    <div className="flex flex-col gap-3.5">
      <BillingIssueNotice draft={draft} periodKey={view.period} />
      <BillingRepeatNotice draft={draft} view={view} />
      {draft.status === "DRAFT" ? (
        <div className="flex justify-end">
          <BillingDraftReview disabled={!draft.rows.some((row) => row.status === "DRAFT")} periodKey={view.period} />
        </div>
      ) : null}
      {hiddenMarked ? (
        <p className="rounded-[var(--ops-radius-control)] bg-ops-surface-muted px-3.5 py-2.5 text-[13px] text-ops-text-muted">
          El filtro oculta {hiddenMarked} {hiddenMarked === 1 ? "marcada" : "marcadas"}: &quot;Emitir&quot; las incluye igual.
        </p>
      ) : null}
      {filtered && !rows.length ? <BillingNoMatches onClear={onClearFilters} /> : null}
      <div className={cn("hidden flex-col gap-3.5", (rows.length || !filtered) && "md:flex")}>
        <DraftSection count={goRows.length} title="Para emitir">
          {goRows.map((row) => <DraftRowContainer {...rowProps} key={row.id} row={row} variant="desktop" />)}
        </DraftSection>
        {skipRows.length ? (
          <DraftSection count={skipRows.length} title="No van este mes">
            {skipRows.map((row) => <DraftRowContainer {...rowProps} key={row.id} row={row} variant="desktop" />)}
          </DraftSection>
        ) : null}
      </div>

      {rows.length ? (
        <>
          <section className="overflow-hidden rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface md:hidden">
            {[...goRows, ...skipRows].map((row, index) => (
              <DraftRowContainer {...rowProps} firstSkipped={index === goRows.length && index > 0} key={row.id} row={row} variant="phone" />
            ))}
          </section>
          <p className="text-center text-xs text-ops-text-muted md:hidden">Tocá una factura para cambiar el monto o el detalle.</p>
        </>
      ) : null}

      <BillingIssueBar draft={draft} view={view} />
      <BillingDraftEditor ids={editable} invoiceId={editorId} onNavigate={setEditorId} periodKey={view.period} rows={draft.rows} />
    </div>
  );
};

const DraftSection = ({ children, count, title }: { children: React.ReactNode; count: number; title: string }) => (
  <section className="overflow-hidden rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface">
    <div className="border-b border-ops-border px-[18px] py-3.5">
      <h2 className="text-[15px] font-semibold text-ops-text">
        {title} <span className="font-medium text-ops-text-muted">· {count}</span>
      </h2>
    </div>
    {children}
  </section>
);

// Cada fila tiene su mutación: sus cambios salen de a uno, con el último updatedAt.
const DraftRowContainer = ({
  choices,
  draftStatus,
  firstSkipped = false,
  onOpen,
  periodKey,
  prevMonth,
  row,
  variant,
}: {
  choices: { id: string; name: string }[];
  draftStatus: string;
  firstSkipped?: boolean;
  onOpen: (rowId: string) => void;
  periodKey: string;
  prevMonth: string;
  row: DraftRow;
  variant: "desktop" | "phone";
}) => {
  const mutation = useDraftRowMutation(periodKey, row.id);
  const props = {
    choices,
    locked: isDraftRowLocked(row, draftStatus),
    onEditLine: (line: { concepto?: string; index: number; precio?: number }) => mutation.mutate({ lines: [line] }),
    onOpen: canEditDraftRow(row, draftStatus) ? () => onOpen(row.id) : undefined,
    onToggle: () => mutation.mutate({ selected: !row.selected }),
    periodKey,
    row,
  };
  return variant === "desktop" ? (
    <BillingDraftRow {...props} />
  ) : (
    <BillingDraftPhoneRow {...props} firstSkipped={firstSkipped} prevMonth={prevMonth} />
  );
};
