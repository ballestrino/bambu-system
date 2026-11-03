"use client";

import { FileText, Loader2, Send } from "lucide-react";
import { useState } from "react";

import { BillingRecipientsInput } from "@/components/billing/delivery/billing-recipients-input";
import { useInvoiceDelivery } from "@/components/billing/hooks/use-invoice-delivery";
import { OpsFormBody, OpsFormFooter, opsFormControlClass, opsFormTextareaClass } from "@/components/ops/shared/ops-form-dialog";
import { Button } from "@/components/ui/button";
import type { IssuedInvoiceRow } from "@/lib/billing/billing-issued-view";
import {
  buildInvoiceEmailDefaults,
  getInvoicePdfName,
  INVOICE_MAIL_ADDRESS,
  INVOICE_MAIL_MESSAGE_MAX,
  INVOICE_MAIL_SUBJECT_MAX,
  normalizeDeliveryRecipient,
  normalizeEmailList,
} from "@/lib/billing/invoice-delivery";
import { cn } from "@/lib/utils";

const labelClass = "flex flex-col gap-1.5 text-[13px] font-semibold text-ops-text";

// "Enviar por correo" (feature 53): el PDF de Biller adjunto, desde
// facturacion@, con el asunto y el mensaje ya escritos y editables. El
// requestId nace con el formulario: un doble clic o un reintento no mandan
// dos correos. Después de enviar arranca uno nuevo.
export const BillingSendEmailForm = ({
  onDone,
  periodKey,
  row,
}: {
  onDone: () => void;
  periodKey: string;
  row: IssuedInvoiceRow;
}) => {
  const defaults = buildInvoiceEmailDefaults(row);
  const { send } = useInvoiceDelivery(periodKey);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [to, setTo] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [subject, setSubject] = useState(defaults.subject);
  const [message, setMessage] = useState(defaults.message);

  // Cambiar algo arma un pedido nuevo (Resend rechaza la misma clave con otro
  // contenido); reintentar sin cambios usa el mismo y no duplica.
  const edit = <T,>(set: (value: T) => void) => (value: T) => {
    set(value);
    setRequestId(crypto.randomUUID());
  };

  // Un correo escrito y sin Enter también va.
  const typed = normalizeDeliveryRecipient("EMAIL", draft);
  const recipients = typed.ok && !to.includes(typed.recipient) ? [...to, typed.recipient] : to;
  const list = normalizeEmailList(recipients);
  const ready = "emails" in list && subject.trim() !== "" && message.trim() !== "" && row.canSend;

  const submit = async () => {
    if (!("emails" in list)) return;
    try {
      await send.mutateAsync({ invoiceId: row.id, message, requestId, subject, to: list.emails });
      setRequestId(crypto.randomUUID());
      setTo([]);
      setDraft("");
      onDone();
    } catch {
      // El aviso sale del hook; se puede corregir y reintentar con el mismo pedido.
    }
  };

  return (
    <>
      <OpsFormBody className="flex flex-col gap-4">
        <p className="text-[13px] text-ops-text-muted">
          De <span className="font-semibold text-ops-text">{INVOICE_MAIL_ADDRESS}</span>, con copia oculta a esa casilla · las
          respuestas llegan a contacto@.
        </p>
        <div className={labelClass}>
          <span>Para</span>
          <BillingRecipientsInput
            disabled={send.isPending}
            onChange={edit(setTo)}
            onDraftChange={edit(setDraft)}
            suggestions={row.receiverEmails}
            value={to}
          />
        </div>
        <label className={labelClass}>
          Asunto
          <input
            className={cn(opsFormControlClass, "border text-[15px] font-normal outline-none")}
            disabled={send.isPending}
            maxLength={INVOICE_MAIL_SUBJECT_MAX}
            onChange={(event) => edit(setSubject)(event.target.value)}
            value={subject}
          />
        </label>
        <label className={labelClass}>
          Mensaje
          <textarea
            className={cn(opsFormTextareaClass, "min-h-36 border text-[15px] font-normal outline-none")}
            disabled={send.isPending}
            maxLength={INVOICE_MAIL_MESSAGE_MAX}
            onChange={(event) => edit(setMessage)(event.target.value)}
            value={message}
          />
        </label>
        <p className="inline-flex items-center gap-1.5 text-[13px] text-ops-text-muted">
          <FileText aria-hidden className="size-3.5" />
          Adjunto: {getInvoicePdfName({ billerId: null, cfeType: row.cfeType, number: row.number, series: row.series })}
        </p>
      </OpsFormBody>
      <OpsFormFooter className="sm:items-center sm:justify-between">
        <p className="text-sm text-ops-text-muted" role="status">
          {"emails" in list ? `${list.emails.length} ${list.emails.length === 1 ? "destinatario" : "destinatarios"}` : "Agregá a quién mandarla"}
        </p>
        <Button disabled={!ready || send.isPending} onClick={() => void submit()}>
          {send.isPending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Send aria-hidden className="size-4" />}
          Enviar
        </Button>
      </OpsFormFooter>
    </>
  );
};
