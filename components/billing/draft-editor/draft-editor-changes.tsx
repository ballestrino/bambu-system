"use client";

import { Bot, User } from "lucide-react";

import { formatMoney } from "@/components/billing/billing-format";
import { SectionTitle, sectionClass } from "@/components/billing/new-invoice/new-invoice-fields";
import type { DraftInvoiceEditorView } from "@/data/billing/draft-invoice";

const timeFormat = new Intl.DateTimeFormat("es-UY", {
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  month: "short",
  timeZone: "America/Montevideo",
});

// Lo que cambió la factura contra la del mes pasado que repite y quién la
// cambió desde que se armó el borrador (el agente o una persona, 49).
export const DraftEditorChanges = ({ data }: { data: DraftInvoiceEditorView }) => (
  <section className={sectionClass}>
    <SectionTitle
      aside={data.source ? <span className="text-[13px] text-ops-text-muted tabular-nums">{data.source.month} · {formatMoney(data.source.subtotal, data.form.currency)} sin IVA</span> : undefined}
    >
      {data.source ? `Contra ${data.source.month}` : "Factura nueva"}
    </SectionTitle>
    {data.source ? (
      data.source.changes.length ? (
        <ul className="flex flex-col gap-1 text-sm text-ops-text">
          {data.source.changes.map((change) => (
            <li className="flex gap-2" key={change}>
              <span aria-hidden className="mt-2 size-1.5 flex-none rounded-full bg-amber-500" />
              {change}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ops-text-muted">Igual que en {data.source.month} (el mes del detalle se movió solo).</p>
      )
    ) : (
      <p className="text-sm text-ops-text-muted">No repite una factura del mes pasado: no hay con qué compararla.</p>
    )}
    <div className="flex flex-col gap-2 border-t border-ops-border/70 pt-3">
      <h3 className="text-[13px] font-semibold text-ops-text">Quién la cambió</h3>
      {data.history.length ? (
        <ul className="flex flex-col gap-2.5">
          {data.history.map((event) => {
            const Icon = event.by === "agent" ? Bot : User;
            const who = event.by === "agent" ? `El agente${event.actor ? ` (con ${event.actor})` : ""}` : event.actor ?? "Una persona";
            return (
              <li className="flex gap-2.5 text-sm" key={event.id}>
                <Icon aria-hidden className="mt-0.5 size-4 flex-none text-ops-text-muted" />
                <span className="flex min-w-0 flex-col">
                  <span className="font-medium text-ops-text">
                    {who} <span className="font-normal text-ops-text-muted">· {timeFormat.format(new Date(event.at))}</span>
                  </span>
                  <span className="text-ops-text-muted">{event.changes.join(" · ") || "Cambios sin detalle"}</span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-ops-text-muted">Nadie la cambió desde que se armó el borrador.</p>
      )}
    </div>
  </section>
);
