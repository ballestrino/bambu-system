"use client";

import { FilePenLine } from "lucide-react";

import { AgentCard, CardNote, CardRow } from "@/components/agent/cards/agent-card";
import type { InvoiceFormCardData } from "@/components/agent/types";
import { formatInvoiceMoney } from "@/lib/billing/new-invoice-agent-context";

// Lo que completó el agente en Nueva factura (fillInvoiceForm, feature 46).
// No tiene botón de emitir: los campos ya están en el formulario y la persona
// la emite (o la guarda en el borrador) con los botones de la página.
export function AgentInvoiceFormCard({ data }: { data: InvoiceFormCardData }) {
  const money = (amount: number) => formatInvoiceMoney(amount, data.currency);
  return (
    <AgentCard
      icon={FilePenLine}
      title={`${data.cfe}${data.client ? ` para ${data.client}` : ""} · ${money(data.total)}`}
      subtitle={data.changes.length ? "Completada en el formulario" : "Sin cambios en el formulario"}
    >
      {data.changes.length ? (
        <ul className="space-y-1 text-xs">
          {data.changes.map((change, index) => (
            <li key={`${change}-${index}`} className="text-ops-text">{change}</li>
          ))}
        </ul>
      ) : null}
      <CardRow label="Sin IVA" value={money(data.subtotal)} />
      {data.taxes.map((tax) => (
        <CardRow key={tax.rate} label={`IVA ${Math.round(tax.rate * 100)} %`} value={money(tax.amount)} />
      ))}
      <CardRow label="Total" strong value={money(data.total)} />
      {data.problems.length ? (
        <CardNote tone="warning">Falta para emitir: {data.problems.join(" ")}</CardNote>
      ) : null}
      <CardNote>No está emitida: revisala y emitila con Emitir ahora, o guardala en el borrador.</CardNote>
    </AgentCard>
  );
}
