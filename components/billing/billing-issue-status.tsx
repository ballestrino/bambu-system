import type { InvoiceStatus } from "@prisma/client";
import { Download, FileText, Loader2 } from "lucide-react";

import { BillingChip } from "@/components/billing/billing-chip";
import { formatCfeNumber, getDgiChip, getPdfHref } from "@/components/billing/billing-format";
import { cn } from "@/lib/utils";

type IssueState = {
  billerStatus: string | null;
  error?: string | null;
  hasPdf: boolean;
  id: string;
  number: number | null;
  series: string | null;
  status: InvoiceStatus;
};

// El PDF lo pide la ruta de admin a Biller en el momento.
export const BillingPdfLink = ({ className, id, label = "PDF" }: { className?: string; id: string; label?: string }) => (
  <a
    className={cn(
      "inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[13px] font-semibold text-ops-bamboo-strong hover:bg-ops-surface-muted focus-visible:ring-2 focus-visible:ring-ops-bamboo/40 focus-visible:outline-none",
      className
    )}
    href={getPdfHref(id)}
    rel="noopener"
    target="_blank"
  >
    <FileText aria-hidden className="size-3.5" />
    {label}
  </a>
);

// Descargar el PDF con un clic, sin abrirlo (feature 53).
export const BillingPdfDownload = ({ className, id, name }: { className?: string; id: string; name: string }) => (
  <a
    aria-label={`Descargar el PDF de ${name}`}
    className={cn(
      "inline-flex size-8 items-center justify-center rounded-lg text-ops-bamboo-strong hover:bg-ops-surface-muted focus-visible:ring-2 focus-visible:ring-ops-bamboo/40 focus-visible:outline-none",
      className
    )}
    download
    href={getPdfHref(id, { download: true })}
    title="Descargar PDF"
  >
    <Download aria-hidden className="size-4" />
  </a>
);

// Lo que pasó con una factura al emitir: en cola, por qué no salió, o su serie
// y número con el estado ante DGI y el PDF.
export const BillingIssueStatus = ({ pdf = true, row }: { pdf?: boolean; row: IssueState }) => {
  if (row.status === "ISSUING") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ops-text-muted">
        <Loader2 aria-hidden className="size-3.5 animate-spin" />
        Emitiendo
      </span>
    );
  }
  if (row.status === "DRAFT") {
    return row.error ? (
      <span title={row.error}>
        <BillingChip tone="danger">No se emitió</BillingChip>
      </span>
    ) : null;
  }
  const dgi = getDgiChip(row.status, row.billerStatus);
  const number = formatCfeNumber(row.series, row.number);
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {number ? <span className="text-[13px] font-semibold text-ops-text tabular-nums">{number}</span> : null}
      <span title={row.status === "UNKNOWN" ? row.error ?? undefined : undefined}>
        <BillingChip dot tone={dgi.tone}>{dgi.label}</BillingChip>
      </span>
      {pdf && row.hasPdf ? <BillingPdfLink id={row.id} /> : null}
    </span>
  );
};
