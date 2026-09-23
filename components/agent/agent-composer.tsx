"use client";

import { SendHorizontal, Square } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// Enter envía y Shift+Enter hace un salto de línea (salvo mientras un IME
// compone). Mientras responde, el botón detiene el stream.
export function AgentComposer({
  busy,
  onSend,
  onStop,
}: {
  busy: boolean;
  onSend: (text: string) => boolean;
  onStop: () => void;
}) {
  const [text, setText] = useState("");

  const submit = () => {
    if (onSend(text)) setText("");
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="flex items-end gap-2 rounded-2xl border bg-background p-1.5 focus-within:ring-2 focus-within:ring-ring/30"
    >
      <Textarea
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
          disabled={!text.trim()}
          aria-label="Enviar mensaje"
        >
          <SendHorizontal aria-hidden />
        </Button>
      )}
    </form>
  );
}
