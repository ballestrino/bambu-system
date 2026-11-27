"use client";

import type { Editor } from "@tiptap/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

import { opsSurface } from "@/components/ops/shared/ops-theme";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWebFormMutations } from "@/components/web-forms/hooks/use-web-forms";
import { saveIncludeClosing, useIncludeClosing } from "@/components/web-forms/reply-closing-preference";
import { editorText, ReplyEditor, resetEditor, setEditorMarkdown } from "@/components/web-forms/reply-editor";
import { useReplyFill, type ReplyFill } from "@/components/web-forms/reply-fill-store";
import type { ReplyDoc } from "@/lib/web-forms/reply-doc";
import { defaultReplyBody, defaultReplySubject, replySignature, type WebFormKindValue } from "@/lib/web-forms/reply-text";
import { cn } from "@/lib/utils";

type ComposerForm = {
  id: string;
  kind: WebFormKindValue;
  name: string;
  email: string;
  message: string;
  service: string | null;
};

const newRequestId = () => crypto.randomUUID();

// Responder por correo desde contacto@, con formato (reply-editor.tsx). La
// firma y la cita del mensaje se agregan al mandar. Un id por respuesta: doble
// clic no la manda dos veces.
export function WebFormComposer({ form }: { form: ComposerForm }) {
  const { reply } = useWebFormMutations();
  const [subject, setSubject] = useState(() => defaultReplySubject(form.kind, form.service));
  const [body, setBody] = useState(() => defaultReplyBody(form.name));
  const [editor, setEditor] = useState<Editor | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  // Lo que escribe el agente (fillWebFormReply) reemplaza asunto y mensaje.
  const applyFill = useCallback(
    (fill: ReplyFill) => {
      if (!editor) return;
      if (fill.subject) setSubject(fill.subject);
      setEditorMarkdown(editor, fill.body);
      setBody(editorText(editor));
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      toast.success("El agente dejó la respuesta en el campo Mensaje");
    },
    [editor]
  );
  useReplyFill(form.id, editor ? applyFill : null);
  const [quoteOriginal, setQuoteOriginal] = useState(true);
  const includeClosing = useIncludeClosing();
  const [requestId, setRequestId] = useState(newRequestId);
  const greetingOnly = body.trim() === defaultReplyBody(form.name).trim();

  const send = () => {
    if (!editor) return;
    // Una copia en JSON plano: los attrs de Tiptap no viajan bien en una
    // Server Action (la lista numerada llegaba sin su objeto attrs).
    const content = JSON.parse(JSON.stringify(editor.getJSON())) as ReplyDoc;
    reply.mutate(
      { id: form.id, requestId, subject, content, quoteOriginal, includeClosing },
      {
        onSuccess: () => {
          resetEditor(editor, defaultReplyBody(form.name));
          setBody(defaultReplyBody(form.name));
          setRequestId(newRequestId());
        },
      }
    );
  };

  return (
    <section ref={sectionRef} className={cn(opsSurface.panel, "space-y-3 p-4 md:p-5")} aria-label="Responder por correo">
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
        <Label id="web-form-body-label">Mensaje</Label>
        <ReplyEditor initialText={body} labelId="web-form-body-label" onReady={setEditor} onTextChange={setBody} />
        <p className="whitespace-pre-line text-xs text-ops-text-muted">{replySignature(includeClosing)}</p>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {form.message.trim() && (
          <div className="flex items-center gap-2">
            <Checkbox id="web-form-quote" checked={quoteOriginal} onCheckedChange={(value) => setQuoteOriginal(value === true)} />
            <Label htmlFor="web-form-quote" className="font-normal text-ops-text-muted">
              Incluir su mensaje al final
            </Label>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Checkbox id="web-form-closing" checked={includeClosing} onCheckedChange={(value) => saveIncludeClosing(value === true)} />
          <Label htmlFor="web-form-closing" className="font-normal text-ops-text-muted">
            Incluir saludo al final
          </Label>
        </div>
      </div>

      <div className="flex justify-end">
        <Button className="min-h-11 sm:min-h-9" disabled={reply.isPending || greetingOnly || !subject.trim()} onClick={send}>
          {reply.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
          {reply.isPending ? "Enviando…" : "Enviar respuesta"}
        </Button>
      </div>
    </section>
  );
}
