"use client";

import { Check, Loader2, Mic, X } from "lucide-react";

import type { VoiceStatus } from "@/components/agent/hooks/use-voice-recorder";
import { Button } from "@/components/ui/button";
import { AGENT_MAX_RECORDING_SECONDS } from "@/lib/agent/attachment-rules";

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

// Ocupa el lugar del texto mientras se graba o se transcribe: el tiempo, X
// para descartar y ✓ para transcribir.
export function AgentRecordingBar({
  status,
  elapsed,
  onCancel,
  onStop,
}: {
  status: VoiceStatus;
  elapsed: number;
  onCancel: () => void;
  onStop: () => void;
}) {
  const transcribing = status === "transcribing";
  return (
    <div className="flex min-h-11 flex-1 items-center gap-2 px-2" role="status" aria-live="polite">
      {transcribing || status === "starting" ? (
        <>
          <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
          <span className="flex-1 text-sm text-muted-foreground">
            {transcribing ? "Transcribiendo…" : "Abriendo el micrófono…"}
          </span>
        </>
      ) : (
        <>
          <span className="size-2.5 animate-pulse rounded-full bg-red-500" aria-hidden />
          <span className="flex-1 text-sm tabular-nums">
            Grabando {clock(elapsed)}
            <span className="text-muted-foreground"> / {clock(AGENT_MAX_RECORDING_SECONDS)}</span>
          </span>
        </>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-11 shrink-0 rounded-full"
        disabled={transcribing}
        onClick={onCancel}
        aria-label="Descartar grabación"
      >
        <X aria-hidden />
      </Button>
      <Button
        type="button"
        size="icon"
        className="size-11 shrink-0 rounded-full"
        disabled={status !== "recording"}
        onClick={onStop}
        aria-label="Terminar y transcribir"
      >
        <Check aria-hidden />
      </Button>
    </div>
  );
}
