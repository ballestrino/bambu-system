"use client";

import { Check, Copy, Mail, MessageCircle, Type } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getChatCopyPayload, type CopyFormat } from "@/lib/ai-chat-copy";

const COPY_OPTIONS: { format: CopyFormat; label: string; done: string; icon: typeof Mail }[] = [
  { format: "email", label: "Copiar como email", done: "Copiado en formato email", icon: Mail },
  { format: "whatsapp", label: "Copiar como WhatsApp", done: "Copiado en formato WhatsApp", icon: MessageCircle },
  { format: "markdown", label: "Copiar como Markdown", done: "Copiado en formato Markdown", icon: Copy },
];

// El email va con texto y HTML (Gmail pega el formato); WhatsApp y Markdown,
// como texto. Mismo formateador que el chat anterior (lib/ai-chat-copy.ts).
const writeClipboard = async (text: string, html?: string) => {
  if (html && typeof ClipboardItem !== "undefined") {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/plain": new Blob([text], { type: "text/plain" }),
        "text/html": new Blob([html], { type: "text/html" }),
      }),
    ]);
    return;
  }
  await navigator.clipboard.writeText(text);
};

export function AgentCopyMenu({ content, subject }: { content: string; subject?: string | null }) {
  const [copied, setCopied] = useState(false);

  const copy = async (run: () => Promise<void>, done: string) => {
    try {
      await run();
      setCopied(true);
      toast.success(done);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-11 shrink-0 sm:h-8" aria-label="Opciones de copiado">
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          Copiar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {COPY_OPTIONS.map(({ format, label, done, icon: Icon }) => (
          <DropdownMenuItem
            key={format}
            onSelect={() => {
              const payload = getChatCopyPayload(content, format);
              void copy(() => writeClipboard(payload.text, payload.html), done);
            }}
          >
            <Icon aria-hidden />
            {label}
          </DropdownMenuItem>
        ))}
        {subject && (
          <DropdownMenuItem onSelect={() => void copy(() => writeClipboard(subject), "Asunto copiado")}>
            <Type aria-hidden />
            Copiar asunto
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
