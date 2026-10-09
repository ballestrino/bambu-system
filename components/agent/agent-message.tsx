import { isStaticToolUIPart } from "ai";
import { RotateCcw } from "lucide-react";

import { AgentMarkdown } from "@/components/agent/agent-markdown";
import { AgentLogoTile } from "@/components/agent/agent-logo-tile";
import { AgentMessageImages } from "@/components/agent/agent-message-images";
import { AgentToolRun, type AgentToolUIPart } from "@/components/agent/agent-tool-part";
import type { TurnNotice } from "@/components/agent/hooks/use-agent-session";
import type { AgentUIMessage } from "@/components/agent/types";
import { Button } from "@/components/ui/button";
import { getMessageImages, getMessageText } from "@/lib/agent/messages";
import { AGENT_SKILLS } from "@/lib/agent/skills";
import { formatUsageDetail, formatUsageLine } from "@/lib/agent/usage-format";
import { cn } from "@/lib/utils";

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
          <Button variant="outline" size="sm" className="h-11 rounded-[10px] sm:h-7" onClick={onRetry}>
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
      <p className="text-[11px] text-ops-text-muted">Respuesta detenida · sin consumo medido</p>
    ) : null;
  }
  return (
    <p className="text-[11px] tabular-nums text-ops-text-muted" title={formatUsageDetail(usage)}>
      {stopped ? "Respuesta detenida · " : ""}
      {formatUsageLine(usage, message.metadata?.mode)}
    </p>
  );
}

type Block = { kind: "text"; key: string; text: string } | { kind: "tools"; key: string; parts: AgentToolUIPart[] };

// Las partes visibles en bloques: cada texto por su lado y las tools seguidas
// juntas (sus chips en una fila). El razonamiento y los marcadores de paso no
// se muestran.
const toBlocks = (message: AgentUIMessage) =>
  message.parts.reduce<Block[]>((blocks, part, index) => {
    if (part.type === "text") {
      if (part.text.trim()) blocks.push({ kind: "text", key: `text-${index}`, text: part.text });
    } else if (isStaticToolUIPart(part)) {
      const last = blocks.at(-1);
      if (last?.kind === "tools") last.parts.push(part);
      else blocks.push({ kind: "tools", key: part.toolCallId, parts: [part] });
    }
    return blocks;
  }, []);

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
    const text = getMessageText(message);
    const images = getMessageImages(message);
    return (
      <div className="flex justify-end">
        <div
          className={cn(
            "max-w-[80%] space-y-1.5 rounded-[18px] rounded-br-md bg-ops-bamboo-strong px-3.5 py-2.5 text-[14.5px] leading-normal text-ops-surface",
            images.length > 1 && "w-72"
          )}
        >
          {skill && skill !== "general" && (
            <span className="inline-flex rounded-full bg-ops-surface/15 px-2 py-0.5 text-[11px] font-medium">
              {AGENT_SKILLS[skill].label}
            </span>
          )}
          <AgentMessageImages images={images} />
          {text && <p className="whitespace-pre-wrap break-words text-pretty">{text}</p>}
        </div>
      </div>
    );
  }

  // Texto como Markdown y tools como chips más tarjetas, con el logo al lado
  // si hay lugar (en el teléfono no).
  return (
    <div className="flex items-start gap-3">
      <AgentLogoTile size="sm" className="hidden @lg/thread:grid" />
      <div className="min-w-0 flex-1 space-y-3">
        {toBlocks(message).map((block) =>
          block.kind === "text" ? (
            <AgentMarkdown key={block.key} content={block.text} />
          ) : (
            <AgentToolRun key={block.key} parts={block.parts} />
          )
        )}
        <UsageLine message={message} notice={notice} onRetry={onRetry} />
      </div>
    </div>
  );
}

// Si hay algo visible del asistente: mientras no, se muestra "Pensando…".
export const hasVisibleContent = (message: AgentUIMessage) =>
  message.parts.some((part) => (part.type === "text" ? part.text.trim() !== "" : isStaticToolUIPart(part)));
