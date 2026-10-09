"use client";

import { Loader2, Mic, SendHorizontal, Square } from "lucide-react";

import type { AudioMeter } from "@/components/agent/audio-meter";
import { AgentVoiceWaveform } from "@/components/agent/agent-voice-waveform";
import type { VoiceStatus } from "@/components/agent/hooks/use-voice-recorder";
import { Button } from "@/components/ui/button";

const clock = (seconds: number) => {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
};

// Se puede dictar mientras el asistente responde: el texto espera en el
// composer.
export function AgentMicButton({ onStart }: { onStart: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-11 shrink-0 rounded-full"
      onClick={onStart}
      aria-label="Dictar mensaje"
    >
      <Mic aria-hidden />
    </Button>
  );
}

// Ocupa todo el composer mientras se graba, como en ChatGPT: la onda de la
// voz, el tiempo, ■ para terminar y revisar el texto (o seguir dictando) y ➤
// para transcribir y enviar.
export function AgentRecordingBar({
  status,
  elapsed,
  meter,
  onStop,
  onSend,
}: {
  status: VoiceStatus;
  elapsed: number;
  meter: AudioMeter | null;
  onStop: () => void;
  onSend: () => void;
}) {
  const recording = status === "recording";
  return (
    <div className="flex min-h-11 min-w-0 flex-1 items-center gap-2 pl-3">
      <span className="sr-only" role="status" aria-live="polite">
        {recording ? "Grabando" : status === "transcribing" ? "Transcribiendo" : "Abriendo el micrófono"}
      </span>
      {recording ? (
        <>
          <AgentVoiceWaveform meter={meter} />
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground" aria-hidden>
            {clock(elapsed)}
          </span>
        </>
      ) : (
        <span className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted-foreground" aria-hidden>
          <Loader2 className="size-4 shrink-0 animate-spin" />
          {status === "transcribing" ? "Transcribiendo…" : "Abriendo el micrófono…"}
        </span>
      )}
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="size-11 shrink-0 rounded-full"
        disabled={!recording}
        onClick={onStop}
        aria-label="Terminar y revisar el texto"
      >
        <Square className="size-3.5 fill-current" aria-hidden />
      </Button>
      <Button
        type="button"
        size="icon"
        className="size-11 shrink-0 rounded-full"
        disabled={!recording}
        onClick={onSend}
        aria-label="Transcribir y enviar"
      >
        <SendHorizontal aria-hidden />
      </Button>
    </div>
  );
}
