"use client";

import { useEffect, useState } from "react";

import type { AudioMeter } from "@/components/agent/audio-meter";
import { pushLevel } from "@/lib/agent/audio-level";

// Barras que suben y bajan con la voz, como el dictado de ChatGPT: entra una
// cada 70 ms por la derecha y corren hacia la izquierda. En silencio quedan
// como una línea de puntos. Sobran barras para un composer ancho: en el
// teléfono las más viejas quedan cortadas a la izquierda.
const BAR_COUNT = 110;
const SAMPLE_MS = 70;
const MAX_HEIGHT_PX = 28;
const MIN_HEIGHT_PX = 3;

export function AgentVoiceWaveform({ meter }: { meter: AudioMeter | null }) {
  const [levels, setLevels] = useState<number[]>(() => Array(BAR_COUNT).fill(0));

  useEffect(() => {
    if (!meter) return;
    const id = window.setInterval(() => setLevels((current) => pushLevel(current, meter.read())), SAMPLE_MS);
    return () => window.clearInterval(id);
  }, [meter]);

  return (
    <div className="flex h-8 min-w-0 flex-1 items-center justify-end gap-[3px] overflow-hidden" aria-hidden>
      {levels.map((level, index) => (
        <span
          key={index}
          className="w-[3px] shrink-0 rounded-full bg-foreground/75"
          style={{ height: Math.max(MIN_HEIGHT_PX, Math.round(level * MAX_HEIGHT_PX)) }}
        />
      ))}
    </div>
  );
}
