"use client";

import { useEffect, useState } from "react";

import { AgentBambooGrow } from "@/components/agent/agent-bamboo-grow";
import type { ThinkingPhrase } from "@/components/agent/agent-thinking-phrases";

// Cada frase queda unos segundos; desde los 8 se muestra el tiempo para que
// se note que sigue trabajando.
const SECONDS_PER_PHRASE = 3;
const SHOW_SECONDS_FROM = 8;

// La primera vuelta empieza por "Pensando"; las siguientes la saltean.
const phraseAt = (step: number, count: number) =>
  step < count || count < 2 ? step % count : 1 + ((step - 1) % (count - 1));

// Mientras el agente trabaja: el bambú que crece y la acción al lado. Sola
// es una fila como las respuestas (el bambú donde va el logo); inline va
// dentro de una respuesta, debajo de las tools que terminaron. Quien lo usa
// le cambia la key al cambiar de fase.
export function AgentThinking({ phrases, inline }: { phrases: ThinkingPhrase[]; inline?: boolean }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const step = Math.floor(seconds / SECONDS_PER_PHRASE);
  const phrase = phrases[phraseAt(step, phrases.length)];

  return (
    <div className={inline ? "flex items-center gap-2" : "flex items-center gap-3"} role="status">
      <AgentBambooGrow className={inline ? "size-5" : undefined} />
      <div className="flex h-7 min-w-0 items-center gap-2 text-[13px]" aria-hidden>
        <span
          key={step}
          className="agent-think-shimmer truncate font-medium animate-in fade-in slide-in-from-bottom-1 duration-300"
        >
          {phrase}…
        </span>
        {seconds >= SHOW_SECONDS_FROM && (
          <span className="shrink-0 text-[11px] tabular-nums text-ops-text-muted/80">{seconds} s</span>
        )}
      </div>
      <span className="sr-only">El asistente está trabajando.</span>
    </div>
  );
}
