"use client";

import { ArrowLeft, Download, FileText, Inbox, Mail, MessageCircle, Phone } from "lucide-react";

import { opsSurface, opsToneClasses } from "@/components/ops/shared/ops-theme";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWebFormDetail } from "@/components/web-forms/hooks/use-web-forms";
import { WebFormComposer } from "@/components/web-forms/web-form-composer";
import { formatWebFormDateTime } from "@/components/web-forms/web-form-dates";
import { WebFormReplies } from "@/components/web-forms/web-form-replies";
import { WebFormStatusActions } from "@/components/web-forms/web-form-status-actions";
import { formatFileSize, WEB_FORM_KIND_LABELS, webFormStatus, whatsAppUrl } from "@/lib/web-forms/labels";
import { cn } from "@/lib/utils";

const CONTACT_LINK =
  "inline-flex min-h-11 items-center gap-2 rounded-[var(--ops-radius-control)] border border-ops-border bg-ops-surface px-3 text-sm text-ops-text transition-colors hover:bg-ops-surface-muted sm:min-h-9";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-ops-text-muted">{label}</dt>
      <dd className="break-words text-sm text-ops-text">{value}</dd>
    </div>
  );
}

export function WebFormDetailPanel({ id, onClose }: { id: string | null; onClose: () => void }) {
  const query = useWebFormDetail(id);

  if (!id) {
    return (
      <div className={cn(opsSurface.panel, "flex flex-col items-center gap-2 px-6 py-16 text-center text-sm text-ops-text-muted")}>
        <Inbox className="size-6 text-ops-bamboo" aria-hidden />
        Elegí un formulario para leerlo y responderlo.
      </div>
    );
  }
  if (query.isPending) return <Skeleton className="h-96 w-full rounded-xl" aria-label="Cargando el formulario" />;
  if (query.isError) {
    return (
      <div className={cn(opsSurface.panel, "space-y-3 p-5 text-sm")}>
        <p className="text-red-700 dark:text-red-300">{query.error.message}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Volver a la lista
          </Button>
          <Button variant="outline" onClick={() => query.refetch()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const form = query.data;
  const status = webFormStatus[form.status];
  const whatsApp = whatsAppUrl(form.phone);
  const fields = [
    form.service && { label: "Servicio", value: form.service },
    form.location && { label: "Zona", value: form.location },
    { label: "Recibido", value: formatWebFormDateTime(form.createdAt) },
    form.fromTrebol && { label: "Origen", value: "Cliente de El Trébol" },
  ].filter((field): field is { label: string; value: string } => Boolean(field));

  return (
    <article className="space-y-4">
      <div className={cn(opsSurface.panel, "space-y-4 p-4 md:p-5")}>
        <button type="button" onClick={onClose} className="-ml-1 inline-flex min-h-11 items-center gap-1.5 text-sm text-ops-text-muted lg:hidden">
          <ArrowLeft className="size-4" aria-hidden /> Formularios
        </button>

        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-semibold tracking-wide text-ops-bamboo-strong">{WEB_FORM_KIND_LABELS[form.kind]}</p>
            <h2 className="flex flex-wrap items-center gap-2 text-xl font-semibold tracking-tight text-ops-text">
              <span className="min-w-0 break-words">{form.name}</span>
              <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", opsToneClasses[status.tone])}>{status.label}</span>
            </h2>
            {form.handledBy?.name && form.handledAt && form.status !== "NEW" && (
              <p className="text-xs text-ops-text-muted">
                {status.label} por {form.handledBy.name} · {formatWebFormDateTime(form.handledAt)}
              </p>
            )}
          </div>
          <WebFormStatusActions id={form.id} kind={form.kind} status={form.status} hasReplies={form.replies.some((reply) => reply.sentAt)} />
        </header>

        <div className="flex flex-wrap gap-2">
          <a className={CONTACT_LINK} href={`mailto:${form.email}`}>
            <Mail className="size-4 text-ops-bamboo" aria-hidden /> {form.email}
          </a>
          <a className={CONTACT_LINK} href={`tel:${form.phone.replace(/[^\d+]/g, "")}`}>
            <Phone className="size-4 text-ops-bamboo" aria-hidden /> {form.phone}
          </a>
          {whatsApp && (
            <a className={CONTACT_LINK} href={whatsApp} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-4 text-ops-bamboo" aria-hidden /> WhatsApp
            </a>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {fields.map((field) => (
            <Field key={field.label} {...field} />
          ))}
        </dl>

        <div className="space-y-1">
          <h3 className="text-xs text-ops-text-muted">Mensaje</h3>
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ops-text">{form.message || "Sin mensaje."}</p>
        </div>

        {form.attachment && (
          <div className={cn(opsSurface.panelSoft, "flex items-center gap-3 px-3 py-2")}>
            <FileText className="size-5 shrink-0 text-ops-bamboo" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ops-text">{form.attachment.filename}</p>
              <p className="text-xs text-ops-text-muted">{formatFileSize(form.attachment.sizeBytes)}</p>
            </div>
            <Button asChild variant="outline" className="min-h-11 sm:min-h-9">
              <a href={`/api/web-forms/${form.id}/attachment`} download>
                <Download className="size-4" aria-hidden /> Descargar
              </a>
            </Button>
          </div>
        )}
      </div>

      <WebFormReplies replies={form.replies} />
      <WebFormComposer key={`${form.id}-${form.kind}`} form={form} />
    </article>
  );
}
