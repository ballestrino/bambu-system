"use client";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useRef } from "react";

import { getMonthLabel } from "@/components/billing/billing-format";
import { DraftEditorForm } from "@/components/billing/draft-editor/draft-editor-form";
import { useDraftInvoiceEditor } from "@/components/billing/hooks/use-draft-editor";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import type { DraftRow } from "@/lib/billing/billing-month-view";
import { cn } from "@/lib/utils";

const DISCARD_MESSAGE = "Tenés cambios sin guardar en esta factura. ¿Descartarlos?";

// Editor lateral de una factura del borrador (feature 49, docs/billing.md):
// a la derecha en escritorio y hoja en el teléfono, con la factura entera en
// el formulario de Nueva factura, anterior y siguiente para revisar la lista
// sin cerrarlo. Se abre desde la fila y desde el diálogo de "Emitir" (que
// queda abierto detrás: por eso se monta dentro de su árbol).
export const BillingDraftEditor = ({
  ids,
  invoiceId,
  onNavigate,
  periodKey,
  rows,
}: {
  ids: string[];
  invoiceId: string | null;
  onNavigate: (invoiceId: string | null) => void;
  periodKey: string;
  rows: DraftRow[];
}) => {
  const mobile = useIsMobile();
  const editor = useDraftInvoiceEditor(invoiceId);
  const dirty = useRef(false);
  const list = ids.filter((id) => rows.some((row) => row.id === id));
  const index = invoiceId ? list.indexOf(invoiceId) : -1;
  const row = rows.find((item) => item.id === invoiceId) ?? null;
  const data = editor.data?.id === invoiceId ? editor.data : undefined;

  const go = (next: string | null) => {
    if (dirty.current && !window.confirm(DISCARD_MESSAGE)) return;
    dirty.current = false;
    onNavigate(next);
  };
  // Después de borrar sigue con la próxima de la lista (o cierra).
  const afterDelete = () => {
    dirty.current = false;
    onNavigate(list[index + 1] ?? list[index - 1] ?? null);
  };

  return (
    <Sheet onOpenChange={(open) => (open ? undefined : go(null))} open={Boolean(invoiceId)}>
      <SheetContent
        className={cn(
          "gap-0 border-ops-border bg-ops-canvas p-0",
          mobile ? "h-[94dvh] rounded-t-[22px]" : "w-full sm:max-w-[760px]"
        )}
        side={mobile ? "bottom" : "right"}
      >
        <header className="flex flex-none items-center gap-2 border-b border-ops-border bg-ops-surface py-3 pr-14 pl-4 md:pl-5">
          <div className="flex min-w-0 flex-1 flex-col">
            <SheetTitle className="truncate text-lg font-semibold text-ops-text md:text-xl">{data?.name ?? row?.name ?? "Factura"}</SheetTitle>
            <SheetDescription className="text-[13px] text-ops-text-muted">
              Borrador de {getMonthLabel(periodKey)}
              {index >= 0 ? ` · ${index + 1} de ${list.length}` : ""}
            </SheetDescription>
          </div>
          <div className="flex items-center gap-1">
            {(["prev", "next"] as const).map((direction) => {
              const target = list[direction === "prev" ? index - 1 : index + 1];
              const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
              return (
                <button
                  aria-label={direction === "prev" ? "Factura anterior" : "Factura siguiente"}
                  className="grid size-10 place-items-center rounded-lg border border-ops-border bg-ops-surface text-ops-text hover:bg-ops-surface-muted disabled:opacity-40"
                  disabled={!target}
                  key={direction}
                  onClick={() => go(target ?? null)}
                  type="button"
                >
                  <Icon aria-hidden className="size-4" />
                </button>
              );
            })}
          </div>
        </header>
        {data ? (
          <DraftEditorForm
            data={data}
            key={`${data.id}:${data.updatedAt}`}
            onDeleted={afterDelete}
            onDirtyChange={(value) => {
              dirty.current = value;
            }}
            periodKey={periodKey}
            row={row}
          />
        ) : editor.error ? (
          <div className="flex flex-1 flex-col items-start gap-3 p-5 text-sm text-ops-text-muted" role="alert">
            {editor.error.message}
            <button className="font-semibold text-ops-bamboo-strong underline" onClick={() => void editor.refetch()} type="button">
              Reintentar
            </button>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-ops-text-muted">
            <Loader2 aria-label="Cargando la factura" className="size-5 animate-spin" />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
