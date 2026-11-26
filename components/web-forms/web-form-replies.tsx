"use client";

import { AlertTriangle, Send } from "lucide-react";

import { opsSurface } from "@/components/ops/shared/ops-theme";
import { formatWebFormDateTime } from "@/components/web-forms/web-form-dates";
import { cn } from "@/lib/utils";

type Reply = {
  id: string;
  subject: string;
  body: string;
  toAddress: string;
  savedToSent: boolean;
  sentAt: Date | null;
  createdAt: Date;
  sentBy: { name: string | null } | null;
};

// Lo que ya se respondió desde la app. Sin sentAt: se estaba mandando y no se
// sabe si salió (se cortó a la mitad); se avisa para revisar Enviados.
export function WebFormReplies({ replies }: { replies: Reply[] }) {
  if (replies.length === 0) return null;
  return (
    <section className={cn(opsSurface.panel, "space-y-3 p-4 md:p-5")} aria-label="Respuestas enviadas">
      <h3 className="text-sm font-semibold text-ops-text">Respuestas</h3>
      <ol className="space-y-3">
        {replies.map((reply) => (
          <li key={reply.id} className={cn(opsSurface.panelSoft, "space-y-2 p-3")}>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ops-text-muted">
              {reply.sentAt ? (
                <Send className="size-3.5 text-ops-bamboo" aria-hidden />
              ) : (
                <AlertTriangle className="size-3.5 text-amber-600" aria-hidden />
              )}
              <span className="font-medium text-ops-text">{reply.sentBy?.name ?? "Alguien del equipo"}</span>
              <span>a {reply.toAddress}</span>
              <span>· {formatWebFormDateTime(reply.sentAt ?? reply.createdAt)}</span>
            </div>
            <p className="text-sm font-medium text-ops-text">{reply.subject}</p>
            <p className="whitespace-pre-wrap break-words text-sm text-ops-text-muted">{reply.body}</p>
            {!reply.sentAt && (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                No se confirmó el envío. Revisá Enviados en contacto@ antes de volver a mandarla.
              </p>
            )}
            {reply.sentAt && !reply.savedToSent && (
              <p className="text-xs text-ops-text-muted">Salió, pero no quedó copia en Enviados.</p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
