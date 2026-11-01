"use client";

import { getMonthName } from "@/components/billing/billing-format";
import { BillingIssuedRow } from "@/components/billing/billing-issued-row";
import { BillingNoMatches } from "@/components/billing/billing-no-matches";
import { useArchiveInvoice } from "@/components/billing/hooks/use-invoice-remove";
import type { IssuedInvoiceRow } from "@/lib/billing/billing-month-view";
import { cn } from "@/lib/utils";

const panelClass = "overflow-hidden rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface";

// "Emitidas": lo que Biller tiene con fecha de emisión en el mes, también lo
// emitido desde su panel, con su estado ante DGI, el PDF y la nota de crédito
// (anulada por cuál, parcial o sin confirmar). "Archivadas" (47 y 48) usa la
// misma lista para desarchivar: siguen en Biller y en el resumen del mes.
export const BillingIssuedList = ({
  filtered,
  mode,
  onClearFilters,
  periodKey,
  rows,
}: {
  filtered: boolean;
  mode: "issued" | "archived";
  onClearFilters: () => void;
  periodKey: string;
  rows: IssuedInvoiceRow[];
}) => {
  const archive = useArchiveInvoice(periodKey);
  const busyId = archive.isPending ? archive.variables?.invoiceId : undefined;

  if (!rows.length) {
    if (filtered) return <BillingNoMatches onClear={onClearFilters} />;
    return (
      <section className={cn(panelClass, "px-6 py-10 text-center text-sm text-ops-text-muted")}>
        {mode === "archived"
          ? `No hay comprobantes archivados en ${getMonthName(periodKey)}.`
          : `No hay comprobantes emitidos sin archivar en ${getMonthName(periodKey)}.`}
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {mode === "archived" ? (
        <p className="px-1 text-xs text-ops-text-muted">Siguen en Biller y en el resumen del mes; corregirlas es una nota de crédito.</p>
      ) : null}
      <section className={panelClass}>
        {rows.map((row) => (
          <BillingIssuedRow
            busy={busyId === row.id}
            key={row.id}
            onArchive={(next) => archive.mutate({ archived: next, invoiceId: row.id })}
            row={row}
          />
        ))}
      </section>
    </div>
  );
};
