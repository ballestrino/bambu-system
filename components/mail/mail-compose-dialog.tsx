"use client";

import { AlertTriangle, Paperclip, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";

import { sendSharedMailAction } from "@/actions/mail/send";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getGroundedPriceMismatch } from "@/lib/mail-agent/price-grounding";

type Props = {
  trigger: ReactNode;
  title?: string;
  threadId?: string;
  inReplyToId?: string;
  suggestionId?: string;
  draftRevisionId?: string;
  initialTo?: string;
  initialCc?: string;
  initialSubject?: string;
  initialBody?: string;
  groundedPrices?: number[];
};

export function MailComposeDialog({
  trigger,
  title = "Nuevo correo",
  threadId,
  inReplyToId,
  suggestionId,
  draftRevisionId,
  initialTo = "",
  initialCc = "",
  initialSubject = "",
  initialBody = "",
  groundedPrices = [],
}: Props) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(initialBody);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const priceMismatch = getGroundedPriceMismatch(body, groundedPrices);

  const submit = (formData: FormData) => {
    startTransition(async () => {
      const result = await sendSharedMailAction(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Correo enviado");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Envío compartido de Bambú. Adjuntos: máximo 4 MB en total.
          </DialogDescription>
        </DialogHeader>
        <form action={submit} className="space-y-4">
          <input type="hidden" name="threadId" value={threadId ?? ""} />
          <input type="hidden" name="inReplyToId" value={inReplyToId ?? ""} />
          <input type="hidden" name="suggestionId" value={suggestionId ?? ""} />
          <input type="hidden" name="draftRevisionId" value={draftRevisionId ?? ""} />
          <div className="grid gap-2">
            <Label htmlFor="mail-to">Para</Label>
            <Input id="mail-to" name="to" defaultValue={initialTo} placeholder="cliente@ejemplo.com" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="mail-cc">CC</Label>
            <Input id="mail-cc" name="cc" defaultValue={initialCc} placeholder="Separar con comas" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="mail-subject">Asunto</Label>
            <Input id="mail-subject" name="subject" defaultValue={initialSubject} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="mail-body">Mensaje</Label>
            <Textarea id="mail-body" name="body" value={body} onChange={(event) => setBody(event.target.value)} className="min-h-56" required />
            {groundedPrices.length && priceMismatch.mismatch ? (
              <p className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-800 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                El importe editado no coincide con la fuente oficial. Revisalo antes de enviar.
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="mail-attachments" className="flex items-center gap-2">
              <Paperclip className="size-4" /> Adjuntos
            </Label>
            <Input id="mail-attachments" name="attachments" type="file" multiple />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              <Send /> {pending ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
