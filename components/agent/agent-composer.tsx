"use client";

import type { FileUIPart } from "ai";
import { SendHorizontal, Square } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { AgentAttachMenu } from "@/components/agent/agent-attach-menu";
import { AgentComposerImages } from "@/components/agent/agent-composer-images";
import { AgentMicButton, AgentRecordingBar } from "@/components/agent/agent-voice-controls";
import { useComposerImages } from "@/components/agent/hooks/use-composer-images";
import { useVoiceRecorder } from "@/components/agent/hooks/use-voice-recorder";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { AgentMode } from "@/lib/ai/modes";

export type ComposerMessage = { text: string; files: FileUIPart[] };

// El dictado agrega el texto al que ya estaba escrito.
const appendText = (current: string, addition: string) =>
  current.trim() ? `${current.trimEnd()} ${addition}` : addition;

// Enter envía y Shift+Enter hace un salto de línea (salvo mientras un IME
// compone). Mientras responde, el botón detiene el stream. El "+" adjunta
// hasta 7 imágenes (se suben al elegirlas) y el micrófono dicta como en
// ChatGPT: mientras graba, el "+" desaparece, ■ deja el texto para revisar y
// ➤ lo envía con lo que ya estaba escrito y las imágenes.
export function AgentComposer({
  busy,
  voiceRequest,
  onSend,
  onStop,
}: {
  busy: boolean;
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
      className="rounded-2xl border bg-background p-1.5 focus-within:ring-2 focus-within:ring-ring/30"
    >
      <AgentComposerImages images={images.images} onRemove={images.remove} />
      <div className="flex items-end gap-1">
        {!voiceActive && <AgentAttachMenu full={images.full} onFiles={images.add} />}
        {voiceActive ? (
          <AgentRecordingBar
            status={voice.status}
            elapsed={voice.elapsed}
            meter={voice.meter}
            onStop={() => voice.stop("review")}
            onSend={() => voice.stop("send")}
          />
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
              className="max-h-40 min-h-11 resize-none border-0 bg-transparent px-2 py-2.5 shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
            <AgentMicButton onStart={() => void voice.start()} />
            {busy ? (
              <Button
                type="button"
                size="icon"
                className="size-11 shrink-0 rounded-full"
                onClick={onStop}
                aria-label="Detener respuesta"
              >
                <Square className="fill-current" aria-hidden />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                className="size-11 shrink-0 rounded-full"
                disabled={!canSend}
                aria-label="Enviar mensaje"
              >
                <SendHorizontal aria-hidden />
              </Button>
            )}
          </>
        )}
      </div>
    </form>
  );
}
