"use client";

import { ArrowUpRight, FileText, Receipt } from "lucide-react";
import { useRouter } from "next/navigation";

import { AgentCard, CardNote, CardRow } from "@/components/agent/cards/agent-card";
import { capitalizeFirst, formatMoney, formatNumber } from "@/components/agent/format";
import type { BillingDraftCardData, BillingSummaryCardData } from "@/components/agent/types";
import { selectOpsMonth } from "@/components/ops/shared/ops-month-provider";
import { BILLING_URL } from "@/lib/agent/billing-rule";

const MONTH_NAME = new Intl.DateTimeFormat("es-UY", { month: "long", timeZone: "UTC" });
const monthName = (monthKey: string) => MONTH_NAME.format(new Date(`${monthKey}-01T00:00:00Z`));

const STATUS = { DRAFT: "Borrador", ISSUING: "Emitiendo", DONE: "Emitido" } as const;

// "Abrir en Facturación": la página abre en el mes del borrador (el selector
// de mes de Operaciones es compartido).
function OpenBilling({ monthKey, children = "Abrir en Facturación" }: { monthKey: string; children?: React.ReactNode }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="inline-flex shrink-0 items-center gap-0.5 py-1 text-xs font-semibold text-ops-bamboo-strong underline-offset-4 hover:underline"
      onClick={() => {
        selectOpsMonth(monthKey);
        router.push(BILLING_URL);
      }}
    >
      {children}
      <ArrowUpRight className="size-[13px]" aria-hidden />
    </button>
  );
}

// El borrador que armó o cambió el agente (draftInvoices). No tiene botón de
// emitir: eso se hace en Facturación, con la cantidad y el total a la vista.
export function AgentBillingDraftCard({ data }: { data: BillingDraftCardData }) {
  const title = `Borrador de ${monthName(data.period)} · ${data.count} ${data.count === 1 ? "factura" : "facturas"} · ${formatMoney(data.total)}`;
  const subtitle = [
    data.created ? "Creado ahora" : STATUS[data.status],
    data.unmarked ? `${data.unmarked} sin marcar` : null,
    data.issued ? `${data.issued} ya emitidas` : null,
  ].filter(Boolean).join(" · ");
  return (
    <AgentCard
      icon={Receipt}
      title={title}
      subtitle={subtitle}
      footer={<OpenBilling monthKey={data.period} />}
    >
      <CardRow label="Sin IVA" value={formatMoney(data.subtotal)} />
      {data.changes.length ? (
        <ul className="space-y-1 text-xs">
          {data.changes.map((change, index) => (
            <li key={`${change.invoiceId ?? "new"}-${index}`} className="flex gap-2">
              <span className="min-w-0 flex-1 truncate font-medium">{change.name}</span>
              <span className="shrink-0 text-right text-ops-text-muted">{change.text}</span>
            </li>
          ))}
        </ul>
      ) : (
        <CardNote>{data.created ? "Repite lo emitido el mes anterior." : "Sin cambios en esta llamada."}</CardNote>
      )}
      <CardNote>Se emite desde Facturación: revisalo y tocá Emitir.</CardNote>
    </AgentCard>
  );
}

// El resumen del mes, como el panel de la página.
export function AgentBillingSummaryCard({ data }: { data: BillingSummaryCardData }) {
  const { current, previous, draft } = data;
  const delta = current.net - previous.net;
  return (
    <AgentCard
      icon={FileText}
      title={`Facturación de ${data.monthLabel}`}
      subtitle={data.environment === "test" ? "Biller test" : null}
      aside={<OpenBilling monthKey={data.month}>Abrir</OpenBilling>}
    >
      <div className="rounded-md bg-muted/40 px-2.5 py-2">
        <p className="text-[11px] text-ops-text-muted">Facturado neto</p>
        <p className="text-base font-semibold tabular-nums">{formatMoney(current.net)}</p>
        <p className="text-[11px] text-ops-text-muted tabular-nums">
          {delta >= 0 ? "+" : "−"}
          {formatMoney(Math.abs(delta))} contra el mes anterior
        </p>
      </div>
      <div className="space-y-0.5 text-xs">
        <CardRow
          label="Facturas emitidas"
          value={`${formatNumber(current.invoiceCount)} (${current.invoicesByType.eFactura} e-Factura · ${current.invoicesByType.eTicket} e-Ticket)`}
        />
        <CardRow label="Notas de crédito" value={`${current.creditNoteCount} · ${formatMoney(current.creditNotesTotal)}`} />
        <CardRow label="Pendientes / rechazadas DGI" value={`${current.pendingCount} / ${current.rejectedCount}`} />
        <CardRow
          label="Borrador"
          value={draft ? `${STATUS[draft.status]} · ${draft.count} marcadas · ${formatMoney(draft.total)}` : "Sin borrador"}
        />
      </div>
      {data.warning && <CardNote tone="warning">{capitalizeFirst(data.warning)}</CardNote>}
    </AgentCard>
  );
}
