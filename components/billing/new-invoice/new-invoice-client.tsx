"use client";

import { ChevronDown, Loader2, X } from "lucide-react";
import { useState } from "react";

import { useRutLookup } from "@/components/billing/hooks/use-new-invoice";
import { NewInvoiceClientSearch } from "@/components/billing/new-invoice/new-invoice-client-search";
import { Checkbox, Field, inputClass, SectionChip, SectionTitle, sectionClass } from "@/components/billing/new-invoice/new-invoice-fields";
import type { BillingClient } from "@/lib/billing/billing-clients";
import { RUT_DOCUMENT, type NewInvoiceForm } from "@/lib/billing/new-invoice";
import { receiverToNewInvoiceForm } from "@/lib/billing/new-invoice-agent-fill";
import { cn } from "@/lib/utils";

const DOCUMENT_TYPES = [[2, "RUT"], [3, "CI"], [4, "Otro"], [5, "Pasaporte"], [6, "DNI"], [7, "NIFE"]] as const;
const DEPARTMENTS = ["Artigas", "Canelones", "Cerro Largo", "Colonia", "Durazno", "Flores", "Florida", "Lavalleja", "Maldonado", "Montevideo",
  "Paysandú", "Río Negro", "Rivera", "Rocha", "Salto", "San José", "Soriano", "Tacuarembó", "Treinta y Tres"];
const COUNTRIES = [["UY", "Uruguay"], ["AR", "Argentina"], ["BR", "Brasil"], ["PY", "Paraguay"], ["CL", "Chile"], ["US", "Estados Unidos"]] as const;

type Props = { disabled: boolean; form: NewInvoiceForm; onChange: (patch: Partial<NewInvoiceForm>) => void };

const fromClient = ({ receiver }: BillingClient) => receiverToNewInvoiceForm(receiver);

