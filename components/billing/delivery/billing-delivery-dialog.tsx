"use client";

import { ListChecks, Mail } from "lucide-react";

import { formatCfeNumber, formatMoney, getShortCfeLabel } from "@/components/billing/billing-format";
import { BillingDeliveryLog } from "@/components/billing/delivery/billing-delivery-log";
import { BillingSendEmailForm } from "@/components/billing/delivery/billing-send-email-form";
import { OpsFormDialogContent, OpsFormFooter, OpsFormHeader } from "@/components/ops/shared/ops-form-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { IssuedInvoiceRow } from "@/lib/billing/billing-issued-view";
import { cn } from "@/lib/utils";

export type DeliveryTab = "send" | "log";

const tabs: { icon: typeof Mail; id: DeliveryTab; label: string }[] = [
  { icon: Mail, id: "send", label: "Enviar por correo" },
  { icon: ListChecks, id: "log", label: "Marcar como enviada" },
];

// Envíos de una factura emitida (feature 53): mandarla por correo desde
// facturacion@ o anotar a dónde se mandó (correo o WhatsApp). La fila sale
// de la lista del mes, así el registro se ve al día después de cada cambio.
export const BillingDeliveryDialog = ({
  onOpenChange,
  onTabChange,
  periodKey,
  row,
  tab,
}: {
  onOpenChange: (open: boolean) => void;
  onTabChange: (tab: DeliveryTab) => void;
  periodKey: string;
  row: IssuedInvoiceRow | null;
  tab: DeliveryTab;
}) => (
  <Dialog onOpenChange={onOpenChange} open={row !== null}>
    {row ? (
      <OpsFormDialogContent size="md">
        <OpsFormHeader className="gap-3">
          <div className="flex flex-col gap-1">
            <DialogTitle>Envíos · {row.name}</DialogTitle>
            <DialogDescription>
              {getShortCfeLabel(row.cfeType)} {formatCfeNumber(row.series, row.number)} · {formatMoney(row.total, row.currency)} · Biller
              ya la manda a los correos guardados del cliente.
            </DialogDescription>
          </div>
          <div className="grid grid-cols-2 gap-1 rounded-[10px] bg-ops-surface-muted p-1" role="tablist">
            {tabs.map((item) => (
              <button
                aria-selected={tab === item.id}
                className={cn(
                  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-2 text-[13px] font-semibold text-ops-text-muted",
                  tab === item.id ? "bg-ops-surface text-ops-text shadow-sm" : "hover:text-ops-text"
                )}
                key={item.id}
                onClick={() => onTabChange(item.id)}
                role="tab"
                type="button"
              >
                <item.icon aria-hidden className="size-3.5" />
                {item.label}
                {item.id === "log" && row.deliveries.length ? <span className="tabular-nums">· {row.deliveries.length}</span> : null}
              </button>
            ))}
          </div>
        </OpsFormHeader>
        {tab === "send" ? (
          <BillingSendEmailForm key={row.id} onDone={() => onTabChange("log")} periodKey={periodKey} row={row} />
        ) : (
          <>
            <BillingDeliveryLog key={row.id} periodKey={periodKey} row={row} />
            <OpsFormFooter>
              <Button onClick={() => onOpenChange(false)} variant="outline">Listo</Button>
            </OpsFormFooter>
          </>
        )}
      </OpsFormDialogContent>
    ) : null}
  </Dialog>
);
