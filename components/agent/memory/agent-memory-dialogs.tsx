"use client";

import { useState } from "react";

import type { AgentMemoryMutations } from "@/components/agent/hooks/use-agent-memories";
import type { AgentMemoryRow } from "@/components/agent/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AGENT_MEMORY_KINDS, MEMORY_KIND_LABELS, MEMORY_TEXT_MAX, type AgentMemoryKind } from "@/lib/agent/memory";
import { cn } from "@/lib/utils";

// El vencimiento se guarda al final del día en UTC: el día es el de la fecha ISO.
const toDay = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

function EditForm({ memory, update, onDone }: { memory: AgentMemoryRow; update: AgentMemoryMutations["update"]; onDone: () => void }) {
  const [kind, setKind] = useState<AgentMemoryKind>(memory.kind);
  const [text, setText] = useState(memory.text);
  const [expiresOn, setExpiresOn] = useState(toDay(memory.expiresAt));
  const trimmed = text.trim();
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!trimmed) return;
        update.mutate({ id: memory.id, kind, text: trimmed, expiresOn: expiresOn || null }, { onSuccess: onDone });
      }}
    >
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Tipo">
        {AGENT_MEMORY_KINDS.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={kind === option}
            onClick={() => setKind(option)}
            className={cn(
              "h-9 rounded-full border px-3 text-sm",
              kind === option
                ? "border-ops-bamboo-strong bg-ops-bamboo-soft font-medium text-ops-bamboo-strong"
                : "border-ops-border text-ops-text-muted hover:bg-ops-surface-muted"
            )}
          >
            {MEMORY_KIND_LABELS[option]}
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="memory-text">Texto</Label>
        <Textarea
          id="memory-text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={MEMORY_TEXT_MAX}
          rows={4}
          autoFocus
        />
        <p className="text-right text-xs text-ops-text-muted tabular-nums">
          {text.length}/{MEMORY_TEXT_MAX}
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="memory-expires">Vale hasta (opcional)</Label>
        <Input id="memory-expires" type="date" value={expiresOn} onChange={(event) => setExpiresOn(event.target.value)} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" className="h-11 sm:h-9" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" className="h-11 sm:h-9" disabled={!trimmed || update.isPending}>
          {update.isPending ? "Guardando…" : "Guardar"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AgentMemoryEditDialog({
  memory,
  update,
  onClose,
}: {
  memory: AgentMemoryRow | null;
  update: AgentMemoryMutations["update"];
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(memory)} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar memoria</DialogTitle>
          <DialogDescription>El agente usa el texto nuevo desde el próximo mensaje.</DialogDescription>
        </DialogHeader>
        {memory && <EditForm key={memory.id} memory={memory} update={update} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

export function AgentMemoryDeleteDialog({
  memory,
  remove,
  onClose,
}: {
  memory: AgentMemoryRow | null;
  remove: AgentMemoryMutations["remove"];
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(memory)} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¿Eliminar la memoria?</DialogTitle>
          <DialogDescription>
            El agente deja de usarla. Si solo dejó de valer, vencerla la conserva en la lista.
          </DialogDescription>
        </DialogHeader>
        <p className="rounded-[10px] bg-ops-surface-muted px-3 py-2 text-sm">{memory?.text}</p>
        <DialogFooter>
          <Button variant="outline" className="h-11 sm:h-9" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            className="h-11 sm:h-9"
            disabled={!memory || remove.isPending}
            onClick={() => memory && remove.mutate(memory.id, { onSuccess: onClose })}
          >
            {remove.isPending ? "Eliminando…" : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
