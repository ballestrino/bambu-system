"use client";

import { Loader2 } from "lucide-react";

import { formatMoney } from "@/components/billing/billing-format";
import { BillingIssueStatus } from "@/components/billing/billing-issue-status";
import { Button } from "@/components/ui/button";
import type { CreditNoteView } from "@/data/billing/credit-note";

// Las notas que ya corrigen esta factura (de Bambú o del panel de Biller).
// Una que quedó sin confirmar se reintenta con el mismo número interno.
export const CreditNoteHistory = ({
  onRetry,
  retrying,
  view,
}: {
  onRetry: (noteId: string) => void;
  retrying: boolean;
  view: CreditNoteView;
}) => {
  if (!view.notes.length) return null;
  return (
    <section className="flex flex-col rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface">
      <h2 className="border-b border-ops-border px-4 py-3 text-[15px] font-semibold text-ops-text md:px-5">
        Notas de esta factura <span className="font-medium text-ops-text-muted">· {view.notes.length}</span>
      </h2>
      <ul className="divide-y divide-ops-border/70">
        {view.notes.map((note) => (
          <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 md:px-5" key={note.id}>
            <span className="flex min-w-0 flex-[1_1_220px] flex-col gap-0.5">
              <span className="text-sm font-semibold text-ops-text">{note.cfeLabel}</span>
              <span className="truncate text-xs text-ops-text-muted">{note.reason ?? "Emitida desde el panel de Biller"}</span>
            </span>
            <span className="text-sm font-semibold tabular-nums">−{formatMoney(note.total, view.invoice.currency)}</span>
            <BillingIssueStatus row={{ ...note, hasPdf: note.status !== "UNKNOWN" && note.status !== "ISSUING" }} />
            {note.status === "UNKNOWN" ? (
              <Button disabled={retrying} onClick={() => onRetry(note.id)} size="sm" variant="outline">
                {retrying ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
                Reintentar
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
};
