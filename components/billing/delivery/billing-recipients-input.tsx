"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

import { MAX_DELIVERY_RECIPIENTS, normalizeDeliveryRecipient } from "@/lib/billing/invoice-delivery";

// Los destinatarios del correo como chips: Enter, coma o salir del campo los
// agrega. Debajo, los correos que Biller tiene del cliente para sumarlos con
// un toque (Biller ya les manda la factura; acá es para mandarla a otro).
export const BillingRecipientsInput = ({
  disabled,
  onChange,
  onDraftChange,
  suggestions,
  value,
}: {
  disabled?: boolean;
  onChange: (emails: string[]) => void;
  // El texto a medio escribir: enviar lo suma si es un correo válido.
  onDraftChange: (draft: string) => void;
  suggestions: string[];
  value: string[];
}) => {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const full = value.length >= MAX_DELIVERY_RECIPIENTS;

  const updateDraft = (next: string) => {
    setDraft(next);
    onDraftChange(next);
  };

  const add = (text: string) => {
    const parts = text.split(/[\s,;]+/).filter(Boolean);
    if (!parts.length) return;
    const next = [...value];
    for (const part of parts) {
      const result = normalizeDeliveryRecipient("EMAIL", part);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (!next.includes(result.recipient) && next.length < MAX_DELIVERY_RECIPIENTS) next.push(result.recipient);
    }
    setError(null);
    onChange(next);
    updateDraft("");
  };

  const pending = suggestions.map((email) => email.toLowerCase()).filter((email) => !value.includes(email));

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-[10px] border border-ops-border bg-ops-surface px-2 py-1.5 focus-within:border-ops-bamboo focus-within:ring-3 focus-within:ring-ops-bamboo/20">
        {value.map((email) => (
          <span className="inline-flex h-7 max-w-full items-center gap-1 rounded-md bg-ops-surface-muted pr-1 pl-2 text-[13px] text-ops-text" key={email}>
            <span className="truncate">{email}</span>
            <button
              aria-label={`Quitar ${email}`}
              className="grid size-6 shrink-0 place-items-center rounded text-ops-text-muted hover:text-ops-text"
              disabled={disabled}
              onClick={() => onChange(value.filter((item) => item !== email))}
              type="button"
            >
              <X aria-hidden className="size-3.5" />
            </button>
          </span>
        ))}
        <input
          aria-label="Agregar un correo"
          className="h-8 min-w-[160px] flex-1 bg-transparent px-1 text-[15px] text-ops-text outline-none placeholder:text-ops-text-muted"
          disabled={disabled || full}
          onBlur={() => add(draft)}
          onChange={(event) => updateDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === "," || event.key === ";") {
              event.preventDefault();
              add(draft);
            }
          }}
          placeholder={full ? `Hasta ${MAX_DELIVERY_RECIPIENTS} correos` : "correo@ejemplo.com y Enter"}
          type="email"
          value={draft}
        />
      </div>
      {error ? <p className="text-xs text-red-700 dark:text-red-300" role="alert">{error}</p> : null}
      {pending.length ? (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-ops-text-muted">
          <span>Del cliente en Biller:</span>
          {pending.map((email) => (
            <button
              className="inline-flex h-7 items-center gap-1 rounded-md border border-ops-border px-2 text-[12.5px] text-ops-text hover:bg-ops-surface-muted"
              disabled={disabled || full}
              key={email}
              onClick={() => add(email)}
              type="button"
            >
              <Plus aria-hidden className="size-3" />
              {email}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};
