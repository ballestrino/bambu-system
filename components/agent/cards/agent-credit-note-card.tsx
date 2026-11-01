"use client";

import { ArrowUpRight, ReceiptText } from "lucide-react";
import Link from "next/link";

import { AgentCard, CardNote, CardRow } from "@/components/agent/cards/agent-card";
import { formatMoney } from "@/components/agent/format";
import type { BillingCreditNoteCardData } from "@/components/agent/types";

// La nota de crédito que preparó el agente (prepareCreditNote). No tiene
// botón de emitir: abre la página de la nota con todo puesto y ahí la emite
// una persona, con la confirmación (docs/billing.md, regla 1).
export function AgentCreditNoteCard({ data }: { data: BillingCreditNoteCardData }) {
  return (
    <AgentCard
      icon={ReceiptText}
      title={`Nota de crédito para ${data.name} · −${formatMoney(data.total)}`}
      subtitle={`Corrige ${data.corrects} · ${data.mode === "full" ? "Por el total" : "Parcial"}`}
      footer={
        <Link
          className="inline-flex shrink-0 items-center gap-0.5 py-1 text-xs font-semibold text-ops-bamboo-strong underline-offset-4 hover:underline"
          href={data.url}
        >
          Abrir para emitir
          <ArrowUpRight aria-hidden className="size-[13px]" />
        </Link>
      }
    >
      {data.lines.map((line, index) => (
        <CardRow key={`${line.concepto}-${index}`} label={line.concepto} value={formatMoney(line.subtotal)} />
      ))}
      <CardRow label="Sin IVA" value={formatMoney(data.subtotal)} />
      <CardNote>Razón: {data.reason}</CardNote>
      <CardNote>No está emitida: se emite desde su página, con la confirmación.</CardNote>
    </AgentCard>
  );
}
