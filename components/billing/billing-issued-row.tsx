"use client";

import { Archive, ArchiveRestore, Loader2, Send } from "lucide-react";
import Link from "next/link";

import { BillingChip } from "@/components/billing/billing-chip";
import { formatCfeNumber, formatMoney, formatShortDate, getDgiChip, getShortCfeLabel } from "@/components/billing/billing-format";
import { BillingInvoiceLabel } from "@/components/billing/billing-invoice-label";
import { BillingPdfDownload, BillingPdfLink } from "@/components/billing/billing-issue-status";
import { BillingDeliveryIcons } from "@/components/billing/delivery/billing-delivery-icons";
import type { DeliveryTab } from "@/components/billing/delivery/billing-delivery-dialog";
import type { IssuedInvoiceRow } from "@/lib/billing/billing-issued-view";
import { cn } from "@/lib/utils";

const actionClass =
  "inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[13px] font-semibold text-ops-text-muted hover:bg-ops-surface-muted hover:text-ops-text focus-visible:ring-2 focus-visible:ring-ops-bamboo/40 focus-visible:outline-none disabled:opacity-60";

// Una fila de "Emitidas" (o de "Archivadas"): receptor, comprobante, total,
// estado ante DGI, nota de crédito, PDF, descargar, enviar y a dónde se mandó
// (53), y archivar o desarchivar (47). Una emitida nunca se borra.
export const BillingIssuedRow = ({
  busy,
  onArchive,
  onDeliveries,
  periodKey,
  row,
}: {
  busy: boolean;
  onArchive: (archived: boolean) => void;
  onDeliveries: (tab: DeliveryTab) => void;
  periodKey: string;
  row: IssuedInvoiceRow;
}) => {
  const dgi = getDgiChip(row.status, row.billerStatus);
  const number = formatCfeNumber(row.series, row.number);
  const archived = row.archivedAt !== null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-ops-border/70 px-3.5 py-3 last:border-b-0 md:px-[18px] md:py-3.5",
        archived && "bg-ops-surface-muted/50"
      )}
    >
      <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-semibold text-ops-text">{row.name}</span>
          <BillingInvoiceLabel periodKey={periodKey} row={row} />
          <CreditChip row={row} />
          <BillingDeliveryIcons deliveries={row.deliveries} onOpen={() => onDeliveries("log")} />
        </div>
        <span className="text-[13px] text-ops-text-muted tabular-nums">
          {getShortCfeLabel(row.cfeType)} {number} · {formatShortDate(row.issueDate)}
        </span>
        {row.detail ? <span className="truncate text-[13px] text-ops-text-muted">{row.detail}</span> : null}
      </div>
      <span className="flex-[0_0_auto] text-right text-[15px] font-semibold tabular-nums text-ops-text md:w-[120px]">
        {row.isNote && row.cfeType % 10 === 2 ? "−" : ""}
        {formatMoney(row.total, row.currency)}
      </span>
      <span className="md:w-[130px]">
        <BillingChip tone={dgi.tone}>{dgi.label}</BillingChip>
      </span>
      <span className="flex flex-wrap items-center gap-1 md:w-[350px] md:flex-nowrap md:justify-end">
        {row.canCredit ? (
          <Link
            className="inline-flex h-8 items-center rounded-lg px-2 text-[13px] font-semibold text-ops-bamboo-strong hover:bg-ops-surface-muted"
            href={`/dashboard/billing/${row.id}/credit-note`}
          >
            Nota de crédito
          </Link>
        ) : null}
        {row.hasPdf ? <BillingPdfLink id={row.id} /> : null}
        {row.hasPdf ? <BillingPdfDownload id={row.id} name={row.name} /> : null}
        {row.canSend ? (
          <button
            aria-label={`Enviar la factura de ${row.name}`}
            className={cn(actionClass, "text-ops-bamboo-strong")}
            onClick={() => onDeliveries("send")}
            title="Enviar por correo o marcar como enviada"
            type="button"
          >
            <Send aria-hidden className="size-3.5" />
            Enviar
          </button>
        ) : null}
        {archived ? (
          <button className={actionClass} disabled={busy} onClick={() => onArchive(false)} type="button">
            {busy ? <Loader2 aria-hidden className="size-3.5 animate-spin" /> : <ArchiveRestore aria-hidden className="size-3.5" />}
            Desarchivar
          </button>
        ) : row.canArchive ? (
          <button
            aria-label={`Archivar la factura de ${row.name}`}
            className={cn(actionClass, "w-8 justify-center px-0")}
            disabled={busy}
            onClick={() => onArchive(true)}
            title="Archivar: sale de la lista y sigue en el resumen"
            type="button"
          >
            {busy ? <Loader2 aria-hidden className="size-3.5 animate-spin" /> : <Archive aria-hidden className="size-4" />}
          </button>
        ) : null}
      </span>
    </div>
  );
};

// "Anulada · NC MA 120424", "NC parcial $ 2.400" o una nota sin confirmar
// (se reintenta desde la página de la nota).
const CreditChip = ({ row }: { row: IssuedInvoiceRow }) => {
  const credit = row.credit;
  if (!credit) return null;
  if (row.annulled) return <BillingChip tone="archived">Anulada{credit.noteLabel ? ` · ${credit.noteLabel}` : ""}</BillingChip>;
  if (credit.unknownNoteId) {
    return (
      <Link href={`/dashboard/billing/${row.id}/credit-note`}>
        <BillingChip tone="warning">NC sin confirmar · Reintentar</BillingChip>
      </Link>
    );
  }
  if (credit.inFlight) return <BillingChip tone="active">NC emitiéndose</BillingChip>;
  return credit.credited > 0 ? <BillingChip tone="neutral">NC parcial {formatMoney(credit.credited, row.currency)}</BillingChip> : null;
};
