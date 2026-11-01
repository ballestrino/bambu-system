"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { getMonthName } from "@/components/billing/billing-format";
import { BillingIssuedRow } from "@/components/billing/billing-issued-row";
import { useArchiveInvoice } from "@/components/billing/hooks/use-invoice-remove";
import type { IssuedInvoiceRow } from "@/lib/billing/billing-month-view";
import { cn } from "@/lib/utils";

const panelClass = "overflow-hidden rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface";

// "Emitidas": lo que Biller tiene con fecha de emisión en el mes, también lo
// emitido desde su panel, con su estado ante DGI, el PDF y la nota de crédito
// (anulada por cuál, parcial o sin confirmar). Lo archivado (47) va aparte,
// plegado, para desarchivar; sigue sumando en el resumen.
export const BillingIssuedList = ({
  archived,
  periodKey,
  rows,
}: {
  archived: IssuedInvoiceRow[];
  periodKey: string;
  rows: IssuedInvoiceRow[];
}) => {
  const archive = useArchiveInvoice(periodKey);
  const [showArchived, setShowArchived] = useState(false);
  const busyId = archive.isPending ? archive.variables?.invoiceId : undefined;
  const renderRow = (row: IssuedInvoiceRow) => (
    <BillingIssuedRow
      busy={busyId === row.id}
      key={row.id}
      onArchive={(next) => archive.mutate({ archived: next, invoiceId: row.id })}
      row={row}
    />
  );

  return (
    <div className="flex flex-col gap-3.5">
      {rows.length ? (
        <section className={panelClass}>{rows.map(renderRow)}</section>
      ) : (
        <section className={cn(panelClass, "px-6 py-10 text-center text-sm text-ops-text-muted")}>
          {archived.length
            ? `No quedan comprobantes sin archivar en ${getMonthName(periodKey)}.`
            : `Todavía no hay comprobantes emitidos en ${getMonthName(periodKey)}.`}
        </section>
      )}
      {archived.length ? (
        <section className={panelClass}>
          <button
            aria-expanded={showArchived}
            className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left md:px-[18px]"
            onClick={() => setShowArchived((value) => !value)}
            type="button"
          >
            <span className="text-[15px] font-semibold text-ops-text">
              Archivadas <span className="font-medium text-ops-text-muted">· {archived.length}</span>
              <span className="block text-xs font-normal text-ops-text-muted">Siguen en Biller y en el resumen del mes.</span>
            </span>
            <ChevronDown aria-hidden className={cn("size-4 text-ops-text-muted transition-transform", showArchived && "rotate-180")} />
          </button>
          {showArchived ? <div className="border-t border-ops-border">{archived.map(renderRow)}</div> : null}
        </section>
      ) : null}
    </div>
  );
};
