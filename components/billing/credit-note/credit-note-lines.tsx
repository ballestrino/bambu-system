"use client";

import { formatMoney } from "@/components/billing/billing-format";
import { AmountInput } from "@/components/billing/billing-inputs";
import type { CreditDraft } from "@/components/billing/credit-note/credit-note-model";
import type { CreditNoteView } from "@/data/billing/credit-note";

const taxLabel = (rate: number) => (rate ? `IVA ${Math.round(rate * 100)} %` : "Sin IVA");

// Las líneas de la factura. Por el total van todas, enteras y bloqueadas; en
// una parcial se pone cuánto acreditar de cada una, sin IVA y sin pasar su
// subtotal ("Todo" la acredita entera).
export const CreditNoteLines = ({
  disabled,
  draft,
  onChange,
  view,
}: {
  disabled: boolean;
  draft: CreditDraft;
  onChange: (patch: Partial<CreditDraft>) => void;
  view: CreditNoteView;
}) => {
  const { currency, lines } = view.invoice;
  const partial = draft.mode === "partial";
  const setAmount = (index: number, amount: number) => onChange({ amounts: { ...draft.amounts, [index]: amount } });

  return (
    <section className="flex flex-col rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-ops-border px-4 py-3.5 md:px-5">
        <h2 className="text-[17px] font-semibold text-ops-text">Ítems</h2>
        <span className="text-xs text-ops-text-muted">
          {partial ? "Monto a acreditar sin IVA" : "Se acreditan todas las líneas enteras"}
        </span>
      </div>
      {lines.length ? (
        <ul className="divide-y divide-ops-border/70">
          {lines.map((line) => (
            <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 md:px-5" key={line.index}>
              <span className="flex min-w-0 flex-[1_1_220px] flex-col gap-0.5">
                <span className="text-[15px] font-medium text-ops-text">{line.concepto}</span>
                <span className="text-xs text-ops-text-muted tabular-nums">
                  {line.cantidad !== 1 ? `${line.cantidad} × · ` : ""}
                  {formatMoney(line.subtotal, currency)} sin IVA · {taxLabel(line.taxRate)}
                </span>
              </span>
              {partial ? (
                <span className="flex items-center gap-2">
                  <button
                    className="h-9 rounded-lg px-2.5 text-[13px] font-semibold text-ops-bamboo-strong hover:bg-ops-surface-muted disabled:opacity-60"
                    disabled={disabled}
                    onClick={() => setAmount(line.index, line.subtotal)}
                    type="button"
                  >
                    Todo
                  </button>
                  <AmountInput
                    amount={draft.amounts[line.index] ?? 0}
                    aria-label={`Acreditar de ${line.concepto}`}
                    currency={currency}
                    disabled={disabled}
                    onCommit={(amount) => setAmount(line.index, amount)}
                  />
                </span>
              ) : (
                <span className="w-28 text-right text-sm font-semibold tabular-nums text-ops-text">
                  {formatMoney(line.subtotal, currency)}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-6 text-sm text-ops-text-muted">Faltan las líneas de la factura: actualizá el mes en Facturación.</p>
      )}
    </section>
  );
};
