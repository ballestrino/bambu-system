"use client";

import { Loader2, Search } from "lucide-react";
import { useState } from "react";

import { formatMoney, formatShortDate, getShortCfeLabel } from "@/components/billing/billing-format";
import { inputClass } from "@/components/billing/new-invoice/new-invoice-fields";
import { useBillingClientSearch } from "@/components/billing/hooks/use-new-invoice";
import type { BillingClient } from "@/lib/billing/billing-clients";
import { cn } from "@/lib/utils";

// "Buscar un cliente de Bambú, una factura anterior o un RUT": los receptores
// de las facturas ya emitidas (copiadas de Biller o de Bambú), uno por
// documento con su última factura. Elegir uno llena los datos del cliente.
export const NewInvoiceClientSearch = ({ disabled, onPick }: { disabled: boolean; onPick: (client: BillingClient) => void }) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const search = useBillingClientSearch(query);
  const clients = query.trim().length >= 2 ? search.data ?? [] : [];
  const showList = open && query.trim().length >= 2;

  return (
    <div className="relative">
      <Search aria-hidden className="pointer-events-none absolute top-3.5 left-3 size-4 text-ops-text-muted" />
      <input
        aria-autocomplete="list"
        aria-controls="billing-client-results"
        aria-expanded={showList}
        aria-label="Buscar cliente"
        className={cn(inputClass, "pl-9")}
        disabled={disabled}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar un cliente de una factura anterior, por nombre o RUT"
        role="combobox"
        value={query}
      />
      {search.isFetching ? <Loader2 aria-hidden className="absolute top-3.5 right-3 size-4 animate-spin text-ops-text-muted" /> : null}
      {showList ? (
        <ul
          className="absolute inset-x-0 top-[calc(100%+6px)] z-20 flex max-h-80 flex-col overflow-y-auto rounded-xl border border-ops-border bg-ops-surface p-1 shadow-lg"
          id="billing-client-results"
          role="listbox"
        >
          {clients.length ? (
            clients.map((client) => (
              <li key={client.key} role="presentation">
                <button
                  aria-selected={false}
                  className="flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2.5 text-left hover:bg-ops-surface-muted focus-visible:bg-ops-surface-muted focus-visible:outline-none"
                  onClick={() => { onPick(client); setQuery(""); setOpen(false); }}
                  onMouseDown={(event) => event.preventDefault()}
                  role="option"
                  type="button"
                >
                  <span className="text-sm font-semibold text-ops-text">{client.receiver.razon_social || client.receiver.nombre_fantasia}</span>
                  <span className="text-[12.5px] text-ops-text-muted tabular-nums">
                    {[client.receiver.documento, `${getShortCfeLabel(client.lastCfeType)} ${formatShortDate(client.lastIssueDate)}`, formatMoney(client.lastTotal)]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </button>
              </li>
            ))
          ) : (
            <li className="px-3 py-2.5 text-[13px] text-ops-text-muted">
              {search.isFetching ? "Buscando…" : search.error ? search.error.message : "Sin facturas anteriores con ese nombre o documento. Completá los datos abajo."}
            </li>
          )}
        </ul>
      ) : null}
    </div>
  );
};
