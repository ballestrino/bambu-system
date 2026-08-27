"use client";

import { History, RotateCcw } from "lucide-react";

import { MailSourceBibliography } from "@/components/mail/mail-source-bibliography";
import type { MailThreadDetail } from "@/components/mail/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Suggestion = NonNullable<MailThreadDetail["messages"][number]["suggestion"]>;
type Revision = Suggestion["revisions"][number];

const originLabel: Record<string, string> = {
  AI: "Luna",
  MANUAL: "Manual",
  RESTORED: "Restaurada",
};

export function MailDraftHistory({
  revisions,
  pending,
  onRestore,
}: {
  revisions: Revision[];
  pending: boolean;
  onRestore: (revision: Revision) => void;
}) {
  return (
    <details className="rounded-md border bg-background/70 p-3">
      <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium">
        <History className="size-4" /> Historial · {revisions.length}{" "}
        {revisions.length === 1 ? "versión" : "versiones"}
      </summary>
      <div className="mt-3 space-y-3">
        {revisions.map((revision, index) => (
          <details key={revision.id} className="rounded-md border p-3" open={index === 0}>
            <summary className="cursor-pointer text-sm font-medium">
              <span className="mr-2">v{revision.revision}</span>
              <Badge variant={index === 0 ? "default" : "outline"}>
                {index === 0 ? "Actual" : originLabel[revision.origin] ?? revision.origin}
              </Badge>
            </summary>
            <div className="mt-3 space-y-2 text-sm">
              {revision.instruction ? (
                <p className="text-muted-foreground">Pedido: {revision.instruction}</p>
              ) : null}
              <p className="font-medium">{revision.subject}</p>
              <p className="max-h-40 overflow-y-auto whitespace-pre-wrap leading-6">
                {revision.body}
              </p>
              <MailSourceBibliography sources={revision.sources} />
              {index > 0 ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => onRestore(revision)}
                >
                  <RotateCcw /> Restaurar como nueva versión
                </Button>
              ) : null}
            </div>
          </details>
        ))}
      </div>
    </details>
  );
}
