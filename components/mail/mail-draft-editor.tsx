"use client";

import { Bot, CheckCheck, Clipboard, RefreshCw, Save, Send, ThumbsUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  recordMailDraftFeedbackAction,
  restoreMailDraftRevisionAction,
  reviseMailDraftWithLunaAction,
  saveMailDraftAction,
} from "@/actions/mail/draft-editor";
import { createMailAutomationRuleAction } from "@/actions/mail/learning";
import { MailComposeDialog } from "@/components/mail/mail-compose-dialog";
import { MailDraftNegativeFeedback } from "@/components/mail/mail-draft-feedback";
import { MailDraftHistory } from "@/components/mail/mail-draft-history";
import { MailSourceBibliography } from "@/components/mail/mail-source-bibliography";
import type { MailThreadDetail } from "@/components/mail/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Suggestion = NonNullable<MailThreadDetail["messages"][number]["suggestion"]>;
type Result = { success?: boolean; error?: string };

export function MailDraftEditor({
  suggestion,
  messageId,
  threadId,
  replyAddress,
}: {
  suggestion: Suggestion;
  messageId: string;
  threadId: string;
  replyAddress?: string;
}) {
  const revision = suggestion.revisions[0];
  const [subject, setSubject] = useState(revision.subject);
  const [body, setBody] = useState(revision.body);
  const [instruction, setInstruction] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const dirty = subject !== revision.subject || body !== revision.body;
  const run = (action: () => Promise<Result>, success: string) => {
    startTransition(async () => {
      const result = await action();
      if (result.error) toast.error(result.error);
      else {
        toast.success(success);
        router.refresh();
      }
    });
  };
  const feedback = (
    outcome: "USEFUL" | "NOT_USEFUL" | "COPIED" | "EXTERNAL_SENT",
    extra: { reason?: "incorrecto" | "incompleto" | "tono" | "riesgoso" | "otro"; comment?: string } = {}
  ) => recordMailDraftFeedbackAction({
    suggestionId: suggestion.id,
    revisionId: revision.id,
    outcome,
    ...extra,
  });
  const sources = revision.sources;
  const groundedPrices = sources.flatMap(({ officialBudgetOption: option }) => [
    Number(option.netPrice), Number(option.ivaAmount),
    Number(option.finalPrice), Number(option.hourlyPrice),
  ]);
  return (
    <div className="space-y-3 rounded-lg border border-[#53985E]/30 bg-[#F7FBF7] p-3 dark:bg-[#20291D]">
      <div className="flex flex-wrap items-center gap-2">
        <Bot className="size-4 text-[#53985E]" />
        <span className="text-sm font-semibold">Borrador con Luna</span>
        <Badge variant="outline">v{revision.revision}</Badge>
        {suggestion.isComplex ? <Badge variant="destructive">Compleja</Badge> : null}
      </div>
      <Input value={subject} onChange={(event) => setSubject(event.target.value)} aria-label="Asunto del borrador" />
      <Textarea value={body} onChange={(event) => setBody(event.target.value)} className="min-h-52" aria-label="Cuerpo del borrador" />
      {dirty ? <p className="text-xs text-amber-700 dark:text-amber-300">Hay cambios manuales sin guardar.</p> : null}
      <Button
        size="sm"
        disabled={pending || !dirty || !subject.trim() || !body.trim()}
        onClick={() => run(() => saveMailDraftAction({ suggestionId: suggestion.id, subject, body }), "Nueva versión guardada")}
      >
        <Save /> Guardar
      </Button>
      <div className="space-y-2 rounded-md border bg-background/70 p-3">
        <p className="text-sm font-medium">Pedile un cambio a Luna</p>
        <Textarea value={instruction} onChange={(event) => setInstruction(event.target.value)} placeholder="Ej.: hacelo más breve y aclarale que coordinamos por WhatsApp" className="min-h-20" />
        <Button
          size="sm"
          variant="outline"
          disabled={pending || dirty || instruction.trim().length < 3}
          onClick={() => run(() => reviseMailDraftWithLunaAction({ suggestionId: suggestion.id, instruction }), "Luna creó una nueva versión")}
        >
          <Bot /> Revisar con Luna
        </Button>
        {dirty ? <p className="text-xs text-muted-foreground">Guardá la edición manual antes de pedir otra revisión.</p> : null}
      </div>
      <MailSourceBibliography sources={sources} />
      <MailDraftHistory
        revisions={suggestion.revisions}
        pending={pending}
        onRestore={(item) => run(() => restoreMailDraftRevisionAction({ suggestionId: suggestion.id, revisionId: item.id }), `Versión ${item.revision} restaurada`)}
      />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={pending || dirty} onClick={() => run(() => feedback("USEFUL"), "Marcado como útil")}><ThumbsUp /> Sirve</Button>
        <MailDraftNegativeFeedback disabled={pending || dirty} onSubmit={(input) => run(() => feedback("NOT_USEFUL", input), "Comentario registrado")} />
        <Button
          size="sm" variant="outline" disabled={pending || dirty}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(`${subject}\n\n${body}`);
              run(() => feedback("COPIED"), "Borrador copiado; no se marcó como aprobado ni enviado");
            } catch {
              toast.error("No se pudo copiar el borrador");
            }
          }}
        ><Clipboard /> Copiar</Button>
        <Button
          size="sm" variant="outline" disabled={pending || dirty}
          onClick={() => {
            if (window.confirm("¿Confirmás que enviaste exactamente esta versión por tu cuenta?")) run(() => feedback("EXTERNAL_SENT"), "Envío externo registrado");
          }}
        ><Send /> Envié por mi cuenta</Button>
        {replyAddress ? (
          <MailComposeDialog
            key={revision.id}
            trigger={<Button size="sm" disabled={pending || dirty}><CheckCheck /> Responder desde Bambú</Button>}
            title="Revisar y responder"
            threadId={threadId}
            inReplyToId={messageId}
            suggestionId={suggestion.id}
            draftRevisionId={revision.id}
            initialTo={replyAddress}
            initialSubject={subject}
            initialBody={body}
            groundedPrices={groundedPrices}
          />
        ) : null}
        <Button
          size="sm" variant="ghost" disabled={pending || dirty || suggestion.isComplex}
          onClick={() => {
            if (window.confirm("¿Confirmás que mensajes idénticos o muy similares pueden responderse directamente?")) run(() => createMailAutomationRuleAction(suggestion.id), "Regla de automatización creada");
          }}
        ><RefreshCw /> Perfecta: automatizar similares</Button>
      </div>
      {suggestion.manualReviewRequired ? <p className="text-xs text-amber-700 dark:text-amber-300">Requiere revisión manual antes de enviar.</p> : null}
      {!replyAddress ? <p className="text-xs text-amber-700 dark:text-amber-300">No encontramos una dirección externa para responder.</p> : null}
    </div>
  );
}
