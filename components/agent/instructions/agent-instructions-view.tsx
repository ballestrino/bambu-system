"use client";

import { Lock, RefreshCw, ScrollText } from "lucide-react";
import { useState } from "react";

import { useAgentInstructions } from "@/components/agent/hooks/use-agent-instructions";
import { AgentInstructionVersion, AgentRuleList } from "@/components/agent/instructions/agent-instruction-version";
import type { AgentInstructionVersionRow } from "@/components/agent/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PROTECTED_RULES } from "@/lib/agent/protected-rules";
import { cn } from "@/lib/utils";

const SECTION = "overflow-hidden rounded-xl border border-ops-border bg-ops-surface";
const HEADING = "text-sm font-semibold";

// Las reglas del equipo que el agente sigue en todas las conversaciones, las
// fijas que nadie cambia y el historial de versiones, con restaurar.
export function AgentInstructionsView() {
  const { query, restore } = useAgentInstructions();
  const [restoring, setRestoring] = useState<AgentInstructionVersionRow | null>(null);
  const versions = query.data ?? [];
  const latest = versions[0];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 px-4 pb-8">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <ScrollText className="size-5 text-ops-bamboo-strong" aria-hidden />
            Instrucciones del agente
          </h1>
          <p className="max-w-prose text-sm text-ops-text-muted">
            Cómo trabaja el agente en todas las conversaciones. Las reglas del equipo se cambian desde el chat: el
            agente propone y un admin confirma. Cada cambio es una versión que se puede restaurar.
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="size-11 shrink-0 sm:size-9"
          aria-label="Refrescar"
          disabled={query.isFetching}
          onClick={() => query.refetch()}
        >
          <RefreshCw className={cn(query.isFetching && "animate-spin")} aria-hidden />
        </Button>
      </header>

      <section className={cn(SECTION, "space-y-2 px-4 py-3")}>
        <h2 className={cn(HEADING, "flex items-center gap-2")}>
          <Lock className="size-4 text-ops-text-muted" aria-hidden />
          Reglas fijas
        </h2>
        <p className="text-xs text-ops-text-muted">No se cambian desde el chat y ganan si una regla del equipo choca.</p>
        <ul className="list-disc space-y-1 pl-5 text-sm marker:text-ops-text-muted">
          {PROTECTED_RULES.map((rule) => (
            <li key={rule.id} className="first-letter:uppercase">
              {rule.label}
            </li>
          ))}
        </ul>
      </section>

      {query.isPending ? (
        <div className="space-y-2" aria-busy="true" aria-label="Cargando las instrucciones">
          {[0, 1].map((index) => (
            <Skeleton key={index} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : query.isError ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-200">
          <span>{query.error.message}</span>
          <Button variant="outline" className="h-11 sm:h-9" onClick={() => query.refetch()}>
            Reintentar
          </Button>
        </div>
      ) : (
        <>
          <section className={cn(SECTION, "space-y-2 px-4 py-3")}>
            <h2 className={HEADING}>
              Reglas del equipo{latest && <span className="font-normal text-ops-text-muted"> · versión {latest.version}</span>}
            </h2>
            {latest ? (
              <AgentRuleList rules={latest.rules} />
            ) : (
              <p className="text-sm text-ops-text-muted">
                Todavía no hay reglas. Pedile al agente que cambie cómo trabaja (&quot;de ahora en más, antes de agendar
                preguntá la dirección&quot;) y confirmalo en su tarjeta.
              </p>
            )}
          </section>

          {versions.length > 0 && (
            <section className="space-y-2">
              <h2 className={HEADING}>Historial</h2>
              <ul className={cn(SECTION, "divide-y divide-ops-border")}>
                {versions.map((row) => (
                  <AgentInstructionVersion
                    key={row.version}
                    row={row}
                    current={row.version === latest?.version}
                    onRestore={setRestoring}
                  />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <Dialog open={Boolean(restoring)} onOpenChange={(next) => !next && setRestoring(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>¿Restaurar la versión {restoring?.version}?</DialogTitle>
            <DialogDescription>
              Se guarda como una versión nueva con estas reglas. La vigente queda en el historial.
            </DialogDescription>
          </DialogHeader>
          {restoring && <AgentRuleList rules={restoring.rules} />}
          <DialogFooter>
            <Button variant="outline" className="h-11 sm:h-9" onClick={() => setRestoring(null)}>
              Cancelar
            </Button>
            <Button
              className="h-11 sm:h-9"
              disabled={!restoring || !latest || restore.isPending}
              onClick={() =>
                restoring &&
                latest &&
                restore.mutate(
                  { version: restoring.version, currentVersion: latest.version },
                  { onSuccess: () => setRestoring(null) }
                )
              }
            >
              {restore.isPending ? "Restaurando…" : "Restaurar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
