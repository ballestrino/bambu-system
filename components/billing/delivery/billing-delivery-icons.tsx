"use client";

import { createLucideIcon, MailCheck } from "lucide-react";

import { getDeliverySummary, type DeliveryRow } from "@/lib/billing/invoice-delivery";
import { cn } from "@/lib/utils";

// Globo de mensajería con un check (WhatsApp). lucide 0.562 no lo trae: es el
// globo de message-circle con el check de circle-check.
export const MessageCircleCheck = createLucideIcon("message-circle-check", [
  [
    "path",
    {
      d: "M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719",
      key: "bubble",
    },
  ],
  ["path", { d: "m9 12 2 2 4-4", key: "check" }],
]);

// Verde oscuro en el tema claro y verde claro en el oscuro (--ops-bamboo-strong).
export const deliveryIconClass = "text-ops-bamboo-strong";

const describe = (label: string, recipients: string[]) => `${label}: ${recipients.join(", ")}`;

// Los íconos de una fila de "Emitidas" (feature 53): correo con check si se
// mandó por correo y globo con check si se mandó por WhatsApp. Tocarlos abre
// el registro de envíos.
export const BillingDeliveryIcons = ({
  className,
  deliveries,
  onOpen,
}: {
  className?: string;
  deliveries: DeliveryRow[];
  onOpen: () => void;
}) => {
  const summary = getDeliverySummary(deliveries);
  if (!summary.email.length && !summary.whatsapp.length) return null;
  const title = [
    summary.email.length ? describe("Enviada por correo", summary.email) : "",
    summary.whatsapp.length ? describe("Enviada por WhatsApp", summary.whatsapp) : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <button
      aria-label={`${title}. Ver envíos`}
      className={cn(
        "inline-flex h-[22px] items-center gap-1 rounded-md px-1 hover:bg-ops-surface-muted focus-visible:ring-2 focus-visible:ring-ops-bamboo/40 focus-visible:outline-none",
        deliveryIconClass,
        className
      )}
      onClick={onOpen}
      title={title}
      type="button"
    >
      {summary.email.length ? <MailCheck aria-hidden className="size-4" data-delivery="email" /> : null}
      {summary.whatsapp.length ? <MessageCircleCheck aria-hidden className="size-4" data-delivery="whatsapp" /> : null}
    </button>
  );
};
