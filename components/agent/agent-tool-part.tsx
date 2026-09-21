import { getStaticToolName, type ToolUIPart } from "ai";
import { AlertCircle, Check, Loader2 } from "lucide-react";

import { AgentToolCard } from "@/components/agent/agent-tool-card";
import type { AgentUITools } from "@/lib/agent/messages";
import { AGENT_TOOL_CATALOG, AGENT_TOOL_KINDS, isAgentToolName } from "@/lib/agent/tool-catalog";
import { cn } from "@/lib/utils";

type AgentToolUIPart = ToolUIPart<AgentUITools>;

type ChipState = "running" | "done" | "failed";

const CHIP_ICONS = { running: Loader2, done: Check, failed: AlertCircle } as const;

function ToolChip({ label, kind, state }: { label: string; kind: string; state: ChipState }) {
  const Icon = CHIP_ICONS[state];
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
        state === "failed" ? "border-amber-500/40 text-amber-700 dark:text-amber-400" : "text-muted-foreground"
      )}
    >
      <Icon className={cn("size-3.5 shrink-0", state === "running" && "animate-spin")} aria-hidden />
      <span className="truncate">{label}</span>
      <span className="shrink-0 opacity-70">· {kind}</span>
    </span>
  );
}

// Una llamada a tool: el chip mientras corre (con su tipo) y, al terminar, la
// tarjeta de su salida. Un error de la tool es un resultado: el modelo suele
// corregirse, así que se muestra sin alarma.
export function AgentToolPart({ part }: { part: AgentToolUIPart }) {
  const name = getStaticToolName(part);
  const entry = isAgentToolName(name) ? AGENT_TOOL_CATALOG[name] : null;
  const output = part.state === "output-available" ? part.output : null;
  const errorText =
    part.state === "output-error"
      ? part.errorText
      : part.state === "output-denied"
        ? "La herramienta no se ejecutó."
        : output && !output.ok
          ? output.error.message
          : null;
  const state: ChipState = errorText
    ? "failed"
    : part.state === "input-streaming" || part.state === "input-available"
      ? "running"
      : "done";

  return (
    <div className="space-y-2">
      <ToolChip
        label={entry?.label ?? name}
        kind={entry ? AGENT_TOOL_KINDS[entry.kind] : "Herramienta"}
        state={state}
      />
      {errorText && <p className="text-xs text-muted-foreground">{errorText}</p>}
      {output?.ok && <AgentToolCard data={output.data} toolCallId={part.toolCallId} />}
    </div>
  );
}
