"use client";

import { Field, inputClass, Segmented, SectionChip, SectionTitle, sectionClass } from "@/components/billing/new-invoice/new-invoice-fields";
import { PAYMENT_FORM } from "@/lib/billing/draft-repeat";
import type { NewInvoiceForm } from "@/lib/billing/new-invoice";

type Props = { disabled: boolean; form: NewInvoiceForm; onChange: (patch: Partial<NewInvoiceForm>) => void; today: string };

const DAY_MS = 24 * 60 * 60 * 1000;
// Al pasar a crédito el vencimiento arranca a 10 días de la emisión (se puede cambiar).
const DEFAULT_CREDIT_DAYS = 10;
const addDays = (day: string, days: number) => new Date(new Date(`${day}T00:00:00Z`).getTime() + days * DAY_MS).toISOString().slice(0, 10);

const dueHint = (form: NewInvoiceForm) => {
  if (!form.dueDate || !form.issueDate) return undefined;
  const days = Math.round((new Date(`${form.dueDate}T00:00:00Z`).getTime() - new Date(`${form.issueDate}T00:00:00Z`).getTime()) / DAY_MS);
  return days >= 0 ? `${days} días` : undefined;
};

// "Comprobante" (diseño B): tipo, fecha de emisión, forma de pago con su
// vencimiento, moneda y orden de compra. Las notas de crédito salen de
// "Emitidas"; las de débito y los precios con IVA quedan afuera (45).
export const NewInvoiceVoucher = ({ disabled, form, onChange, today }: Props) => (
  <section className={sectionClass}>
    <SectionTitle aside={<SectionChip>Código DGI {form.cfeType}</SectionChip>}>Comprobante</SectionTitle>
    <Segmented
      disabled={disabled}
      label="Tipo de comprobante"
      onChange={(cfeType) => onChange({ cfeType, ...(cfeType === 111 ? { consumer: false, documentType: 2 } : {}) })}
      options={[{ label: "e-Factura", value: 111 as const }, { label: "e-Ticket", value: 101 as const }]}
      value={form.cfeType}
    />
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
      <Field label="Fecha de emisión">
        <input
          className={inputClass}
          disabled={disabled}
          max={addDays(today, 59)}
          onChange={(event) => onChange({ issueDate: event.target.value })}
          type="date"
          value={form.issueDate}
        />
      </Field>
      <div className="flex min-w-0 flex-col gap-1.5 text-[13px] font-semibold text-ops-text">
        <span>Forma de pago</span>
        <Segmented
          disabled={disabled}
          label="Forma de pago"
          onChange={(paymentForm) =>
            onChange({ paymentForm, ...(paymentForm === PAYMENT_FORM.CREDIT && !form.dueDate && form.issueDate ? { dueDate: addDays(form.issueDate, DEFAULT_CREDIT_DAYS) } : {}) })
          }
          options={[{ label: "Contado", value: PAYMENT_FORM.CASH as number }, { label: "Crédito", value: PAYMENT_FORM.CREDIT as number }]}
          value={form.paymentForm}
        />
      </div>
      {form.paymentForm === PAYMENT_FORM.CREDIT ? (
        <Field hint={dueHint(form)} label="Vencimiento">
          <input
            className={inputClass}
            disabled={disabled}
            min={form.issueDate}
            onChange={(event) => onChange({ dueDate: event.target.value })}
            type="date"
            value={form.dueDate}
          />
        </Field>
      ) : null}
      <Field label="Moneda">
        <select
          className={inputClass}
          disabled={disabled}
          onChange={(event) => onChange({ currency: event.target.value === "USD" ? "USD" : "UYU" })}
          value={form.currency}
        >
          <option value="UYU">UYU · Peso uruguayo</option>
          <option value="USD">USD · Dólar</option>
        </select>
      </Field>
      <Field hint="Opcional" label="Orden de compra">
        <input
          className={inputClass}
          disabled={disabled}
          maxLength={50}
          onChange={(event) => onChange({ purchaseOrder: event.target.value })}
          value={form.purchaseOrder}
        />
      </Field>
    </div>
    {form.currency === "USD" ? (
      <p className="text-[12.5px] text-ops-text-muted">En dólares Biller toma la tasa del cierre anterior a la fecha de emisión.</p>
    ) : null}
  </section>
);
