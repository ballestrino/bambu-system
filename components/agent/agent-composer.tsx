"use client";

import type { FileUIPart } from "ai";
import { ArrowUp } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { AgentAttachMenu } from "@/components/agent/agent-attach-menu";
import { AgentComposerImages } from "@/components/agent/agent-composer-images";
import { AgentMicButton, AgentRecordingBar } from "@/components/agent/agent-voice-controls";
import { useComposerImages } from "@/components/agent/hooks/use-composer-images";
import { useVoiceRecorder } from "@/components/agent/hooks/use-voice-recorder";
import { Textarea } from "@/components/ui/textarea";
import type { AgentMode } from "@/lib/ai/modes";

export type ComposerMessage = { text: string; files: FileUIPart[] };

// Enviar y detener: un círculo verde de 34 px dentro de un botón de 44 px en el
// teléfono (el área del dedo). Sin nada para enviar queda tenue.
const sendClass =
  "group grid size-11 shrink-0 place-items-center rounded-full focus-visible:outline-none disabled:cursor-not-allowed sm:size-9";
const sendCircle =
  "grid size-[34px] place-items-center rounded-full bg-ops-bamboo-strong text-ops-surface transition-opacity group-focus-visible:ring-2 group-focus-visible:ring-ring/50 group-disabled:opacity-35";

// El dictado agrega el texto al que ya estaba escrito.
const appendText = (current: string, addition: string) =>
  current.trim() ? `${current.trimEnd()} ${addition}` : addition;

// El texto arriba y abajo la barra: "+", el modo (tools), el micrófono y
// enviar. Enter envía y Shift+Enter hace un salto de línea (salvo mientras un
// IME compone). Mientras responde, el botón detiene el stream. El "+" adjunta
// hasta 7 imágenes (se suben al elegirlas) y el micrófono dicta como en
// ChatGPT: mientras graba, el "+" desaparece, ■ deja el texto para revisar y
// ➤ lo envía con lo que ya estaba escrito y las imágenes.
export function AgentComposer({
  busy,
  tools,
  voiceRequest,
  onSend,
  onStop,
}: {
  busy: boolean;
  tools?: React.ReactNode;
  voiceRequest: () => { mode: AgentMode; conversationId: string };
  onSend: (message: ComposerMessage) => boolean;
  onStop: () => void;
}) {
  const [text, setText] = useState("");
  const textarea = useRef<HTMLTextAreaElement>(null);
  const images = useComposerImages();
  const voice = useVoiceRecorder({
    getRequest: voiceRequest,
    onText: (transcript, intent) => {
      const next = appendText(text, transcript);
      if (intent === "send") {
        if (!busy && !images.uploading && onSend({ text: next, files: images.parts })) {
          setText("");
          images.clear();
          return;
        }
        toast.info(busy ? "El asistente está respondiendo: el texto quedó para enviar." : "Esperá a que suban las imágenes y envialo.");
      }
      setText(next);
      textarea.current?.focus();
    },
  });
  const voiceActive = voice.status !== "idle";
  const canSend = (text.trim() !== "" || images.parts.length > 0) && !images.uploading && !voiceActive;

  const submit = () => {
    if (!canSend) return;
    if (onSend({ text, files: images.parts })) {
      setText("");
      images.clear();
    }
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="rounded-[20px] border border-ops-border bg-ops-surface shadow-[0_1px_2px_rgb(24_37_29/0.04),0_10px_28px_rgb(24_37_29/0.07)] transition-shadow focus-within:border-ops-bamboo/45 sm:rounded-2xl"
    >
      <AgentComposerImages images={images.images} onRemove={images.remove} />
      {voiceActive ? (
        <div className="flex items-center p-1.5">
          <AgentRecordingBar
            status={voice.status}
            elapsed={voice.elapsed}
            meter={voice.meter}
            onStop={() => voice.stop("review")}
            onSend={() => voice.stop("send")}
          />
        </div>
      ) : (
        <>
          <Textarea
            ref={textarea}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
              event.preventDefault();
              submit();
            }}
            rows={1}
            aria-label="Mensaje para el asistente"
            placeholder="Escribí un mensaje…"
            className="max-h-40 min-h-10 resize-none rounded-none border-0 bg-transparent px-3.5 pt-3 pb-1 text-base leading-6 shadow-none placeholder:text-ops-text-muted focus-visible:ring-0 sm:px-4 sm:text-[14.5px] dark:bg-transparent"
          />
          <div className="flex items-center gap-1 px-1.5 pb-1.5 sm:gap-1.5">
            <AgentAttachMenu full={images.full} onFiles={images.add} />
            {tools}
            <span className="flex-1" />
            <AgentMicButton onStart={() => void voice.start()} />
            {busy ? (
              <button type="button" className={sendClass} onClick={onStop} aria-label="Detener respuesta">
                <span className={sendCircle}>
                  <span className="size-[11px] rounded-[2px] bg-current" />
                </span>
              </button>
            ) : (
              <button type="submit" className={sendClass} disabled={!canSend} aria-label="Enviar mensaje">
                <span className={sendCircle}>
                  <ArrowUp className="size-[18px]" aria-hidden />
                </span>
              </button>
            )}
          </div>
        </>
      )}
    </form>
  );
}