// "Cliente" (diseño B): buscar uno de una factura anterior o consultar un RUT
// a DGI, consumidor final en un e-Ticket, y los datos que pide emitir. En el
// teléfono la dirección y los emails van plegados.
export const NewInvoiceClient = ({ disabled, form, onChange }: Props) => {
  const [source, setSource] = useState<string | null>(null);
  const [addressOpen, setAddressOpen] = useState(false);
  const [emailDraft, setEmailDraft] = useState("");
  const lookup = useRutLookup();
  const isRut = form.documentType === RUT_DOCUMENT;
  const consumer = form.cfeType === 101 && form.consumer;
  const locked = disabled || lookup.isPending;

  const consultDgi = async () => {
    const data = await lookup.mutateAsync(form.document).catch(() => null);
    if (!data) return;
    onChange({ address: data.address ?? form.address, city: data.city ?? form.city, department: data.department ?? form.department, name: data.name ?? form.name });
    setSource("Datos de DGI");
  };
  const addEmail = () => {
    const email = emailDraft.trim().replace(/[,;]$/, "");
    if (email && !form.emails.includes(email)) onChange({ emails: [...form.emails, email] });
    setEmailDraft("");
  };

  return (
    <section className={sectionClass}>
      <SectionTitle aside={source ? <SectionChip>{source}</SectionChip> : undefined}>Cliente</SectionTitle>
      {!consumer ? <NewInvoiceClientSearch disabled={locked} onPick={(client) => { onChange(fromClient(client)); setSource("De una factura anterior"); }} /> : null}
      {form.cfeType === 101 ? (
        <Checkbox checked={form.consumer} label="Consumidor final, sin datos del cliente" onChange={(next) => onChange({ consumer: next })} />
      ) : null}
      {consumer ? null : (
        <>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Tipo de documento">
              <select
                className={inputClass}
                disabled={locked || form.cfeType === 111}
                onChange={(event) => onChange({ documentType: Number(event.target.value) })}
                value={form.documentType}
              >
                {DOCUMENT_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
            <Field label="Documento">
              <div className="flex gap-2">
                <input className={cn(inputClass, "tabular-nums")} disabled={locked} inputMode="numeric" maxLength={20}
                  onChange={(event) => onChange({ document: event.target.value })} value={form.document} />
                {isRut ? (
                  <button
                    className="h-11 shrink-0 rounded-[10px] border border-ops-border bg-ops-surface px-3 text-sm font-medium text-ops-text hover:bg-ops-surface-muted disabled:opacity-60"
                    disabled={locked || form.document.replace(/\D/g, "").length !== 12}
                    onClick={() => void consultDgi()}
                    type="button"
                  >
                    {lookup.isPending ? <Loader2 aria-label="Consultando" className="size-4 animate-spin" /> : "Consultar DGI"}
                  </button>
                ) : null}
              </div>
            </Field>
            <Field label={isRut || form.documentType === 7 ? "Razón social" : "Nombre"}>
              <input className={inputClass} disabled={locked} maxLength={70} onChange={(event) => onChange({ name: event.target.value })} value={form.name} />
            </Field>
            <Field hint="Opcional" label="Nombre de fantasía">
              <input className={inputClass} disabled={locked} maxLength={30} onChange={(event) => onChange({ tradeName: event.target.value })} value={form.tradeName} />
            </Field>
          </div>
          <button
            aria-expanded={addressOpen}
            className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-ops-border px-3.5 text-left md:hidden"
            onClick={() => setAddressOpen(!addressOpen)}
            type="button"
          >
            <span className="flex flex-col">
              <span className="text-sm font-semibold text-ops-text">Dirección y emails</span>
              <span className="text-[12.5px] text-ops-text-muted">{[form.address, form.city, form.emails.length ? `${form.emails.length} ${form.emails.length === 1 ? "email" : "emails"}` : ""].filter(Boolean).join(" · ") || "Opcional"}</span>
            </span>
            <ChevronDown aria-hidden className={cn("size-4 text-ops-text-muted transition-transform", addressOpen && "rotate-180")} />
          </button>
          <div className={cn("flex-col gap-3.5 md:flex", addressOpen ? "flex" : "hidden")}>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Field className="sm:col-span-2" label="Dirección">
                <input className={inputClass} disabled={locked} maxLength={70} onChange={(event) => onChange({ address: event.target.value })} value={form.address} />
              </Field>
              <Field label="Ciudad">
                <input className={inputClass} disabled={locked} maxLength={30} onChange={(event) => onChange({ city: event.target.value })} value={form.city} />
              </Field>
              <Field label="Departamento">
                <select className={inputClass} disabled={locked} onChange={(event) => onChange({ department: event.target.value })} value={form.department}>
                  {DEPARTMENTS.includes(form.department) || !form.department ? null : <option value={form.department}>{form.department}</option>}
                  {DEPARTMENTS.map((department) => <option key={department}>{department}</option>)}
                </select>
              </Field>
              <Field label="País">
                <select className={inputClass} disabled={locked} onChange={(event) => onChange({ country: event.target.value })} value={form.country}>
                  {COUNTRIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
            </div>
            <div className="flex flex-col gap-1.5 text-[13px] font-semibold text-ops-text">
              <span>Emails del cliente <span className="font-normal text-ops-text-muted">· Biller les manda el PDF y los suma a los que ya tiene</span></span>
              <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-[10px] border border-ops-border bg-ops-surface px-2 py-1.5">
                {form.emails.map((email) => (
                  <span className="inline-flex h-7 items-center gap-1 rounded-md bg-ops-surface-muted pr-1 pl-2 text-[13px] font-normal" key={email}>
                    {email}
                    <button aria-label={`Quitar ${email}`} className="grid size-6 place-items-center rounded text-ops-text-muted hover:text-ops-text"
                      onClick={() => onChange({ emails: form.emails.filter((item) => item !== email) })} type="button">
                      <X aria-hidden className="size-3.5" />
                    </button>
                  </span>
                ))}
                <input
                  aria-label="Agregar email"
                  className="h-8 min-w-[180px] flex-1 bg-transparent px-1 text-[15px] font-normal outline-none"
                  disabled={locked}
                  onBlur={addEmail}
                  onChange={(event) => setEmailDraft(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === ",") { event.preventDefault(); addEmail(); } }}
                  placeholder="Agregar email y Enter"
                  type="email"
                  value={emailDraft}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
};
