"use client";

import { ChevronDown, Trash2 } from "lucide-react";
import { useState } from "react";

import { formatMoney } from "@/components/billing/billing-format";
import { Field, inputClass, SectionTitle, sectionClass } from "@/components/billing/new-invoice/new-invoice-fields";
import { getLineSubtotal } from "@/lib/billing/invoice-totals";
import { emptyNewInvoiceItem, getNewInvoiceItems, type NewInvoiceForm, type NewInvoiceItem } from "@/lib/billing/new-invoice";
import { cn } from "@/lib/utils";

export const INDICATORS = [[16, "16 · IVA mínimo"], [3, "3 · Básica 22%"], [2, "2 · Mínima 10%"], [1, "1 · Exento"]] as const;
const MAX_ITEMS = 40;
const cell = "md:[&>span]:sr-only";
const small = cn(inputClass, "h-10 text-sm");

type Props = { defaultIndicator: number; disabled: boolean; form: NewInvoiceForm; onChange: (patch: Partial<NewInvoiceForm>) => void };

const amountOf = (item: NewInvoiceItem) => {
  const [payload] = getNewInvoiceItems({ items: [item] } as NewInvoiceForm);
  return payload ? getLineSubtotal(payload) : 0;
};

// "Ítems" (diseño B): concepto, cantidad, unidad, precio sin IVA, indicador e
// importe; "Más campos" abre descripción, código, descuento y recargo. En el
// teléfono cada ítem es una tarjeta con sus etiquetas.
export const NewInvoiceItems = ({ defaultIndicator, disabled, form, onChange }: Props) => {
  const [open, setOpen] = useState<number | null>(null);
  const setItem = (index: number, patch: Partial<NewInvoiceItem>) =>
    onChange({ items: form.items.map((item, at) => (at === index ? { ...item, ...patch } : item)) });
  const lastIndicator = form.items.at(-1)?.indicador ?? defaultIndicator;

  return (
    <section className={sectionClass}>
      <SectionTitle aside={<span className="text-[13px] text-ops-text-muted">Precios sin IVA</span>}>Ítems</SectionTitle>
      <div className="hidden grid-cols-[minmax(0,1fr)_60px_56px_100px_148px_84px_76px] gap-2 px-0.5 text-xs font-semibold text-ops-text-muted md:grid">
        <span>Concepto</span><span>Cant.</span><span>Unid.</span><span>Precio</span><span>IVA</span><span className="text-right">Importe</span><span />
      </div>
      <div className="flex flex-col gap-3 md:gap-2">
        {form.items.map((item, index) => (
          <div className="flex flex-col gap-2 rounded-xl border border-ops-border p-3 md:rounded-none md:border-0 md:p-0" key={index}>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-[minmax(0,1fr)_60px_56px_100px_148px_84px_76px] md:items-center">
              <label className={cn("col-span-2 flex flex-col gap-1 text-xs font-semibold md:col-span-1", cell)}>
                <span>Concepto</span>
                <input aria-label={`Concepto del ítem ${index + 1}`} className={small} disabled={disabled} maxLength={80}
                  onChange={(event) => setItem(index, { concepto: event.target.value })} value={item.concepto} />
              </label>
              <label className={cn("flex flex-col gap-1 text-xs font-semibold", cell)}>
                <span>Cantidad</span>
                <input aria-label={`Cantidad del ítem ${index + 1}`} className={cn(small, "text-right tabular-nums")} disabled={disabled} inputMode="decimal"
                  onChange={(event) => setItem(index, { cantidad: event.target.value })} value={item.cantidad} />
              </label>
              <label className={cn("flex flex-col gap-1 text-xs font-semibold", cell)}>
                <span>Unidad</span>
                <input aria-label={`Unidad del ítem ${index + 1}`} className={small} disabled={disabled} maxLength={4} placeholder="—"
                  onChange={(event) => setItem(index, { unidad: event.target.value })} value={item.unidad} />
              </label>
              <label className={cn("flex flex-col gap-1 text-xs font-semibold", cell)}>
                <span>Precio sin IVA</span>
                <input aria-label={`Precio del ítem ${index + 1}`} className={cn(small, "text-right tabular-nums")} disabled={disabled} inputMode="decimal"
                  onChange={(event) => setItem(index, { precio: event.target.value })} placeholder="0" value={item.precio} />
              </label>
              <label className={cn("flex flex-col gap-1 text-xs font-semibold", cell)}>
                <span>IVA</span>
                <select aria-label={`Indicador de IVA del ítem ${index + 1}`} className={small} disabled={disabled}
                  onChange={(event) => setItem(index, { indicador: Number(event.target.value) })} value={item.indicador}>
                  {INDICATORS.some(([value]) => value === item.indicador) ? null : <option value={item.indicador}>{item.indicador}</option>}
                  {INDICATORS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <span className="self-end py-2.5 text-right text-sm font-semibold tabular-nums md:self-center">{formatMoney(amountOf(item), form.currency)}</span>
              <div className="col-span-2 flex justify-end gap-1 md:col-span-1">
                <button aria-expanded={open === index} aria-label={`Más campos del ítem ${index + 1}`} title="Más campos"
                  className="grid size-10 place-items-center rounded-lg text-ops-text-muted hover:bg-ops-surface-muted hover:text-ops-text"
                  onClick={() => setOpen(open === index ? null : index)} type="button">
                  <ChevronDown aria-hidden className={cn("size-4 transition-transform", open === index && "rotate-180")} />
                </button>
                <button aria-label={`Quitar el ítem ${index + 1}`} title="Quitar"
                  className="grid size-10 place-items-center rounded-lg text-ops-text-muted hover:bg-ops-surface-muted hover:text-red-700 disabled:opacity-40"
                  disabled={disabled || form.items.length === 1} onClick={() => onChange({ items: form.items.filter((_, at) => at !== index) })} type="button">
                  <Trash2 aria-hidden className="size-4" />
                </button>
              </div>
            </div>
            {open === index ? (
              <div className="grid grid-cols-1 gap-3 rounded-xl bg-ops-surface-muted/50 p-3 sm:grid-cols-2 md:grid-cols-4">
                <Field className="sm:col-span-2 md:col-span-4" hint="Sale debajo del concepto en el PDF" label="Descripción">
                  <textarea className={cn(inputClass, "h-auto py-2")} disabled={disabled} maxLength={500} rows={2}
                    onChange={(event) => setItem(index, { descripcion: event.target.value })} value={item.descripcion} />
                </Field>
                <Field label="Código">
                  <input className={small} disabled={disabled} maxLength={35} onChange={(event) => setItem(index, { codigo: event.target.value })} value={item.codigo} />
                </Field>
                {(["descuento", "recargo"] as const).map((kind) => (
                  <Field key={kind} label={kind === "descuento" ? "Descuento" : "Recargo"}>
                    <div className="flex gap-1.5">
                      <select aria-label={`Tipo de ${kind}`} className={cn(small, "w-16 shrink-0")} disabled={disabled}
                        onChange={(event) => setItem(index, { [`${kind}Tipo`]: event.target.value === "$" ? "$" : "%" })} value={item[`${kind}Tipo`]}>
                        <option value="%">%</option><option value="$">$</option>
                      </select>
                      <input aria-label={kind === "descuento" ? "Descuento" : "Recargo"} className={cn(small, "text-right tabular-nums")} disabled={disabled}
                        inputMode="decimal" onChange={(event) => setItem(index, { [kind]: event.target.value })} placeholder="0" value={item[kind]} />
                    </div>
                  </Field>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <button
        className="h-11 self-start rounded-[10px] border border-dashed border-ops-border px-3.5 text-sm font-medium text-ops-bamboo-strong hover:bg-ops-surface-muted disabled:opacity-50"
        disabled={disabled || form.items.length >= MAX_ITEMS}
        onClick={() => onChange({ items: [...form.items, emptyNewInvoiceItem(lastIndicator)] })}
        type="button"
      >
        + Agregar ítem
      </button>
    </section>
  );
};
