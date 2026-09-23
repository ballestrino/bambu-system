import { isStaticToolUIPart } from "ai";
import { RotateCcw } from "lucide-react";

import { AgentMarkdown } from "@/components/agent/agent-markdown";
import { AgentToolPart } from "@/components/agent/agent-tool-part";
import type { TurnNotice } from "@/components/agent/hooks/use-agent-session";
import type { AgentUIMessage } from "@/components/agent/types";
import { Button } from "@/components/ui/button";
import { getMessageText } from "@/lib/agent/messages";
import { AGENT_SKILLS } from "@/lib/agent/skills";
import { formatUsageDetail, formatUsageLine } from "@/lib/agent/usage-format";

// La línea discreta de cada respuesta: modelo, modo, tokens y costo. Una
// respuesta cortada lo dice. Una detenida también, con el consumo que se
// alcanzó a medir: el paso cortado no lo informa.
function UsageLine({
  message,
  notice,
  onRetry,
}: {
  message: AgentUIMessage;
  notice?: TurnNotice;
  onRetry?: () => void;
}) {
  const usage = message.metadata?.usage;
  if (notice === "interrupted") {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
        <span>La respuesta se cortó antes de terminar.</span>
        {onRetry && (
          <Button variant="outline" size="sm" className="h-11 sm:h-7" onClick={onRetry}>
            <RotateCcw aria-hidden />
            Reintentar
          </Button>
        )}
      </div>
    );
  }
  const stopped = notice === "stopped" || message.metadata?.stopped;
  if (!usage) {
    return stopped ? (
      <p className="text-[11px] text-muted-foreground">Respuesta detenida · sin consumo medido</p>
    ) : null;
  }
  return (
    <p className="text-[11px] tabular-nums text-muted-foreground" title={formatUsageDetail(usage)}>
      {stopped ? "Respuesta detenida · " : ""}
      {formatUsageLine(usage, message.metadata?.mode)}
    </p>
  );
}

export function AgentMessage({
  message,
  notice,
  onRetry,
}: {
  message: AgentUIMessage;
  notice?: TurnNotice;
  onRetry?: () => void;
}) {
  if (message.role === "user") {
    const skill = message.metadata?.skill;
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] space-y-1 rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
          {skill && skill !== "general" && (
            <span className="inline-flex rounded-full bg-primary-foreground/15 px-2 py-0.5 text-[11px] font-medium">
              {AGENT_SKILLS[skill].label}
            </span>
          )}
          <p className="whitespace-pre-wrap break-words">{getMessageText(message)}</p>
        </div>
      </div>
    );
  }

  // Texto como Markdown y tools como chip más tarjeta. El razonamiento y los
  // marcadores de paso no se muestran.
  return (
    <div className="space-y-2">
      {message.parts.map((part, index) => {
        if (part.type === "text") {
          return part.text.trim() ? <AgentMarkdown key={index} content={part.text} /> : null;
        }
        if (isStaticToolUIPart(part)) return <AgentToolPart key={part.toolCallId} part={part} />;
        return null;
      })}
      <UsageLine message={message} notice={notice} onRetry={onRetry} />
    </div>
  );
}

// Si hay algo visible del asistente: mientras no, se muestra "Pensando…".
export const hasVisibleContent = (message: AgentUIMessage) =>
  message.parts.some((part) => (part.type === "text" ? part.text.trim() !== "" : isStaticToolUIPart(part)));
