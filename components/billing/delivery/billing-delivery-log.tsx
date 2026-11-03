"use client";

import type { InvoiceDeliveryChannel } from "@prisma/client";
import { Loader2, MailCheck, Plus, X } from "lucide-react";
import { useState } from "react";

import { deliveryIconClass, MessageCircleCheck } from "@/components/billing/delivery/billing-delivery-icons";
import { useInvoiceDelivery } from "@/components/billing/hooks/use-invoice-delivery";
import { OpsFormBody, opsFormControlClass } from "@/components/ops/shared/ops-form-dialog";
import { Button } from "@/components/ui/button";
import type { IssuedInvoiceRow } from "@/lib/billing/billing-issued-view";
import { DELIVERY_CHANNEL_LABEL, normalizeDeliveryRecipient, type DeliveryRow } from "@/lib/billing/invoice-delivery";
import { cn } from "@/lib/utils";

const dateFormat = new Intl.DateTimeFormat("es-UY", {
  day: "2-digit", hour: "2-digit", minute: "2-digit", month: "2-digit", timeZone: "America/Montevideo",
});

const placeholders: Record<InvoiceDeliveryChannel, string> = { EMAIL: "cliente@ejemplo.com", WHATSAPP: "099 888 777" };

const describeSource = (row: DeliveryRow) =>
  row.source === "SYSTEM" ? `Enviado desde Bambú${row.by ? ` por ${row.by}` : ""}` : `Anotado${row.by ? ` por ${row.by}` : ""}`;

// "Marcar como enviada" (feature 53): una fila por envío, "Correo - x" o
// "WhatsApp - y". Lo que mandó Bambú aparece solo (una fila por correo) y no
// se quita; lo anotado a mano sí.
export const BillingDeliveryLog = ({ periodKey, row }: { periodKey: string; row: IssuedInvoiceRow }) => {
  const { record, remove } = useInvoiceDelivery(periodKey);
  const [channel, setChannel] = useState<InvoiceDeliveryChannel>("WHATSAPP");
  const [recipient, setRecipient] = useState("");
  const [error, setError] = useState<string | null>(null);
  const removingId = remove.isPending ? remove.variables : undefined;

  const add = async () => {
    const result = normalizeDeliveryRecipient(channel, recipient);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    try {
      await record.mutateAsync({ channel, invoiceId: row.id, recipient: result.recipient });
      setRecipient("");
    } catch {
      // El aviso sale del hook.
    }
  };

  return (
    <OpsFormBody className="flex flex-col gap-4">
      {row.deliveries.length ? (
        <ul className="divide-y divide-ops-border/70 rounded-[10px] border border-ops-border">
          {row.deliveries.map((delivery) => (
            <li className="flex items-center gap-3 px-3 py-2.5" key={delivery.id}>
              {delivery.channel === "EMAIL" ? (
                <MailCheck aria-hidden className={cn("size-4 shrink-0", deliveryIconClass)} />
              ) : (
                <MessageCircleCheck aria-hidden className={cn("size-4 shrink-0", deliveryIconClass)} />
              )}
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[14px] text-ops-text">
                  <span className="font-semibold">{DELIVERY_CHANNEL_LABEL[delivery.channel]}</span> - {delivery.recipient}
                </span>
                <span className="text-xs text-ops-text-muted">
                  {describeSource(delivery)} · {dateFormat.format(new Date(delivery.sentAt))}
                </span>
              </span>
              {delivery.source === "MANUAL" ? (
                <button
                  aria-label={`Quitar ${delivery.recipient}`}
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-ops-text-muted hover:bg-ops-surface-muted hover:text-ops-text disabled:opacity-60"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(delivery.id)}
                  type="button"
                >
                  {removingId === delivery.id ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <X aria-hidden className="size-4" />}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-[10px] bg-ops-surface-muted px-3 py-4 text-center text-sm text-ops-text-muted">
          Todavía no está marcada como enviada.
        </p>
      )}

      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-start"
        onSubmit={(event) => {
          event.preventDefault();
          void add();
        }}
      >
        <select
          aria-label="Medio"
          className={cn(opsFormControlClass, "border text-[15px] outline-none sm:w-36")}
          disabled={!row.canSend || record.isPending}
          onChange={(event) => setChannel(event.target.value as InvoiceDeliveryChannel)}
          value={channel}
        >
          <option value="WHATSAPP">WhatsApp</option>
          <option value="EMAIL">Correo</option>
        </select>
        <div className="flex flex-1 flex-col gap-1">
          <input
            aria-label={channel === "EMAIL" ? "Correo al que se mandó" : "Teléfono al que se mandó"}
            className={cn(opsFormControlClass, "border text-[15px] outline-none")}
            disabled={!row.canSend || record.isPending}
            inputMode={channel === "EMAIL" ? "email" : "tel"}
            onChange={(event) => setRecipient(event.target.value)}
            placeholder={placeholders[channel]}
            value={recipient}
          />
          {error ? <p className="text-xs text-red-700 dark:text-red-300" role="alert">{error}</p> : null}
        </div>
        <Button className="min-h-11" disabled={!row.canSend || !recipient.trim() || record.isPending} type="submit" variant="outline">
          {record.isPending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Plus aria-hidden className="size-4" />}
          Agregar
        </Button>
      </form>
      {!row.canSend ? <p className="text-xs text-ops-text-muted">Solo se marca como enviada una factura emitida y no rechazada.</p> : null}
    </OpsFormBody>
  );
};
