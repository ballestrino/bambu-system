"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { BillingChip } from "@/components/billing/billing-chip";
import { useNewInvoice } from "@/components/billing/hooks/use-new-invoice";
import { NewInvoiceAdenda } from "@/components/billing/new-invoice/new-invoice-adenda";
import { NewInvoiceAgent } from "@/components/billing/new-invoice/new-invoice-agent";
import { NewInvoiceClient } from "@/components/billing/new-invoice/new-invoice-client";
import { NewInvoiceDialog, type NewInvoiceDialogResult } from "@/components/billing/new-invoice/new-invoice-dialog";
import { NewInvoiceItems } from "@/components/billing/new-invoice/new-invoice-items";
import { NewInvoiceSummary } from "@/components/billing/new-invoice/new-invoice-summary";
import { NewInvoiceVoucher } from "@/components/billing/new-invoice/new-invoice-voucher";
import { OpsPageShell, selectOpsMonth } from "@/components/ops/shared";
import type { NewInvoiceView } from "@/data/billing/new-invoice";
import { getNewInvoiceProblems, getNewInvoiceTotals, newInvoiceDefaults, type NewInvoiceForm } from "@/lib/billing/new-invoice";
import { cn } from "@/lib/utils";

const BILLING_HREF = "/dashboard/billing";

// Un id por factura que se arma: el número interno sale de acá, así emitir dos
// veces (o reintentar) encuentra la misma factura.
const newRequestId = () => crypto.randomUUID().replace(/-/g, "");

// Nueva factura (docs/billing.md, feature 45, diseño B): el formulario entero
// con el resumen fijo a la derecha (abajo en el teléfono). Se emite en el
// momento o se guarda en el borrador del mes para emitirla con las demás.
export const NewInvoicePage = ({ view }: { view: NewInvoiceView }) => {
  const router = useRouter();
  const [form, setForm] = useState<NewInvoiceForm>(() => newInvoiceDefaults(view.issueDay, view.indicator));
  const [requestId] = useState(newRequestId);
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<NewInvoiceDialogResult>(null);
  const { issue, save } = useNewInvoice();
  const problems = getNewInvoiceProblems(form, view.issueDay);
  const issued = Boolean(result?.success);
  const busy = issue.isPending || save.isPending || issued;
  const change = (patch: Partial<NewInvoiceForm>) => setForm((current) => ({ ...current, ...patch }));
  const request = { form, month: view.month, requestId };
  // El agente (feature 46) lee el formulario al enviar cada mensaje y lo que
  // completa entra con los mismos cambios que la página. En escritorio, con
  // el panel abierto, el formulario le deja lugar a la derecha.
  const [agentOpen, setAgentOpen] = useState(false);
  const formRef = useRef(form);
  useEffect(() => {
    formRef.current = form;
  });
  const applyAgentPatch = (patch: Partial<NewInvoiceForm>) => {
    if (busy) return void toast.info("La factura ya se está emitiendo o guardando: el agente no la cambia.");
    if (Object.keys(patch).length) change(patch);
  };

  // Volver a Facturación abre el mes del borrador (el selector es compartido).
  useEffect(() => selectOpsMonth(view.month), [view.month]);

  const confirm = async () => {
    try {
      const issuedResult = await issue.mutateAsync(request);
      // Volver a Facturación abre el mes de la factura, que puede no ser el del borrador.
      if (issuedResult.success) selectOpsMonth(form.issueDate.slice(0, 7));
      setResult(issuedResult);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : "No se pudo emitir la factura" });
    }
  };
  const saveDraft = async () => {
    const saved = await save.mutateAsync(request).catch(() => null);
    if (!saved?.success) return;
    toast.success(saved.success);
    router.push(BILLING_HREF);
  };

  return (
    <OpsPageShell className={cn("gap-4 md:gap-5", agentOpen && "lg:pr-[416px]")}>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <nav aria-label="Ubicación" className="text-[13px] text-ops-text-muted">
            <Link className="hover:underline" href={BILLING_HREF}>Facturación</Link> / {view.monthLabel}
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ops-text md:text-[28px]">Nueva factura</h1>
            {view.biller.configured ? (
              <BillingChip dot tone={view.biller.environment === "production" ? "success" : "warning"}>
                {view.biller.environment === "production" ? "Producción" : "Test"}
              </BillingChip>
            ) : (
              <BillingChip tone="danger">Biller sin configurar</BillingChip>
            )}
          </div>
          <p className="text-sm text-ops-text-muted">
            Emitila ahora o guardala en el borrador de {view.monthName} para emitirla con las demás.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NewInvoiceAgent getForm={() => formRef.current} month={view.month} onOpenChange={setAgentOpen} onPatch={applyAgentPatch} />
          <Link
            className="flex h-10 items-center rounded-[10px] border border-ops-border bg-ops-surface px-3.5 text-sm font-medium text-ops-text hover:bg-ops-surface-muted"
            href={BILLING_HREF}
          >
            Cancelar
          </Link>
        </div>
      </header>
      <div className={cn("flex flex-col gap-5 lg:items-start", agentOpen ? "2xl:flex-row" : "lg:flex-row")}>
        <div className="flex min-w-0 flex-[999_1_600px] flex-col gap-4">
          <NewInvoiceVoucher disabled={busy} form={form} onChange={change} today={view.issueDay} />
          <NewInvoiceClient disabled={busy} form={form} onChange={change} />
          <NewInvoiceItems defaultIndicator={view.indicator} disabled={busy} form={form} onChange={change} />
          <NewInvoiceAdenda disabled={busy} form={form} onChange={change} />
        </div>
        <div className={cn(agentOpen ? "lg:w-full 2xl:w-[320px] 2xl:flex-none" : "lg:w-[320px] lg:flex-none")}>
          <NewInvoiceSummary
            form={form}
            onIssue={() => { setResult(issued ? result : null); setOpen(true); }}
            onSave={() => void saveDraft()}
            problems={problems}
            saving={save.isPending}
            view={view}
          />
        </div>
      </div>
      <NewInvoiceDialog
        backHref={BILLING_HREF}
        cfeType={form.cfeType}
        client={form.cfeType === 101 && form.consumer ? "Consumidor final" : form.name}
        currency={form.currency}
        onConfirm={() => void confirm()}
        onOpenChange={setOpen}
        open={open}
        pending={issue.isPending}
        production={view.biller.environment === "production"}
        result={result}
        total={getNewInvoiceTotals(form).total}
      />
    </OpsPageShell>
  );
};
