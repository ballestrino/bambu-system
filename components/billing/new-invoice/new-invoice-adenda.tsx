"use client";

import { Field, inputClass, SectionTitle, sectionClass } from "@/components/billing/new-invoice/new-invoice-fields";
import type { NewInvoiceForm } from "@/lib/billing/new-invoice";
import { cn } from "@/lib/utils";

// "Adenda" (diseño B, "Adenda y envío"): el texto para el cliente que sale en
// el PDF. Lugar de entrega, pagos a terceros y los emails de una sola vez
// quedan afuera (45).
export const NewInvoiceAdenda = ({ disabled, form, onChange }: { disabled: boolean; form: NewInvoiceForm; onChange: (patch: Partial<NewInvoiceForm>) => void }) => (
  <section className={sectionClass}>
    <SectionTitle>Adenda</SectionTitle>
    <Field hint="Opcional · texto para el cliente; sale en el PDF" label="Adenda">
      <textarea
        className={cn(inputClass, "h-auto py-2.5")}
        disabled={disabled}
        maxLength={1000}
        onChange={(event) => onChange({ adenda: event.target.value })}
        placeholder="Servicio de limpieza de noviembre 2026"
        rows={3}
        value={form.adenda}
      />
    </Field>
  </section>
);
