"use client";

import { Check, Pause, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import {
  reviewMailMemoryAction,
  updateMailRuleStatusAction,
} from "@/actions/mail/learning";
import { setMailAutoSendAction } from "@/actions/mail/settings";
import type { MailMemoryItem, MailRuleItem } from "@/components/mail/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export function MailSettingsPanel({
  autoSendEnabled,
  memories,
  rules,
  queueCount,
}: {
  autoSendEnabled: boolean;
  memories: MailMemoryItem[];
  rules: MailRuleItem[];
  queueCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<{ success?: boolean; error?: string }>) => {
    startTransition(async () => {
      const result = await action();
      if (result.error) toast.error(result.error);
      router.refresh();
    });
  };
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-lg border p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold">Envío automático</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Solo aplica reglas confirmadas y todas las barreras de seguridad. {queueCount} en cola.
            </p>
          </div>
          <Switch
            checked={autoSendEnabled}
            disabled={pending}
            aria-label="Activar envío automático"
            onCheckedChange={(value) => {
              if (value && !window.confirm("¿Activar el envío automático para reglas confirmadas?")) return;
              run(() => setMailAutoSendAction(value));
            }}
          />
        </div>
        <div className="mt-4 space-y-2">
          {rules.length ? rules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{rule.name}</p>
                <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{rule.status}</Badge>
                  <span>{Math.round(rule.similarityThreshold * 100)}%</span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="icon-sm" variant="ghost" disabled={pending} aria-label="Pausar regla" onClick={() => run(() => updateMailRuleStatusAction({ id: rule.id, status: rule.status === "PAUSED" ? "ACTIVE" : "PAUSED" }))}>
                  {rule.status === "PAUSED" ? <Check /> : <Pause />}
                </Button>
                <Button size="icon-sm" variant="ghost" disabled={pending} aria-label="Archivar regla" onClick={() => run(() => updateMailRuleStatusAction({ id: rule.id, status: "ARCHIVED" }))}>
                  <Trash2 />
                </Button>
              </div>
            </div>
          )) : <p className="text-sm text-muted-foreground">Todavía no hay reglas confirmadas.</p>}
        </div>
      </section>
      <section className="rounded-lg border p-4">
        <h3 className="font-semibold">Memoria compartida</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Lo extraído por Luna queda pendiente hasta que una administradora lo aprueba.
        </p>
        <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
          {memories.length ? memories.map((memory) => (
            <div key={memory.id} className="rounded-md border p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{memory.key}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{memory.value}</p>
                </div>
                <Badge variant={memory.status === "PENDING" ? "secondary" : "outline"}>{memory.status}</Badge>
              </div>
              {memory.status === "PENDING" ? (
                <div className="mt-2 flex gap-1">
                  <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => reviewMailMemoryAction({ id: memory.id, decision: "APPROVED" }))}><Check /> Aprobar</Button>
                  <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => reviewMailMemoryAction({ id: memory.id, decision: "REJECTED" }))}><X /> Rechazar</Button>
                </div>
              ) : null}
            </div>
          )) : <p className="text-sm text-muted-foreground">No hay memorias pendientes o aprobadas.</p>}
        </div>
      </section>
    </div>
  );
}
