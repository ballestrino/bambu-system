"use client";

import { useState } from "react";
import { ThumbsDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FeedbackInput = {
  reason: "incorrecto" | "incompleto" | "tono" | "riesgoso" | "otro";
  comment?: string;
};

export function MailDraftNegativeFeedback({
  disabled,
  onSubmit,
}: {
  disabled: boolean;
  onSubmit: (input: FeedbackInput) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<FeedbackInput["reason"]>("incorrecto");
  const [comment, setComment] = useState("");
  if (!open) {
    return (
      <Button size="sm" variant="ghost" disabled={disabled} onClick={() => setOpen(true)}>
        <ThumbsDown /> No sirve
      </Button>
    );
  }
  return (
    <div className="w-full space-y-2 rounded-md border border-destructive/30 p-3">
      <p className="text-sm font-medium">¿Qué habría que corregir?</p>
      <select
        className="h-9 w-full rounded-md border bg-background px-3 text-sm"
        value={reason}
        onChange={(event) => setReason(event.target.value as FeedbackInput["reason"])}
      >
        <option value="incorrecto">Tiene información incorrecta</option>
        <option value="incompleto">Está incompleto</option>
        <option value="tono">El tono no sirve</option>
        <option value="riesgoso">Es riesgoso o promete de más</option>
        <option value="otro">Otro motivo</option>
      </select>
      <Input
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Comentario opcional"
        maxLength={1000}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="destructive"
          disabled={disabled}
          onClick={() => onSubmit({ reason, comment: comment.trim() || undefined })}
        >
          Registrar
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
      </div>
    </div>
  );
}
