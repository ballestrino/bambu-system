"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";

import { opsSurface } from "@/components/ops/shared/ops-theme";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useWebFormMutations } from "@/components/web-forms/hooks/use-web-forms";
import { defaultReplyBody, defaultReplySubject, WEB_FORM_SIGNATURE, type WebFormKindValue } from "@/lib/web-forms/reply-text";
import { cn } from "@/lib/utils";

type ComposerForm = { id: string; kind: WebFormKindValue; name: string; email: string; message: string };

const newRequestId = () => crypto.randomUUID();

// Responder por correo desde contacto@. La firma y la cita del mensaje se
// agregan al mandar. Un id por respuesta: doble clic no la manda dos veces.
export function WebFormComposer({ form }: { form: ComposerForm }) {
  const { reply } = useWebFormMutations();
  const [subject, setSubject] = useState(() => defaultReplySubject(form.kind));
  const [body, setBody] = useState(() => defaultReplyBody(form.name));
  const [quoteOriginal, setQuoteOriginal] = useState(true);
  const [requestId, setRequestId] = useState(newRequestId);
  const greetingOnly = body.trim() === defaultReplyBody(form.name).trim();

  const send = () =>
    reply.mutate(
      { id: form.id, requestId, subject, body, quoteOriginal },
      {
        onSuccess: () => {
          setBody(defaultReplyBody(form.name));
          setRequestId(newRequestId());
        },
      }
    );

  return (
    <section className={cn(opsSurface.panel, "space-y-3 p-4 md:p-5")} aria-label="Responder por correo">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-ops-text">Responder por correo</h3>
        <p className="text-xs text-ops-text-muted">
          De contacto@bambu-servicios.com a <span className="font-medium text-ops-text">{form.email}</span>
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="web-form-subject">Asunto</Label>
        <Input id="web-form-subject" value={subject} maxLength={200} onChange={(event) => setSubject(event.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="web-form-body">Mensaje</Label>
        <Textarea
          id="web-form-body"
          value={body}
          maxLength={10000}
          rows={8}
          className="min-h-40 resize-y"
          onChange={(event) => setBody(event.target.value)}
        />
        <p className="whitespace-pre-line text-xs text-ops-text-muted">{WEB_FORM_SIGNATURE}</p>
      </div>

      {form.message.trim() && (
        <div className="flex items-center gap-2">
          <Checkbox id="web-form-quote" checked={quoteOriginal} onCheckedChange={(value) => setQuoteOriginal(value === true)} />
          <Label htmlFor="web-form-quote" className="font-normal text-ops-text-muted">
            Incluir su mensaje al final
          </Label>
        </div>
      )}

      <div className="flex justify-end">
        <Button className="min-h-11 sm:min-h-9" disabled={reply.isPending || greetingOnly || !subject.trim()} onClick={send}>
          {reply.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
          {reply.isPending ? "Enviando…" : "Enviar respuesta"}
        </Button>
      </div>
    </section>
  );
}
