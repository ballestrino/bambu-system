"use client";

import { isDraftRowLocked } from "@/components/billing/billing-draft-model";
import { BillingDraftPhoneRow } from "@/components/billing/billing-draft-phone";
import { BillingDraftRow } from "@/components/billing/billing-draft-row";
import { getMonthName } from "@/components/billing/billing-format";
import { BillingIssueBar, BillingIssueNotice } from "@/components/billing/billing-issue-bar";
import { useDraftRowMutation } from "@/components/billing/hooks/use-billing-draft-mutations";
import type { BillingMonthView } from "@/data/billing/month";
import type { DraftRow } from "@/lib/billing/billing-month-view";

type Draft = NonNullable<BillingMonthView["draft"]>;

// El borrador del mes: "Para emitir" y "No van este mes" (ya facturadas,
// anuladas, notas), y la barra con lo marcado y "Emitir N". Lo emitido queda
// en su fila con la serie, el número y el estado ante DGI.
export const BillingDraft = ({ draft, view }: { draft: Draft; view: BillingMonthView }) => {
  const goRows = draft.rows.filter((row) => !row.skip);
  const skipRows = draft.rows.filter((row) => row.skip);
  const prevMonth = getMonthName(view.previousPeriod);
  const rowProps = { draftStatus: draft.status, periodKey: view.period, prevMonth };

  return (
    <div className="flex flex-col gap-3.5">
      <BillingIssueNotice draft={draft} periodKey={view.period} />
      <div className="hidden flex-col gap-3.5 md:flex">
        <DraftSection count={goRows.length} title="Para emitir">
          {goRows.map((row) => <DraftRowContainer {...rowProps} key={row.id} row={row} variant="desktop" />)}
        </DraftSection>
        {skipRows.length ? (
          <DraftSection count={skipRows.length} title="No van este mes">
            {skipRows.map((row) => <DraftRowContainer {...rowProps} key={row.id} row={row} variant="desktop" />)}
          </DraftSection>
        ) : null}
      </div>

      <section className="overflow-hidden rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface md:hidden">
        {[...goRows, ...skipRows].map((row, index) => (
          <DraftRowContainer {...rowProps} firstSkipped={index === goRows.length && index > 0} key={row.id} row={row} variant="phone" />
        ))}
      </section>
      <p className="text-center text-xs text-ops-text-muted md:hidden">Tocá una factura para cambiar el monto o el detalle.</p>

      <BillingIssueBar draft={draft} view={view} />
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
  draftStatus,
  firstSkipped = false,
  periodKey,
  prevMonth,
  row,
  variant,
}: {
  draftStatus: string;
  firstSkipped?: boolean;
  periodKey: string;
  prevMonth: string;
  row: DraftRow;
  variant: "desktop" | "phone";
}) => {
  const mutation = useDraftRowMutation(periodKey, row.id);
  const props = {
    locked: isDraftRowLocked(row, draftStatus),
    onEditLine: (line: { concepto?: string; index: number; precio?: number }) => mutation.mutate({ lines: [line] }),
    onToggle: () => mutation.mutate({ selected: !row.selected }),
    row,
  };
  return variant === "desktop" ? (
    <BillingDraftRow {...props} />
  ) : (
    <BillingDraftPhoneRow {...props} firstSkipped={firstSkipped} prevMonth={prevMonth} />
  );
};
