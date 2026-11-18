"use client";

import { BookOpen, Calculator, PenLine, Search, Sparkles, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { AgentBambooGrow } from "@/components/agent/agent-bamboo-grow";
import type { ThinkingMotion, ThinkingPhrase } from "@/components/agent/agent-thinking-phrases";
import { cn } from "@/lib/utils";

const ICONS: Record<ThinkingMotion, LucideIcon> = {
  think: Sparkles,
  calc: Calculator,
  search: Search,
  read: BookOpen,
  write: PenLine,
};

// Cada frase queda unos segundos; desde los 8 se muestra el tiempo para que
// se note que sigue trabajando.
const SECONDS_PER_PHRASE = 3;
const SHOW_SECONDS_FROM = 8;

// La primera vuelta empieza por "Pensando"; las siguientes la saltean.
const phraseAt = (step: number, count: number) =>
  step < count || count < 2 ? step % count : 1 + ((step - 1) % (count - 1));

// Mientras el agente trabaja. Con el bambú (que crece en bucle donde va el
// logo de las respuestas, también en el teléfono) es una fila propia; sin él
// va dentro de una respuesta, debajo de las tools que terminaron. Quien lo usa le cambia la key al cambiar de fase.
export function AgentThinking({ phrases, withBamboo }: { phrases: ThinkingPhrase[]; withBamboo?: boolean }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const step = Math.floor(seconds / SECONDS_PER_PHRASE);
  const phrase = phrases[phraseAt(step, phrases.length)];
  const Icon = ICONS[phrase.motion];

  return (
    <div className="flex items-center gap-3" role="status">
      {withBamboo && <AgentBambooGrow />}
      <div className="flex h-7 min-w-0 items-center gap-2 text-[13px]" aria-hidden>
        <span
          key={`icon-${step}`}
          className="grid size-6 shrink-0 place-items-center rounded-md bg-ops-bamboo-soft text-ops-bamboo-strong animate-in fade-in zoom-in-50 duration-300"
        >
          <Icon className={cn("size-3.5", `agent-think-${phrase.motion}`)} strokeWidth={2.25} />
        </span>
        <span
          key={`text-${step}`}
          className="agent-think-shimmer truncate font-medium animate-in fade-in slide-in-from-bottom-1 duration-300"
        >
          {phrase.text}…
        </span>
        {seconds >= SHOW_SECONDS_FROM && (
          <span className="shrink-0 text-[11px] tabular-nums text-ops-text-muted/80">{seconds} s</span>
        )}
      </div>
      <span className="sr-only">El asistente está trabajando.</span>
    </div>
  );
}
