"use client";

import { Bot } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { generateMailSuggestionAction } from "@/actions/mail/suggestions";
import { MailDraftEditor } from "@/components/mail/mail-draft-editor";
import type { MailThreadDetail } from "@/components/mail/types";
import { Button } from "@/components/ui/button";

type Suggestion = NonNullable<
  MailThreadDetail["messages"][number]["suggestion"]
>;

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
    return <p className="text-sm text-muted-foreground">Luna está preparando una respuesta...</p>;
  }
  if (!suggestion.body || !suggestion.revisions.length) return null;
  return <MailDraftEditor key={suggestion.revisions[0].id} suggestion={suggestion} messageId={messageId} threadId={threadId} replyAddress={replyAddress} />;
}
