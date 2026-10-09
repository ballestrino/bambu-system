import { getStaticToolName, type ToolUIPart } from "ai";
import { AlertCircle, Check } from "lucide-react";

import { AgentToolCard } from "@/components/agent/agent-tool-card";
import type { AgentUITools } from "@/lib/agent/messages";
import { AGENT_TOOL_CATALOG, AGENT_TOOL_KINDS, isAgentToolName } from "@/lib/agent/tool-catalog";
import { cn } from "@/lib/utils";

export type AgentToolUIPart = ToolUIPart<AgentUITools>;

type ChipState = "running" | "done" | "failed";

// El error de una llamada: el de la tool, el de su salida o que no se ejecutó.
const readToolError = (part: AgentToolUIPart) => {
  if (part.state === "output-error") return part.errorText;
  if (part.state === "output-denied") return "La herramienta no se ejecutó.";
  return part.state === "output-available" && !part.output.ok ? part.output.error.message : null;
};

// El chip de una llamada a tool: con un tilde al terminar y girando mientras
// corre. El tipo (Lectura, Cálculo, Propuesta, Borrador) va en el title.
export function AgentToolChip({ part }: { part: AgentToolUIPart }) {
  const name = getStaticToolName(part);
  const entry = isAgentToolName(name) ? AGENT_TOOL_CATALOG[name] : null;
  const state: ChipState = readToolError(part)
    ? "failed"
    : part.state === "input-streaming" || part.state === "input-available"
      ? "running"
      : "done";

  return (
    <span
      title={entry ? AGENT_TOOL_KINDS[entry.kind] : "Herramienta"}
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs whitespace-nowrap",
        state === "running"
          ? "border border-ops-bamboo/30 bg-ops-bamboo-soft py-[3px] text-ops-bamboo-strong"
          : state === "failed"
            ? "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
            : "bg-ops-surface-muted text-ops-text-muted"
      )}
    >
      {state === "running" ? (
        <span
          className="size-3 shrink-0 animate-spin rounded-full border-2 border-ops-bamboo-strong/25 border-t-ops-bamboo-strong"
          aria-hidden
        />
      ) : state === "failed" ? (
        <AlertCircle className="size-[13px] shrink-0" aria-hidden />
      ) : (
        <Check className="size-[13px] shrink-0 text-ops-bamboo" aria-hidden />
      )}
      <span className="truncate">{entry?.label ?? name}</span>
    </span>
  );
}

// Lo que dejó una llamada al terminar: su tarjeta o su error. Un error de la
// tool es un resultado: el modelo suele corregirse, así que se muestra sin
// alarma.
export function AgentToolResult({ part }: { part: AgentToolUIPart }) {
  const output = part.state === "output-available" ? part.output : null;
  const errorText = readToolError(part);
  if (errorText) return <p className="text-xs text-ops-text-muted">{errorText}</p>;
  if (!output?.ok) return null;
  return <AgentToolCard data={output.data} toolCallId={part.toolCallId} />;
}

// Varias llamadas seguidas: los chips en una fila y después sus tarjetas,
// como en el diseño.
export function AgentToolRun({ parts }: { parts: AgentToolUIPart[] }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {parts.map((part) => (
          <AgentToolChip key={part.toolCallId} part={part} />
        ))}
      </div>
      {parts.map((part) => (
        <AgentToolResult key={part.toolCallId} part={part} />
      ))}
    </div>
  );
}
