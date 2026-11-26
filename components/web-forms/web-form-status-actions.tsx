"use client";

import { Archive, ArchiveRestore, CheckCheck, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useWebFormMutations } from "@/components/web-forms/hooks/use-web-forms";

type Status = "NEW" | "REPLIED" | "ARCHIVED";

// "Marcar respondido" sirve cuando se contestó por teléfono o WhatsApp.
// Desarchivar vuelve a Respondidos si ya tenía respuesta, si no a Nuevos.
export function WebFormStatusActions({ id, status, hasReplies }: { id: string; status: Status; hasReplies: boolean }) {
  const { setStatus } = useWebFormMutations();
  const change = (next: Status) => setStatus.mutate({ id, status: next });
  const busy = setStatus.isPending;
  const buttonClass = "min-h-11 sm:min-h-9";

  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      {status === "NEW" && (
        <Button variant="outline" className={buttonClass} disabled={busy} onClick={() => change("REPLIED")}>
          <CheckCheck className="size-4" aria-hidden /> Marcar respondido
        </Button>
      )}
      {status === "REPLIED" && (
        <Button variant="outline" className={buttonClass} disabled={busy} onClick={() => change("NEW")}>
          <Undo2 className="size-4" aria-hidden /> Volver a nuevos
        </Button>
      )}
      {status === "ARCHIVED" ? (
        <Button variant="outline" className={buttonClass} disabled={busy} onClick={() => change(hasReplies ? "REPLIED" : "NEW")}>
          <ArchiveRestore className="size-4" aria-hidden /> Desarchivar
        </Button>
      ) : (
        <Button variant="outline" className={buttonClass} disabled={busy} onClick={() => change("ARCHIVED")}>
          <Archive className="size-4" aria-hidden /> Archivar
        </Button>
      )}
    </div>
  );
}
