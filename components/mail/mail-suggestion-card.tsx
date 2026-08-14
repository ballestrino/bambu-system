"use client";

import { Bot, CheckCheck, RefreshCw, ThumbsDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { createMailAutomationRuleAction } from "@/actions/mail/learning";
import {
  generateMailSuggestionAction,
  rejectMailSuggestionAction,
} from "@/actions/mail/suggestions";
import { MailComposeDialog } from "@/components/mail/mail-compose-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Suggestion = {
  id: string;
  status: string;
  body: string | null;
  subject: string | null;
  reasoningEffort: string;
  isComplex: boolean;
  confidence: number | null;
  manualReviewRequired: boolean;
  error: string | null;
};

type Props = {
  messageId: string;
  threadId: string;
  replyAddress?: string;
  fallbackSubject: string;
  suggestion: Suggestion | null;
};

export function MailSuggestionCard({
  messageId,
  threadId,
  replyAddress,
  fallbackSubject,
  suggestion,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<{ success?: boolean; error?: string }>, success: string) => {
    startTransition(async () => {
      const result = await action();
      if (result.error) toast.error(result.error);
      else toast.success(success);
      router.refresh();
    });
  };
  if (!suggestion || suggestion.status === "FAILED") {
    return (
      <div className="rounded-lg border border-dashed p-3">
        <p className="mb-2 text-sm text-muted-foreground">
          {suggestion?.error || "Todavía no hay una respuesta sugerida."}
        </p>
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => run(() => generateMailSuggestionAction(messageId), "Sugerencia generada")}
        >
          <Bot /> Generar sugerencia
        </Button>
      </div>
    );
  }
  if (suggestion.status === "PENDING") {
    return <p className="text-sm text-muted-foreground">Terra está preparando una respuesta...</p>;
  }
  if (!suggestion.body) return null;
  return (
    <div className="space-y-3 rounded-lg border border-[#53985E]/30 bg-[#F7FBF7] p-3 dark:bg-[#20291D]">
      <div className="flex flex-wrap items-center gap-2">
        <Bot className="size-4 text-[#53985E]" />
        <span className="text-sm font-semibold">Sugerencia Terra</span>
        <Badge variant="outline">{suggestion.reasoningEffort}</Badge>
        {suggestion.isComplex ? <Badge variant="destructive">Compleja</Badge> : null}
        {suggestion.confidence !== null ? (
          <Badge variant="secondary">{Math.round(suggestion.confidence * 100)}%</Badge>
        ) : null}
      </div>
      <p className="whitespace-pre-wrap text-sm leading-6">{suggestion.body}</p>
      <div className="flex flex-wrap gap-2">
        {replyAddress ? (
          <MailComposeDialog
            trigger={<Button size="sm"><CheckCheck /> Usar respuesta</Button>}
            title="Revisar y responder"
            threadId={threadId}
            inReplyToId={messageId}
            suggestionId={suggestion.id}
            initialTo={replyAddress}
            initialSubject={suggestion.subject || `Re: ${fallbackSubject}`}
            initialBody={suggestion.body}
          />
        ) : null}
        <Button
          size="sm"
          variant="outline"
          disabled={pending || suggestion.isComplex}
          title={suggestion.isComplex ? "Las respuestas complejas nunca se automatizan" : undefined}
          onClick={() => {
            if (!window.confirm("¿Confirmás que correos idénticos o muy similares pueden responderse directamente?")) return;
            run(() => createMailAutomationRuleAction(suggestion.id), "Regla de automatización creada");
          }}
        >
          <RefreshCw /> Perfecta: automatizar similares
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => run(() => rejectMailSuggestionAction(suggestion.id), "Sugerencia rechazada")}
        >
          <ThumbsDown /> No sirve
        </Button>
      </div>
      {suggestion.manualReviewRequired ? (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Requiere revisión manual antes de enviar.
        </p>
      ) : null}
      {!replyAddress ? (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          No encontramos una dirección externa para responder. Revisá el formulario original.
        </p>
      ) : null}
    </div>
  );
}
