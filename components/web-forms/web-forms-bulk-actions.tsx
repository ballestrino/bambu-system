"use client";

import { FolderInput, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWebFormMutations } from "@/components/web-forms/hooks/use-web-forms";
import type { WebFormKindTab } from "@/components/web-forms/web-forms-toolbar";
import { WEB_FORM_MAIL_FOLDERS } from "@/lib/web-forms/mail-sorting";

const KIND_NOUN: Record<WebFormKindTab, string> = {
  CONTACT: "pedidos de servicio",
  JOB_APPLICATION: "currículums",
};

const BUTTON = "min-h-11 sm:min-h-9";

// Ordenar de a muchos: en Pedidos de servicio, Detectar currículums (Haiku) y
// mover sus avisos a Solicitudes de presupuesto; en Currículums, moverlos a
// Trabaja con nosotros. Mover pide confirmación: cambia el buzón real.
export function WebFormsBulkActions({ kind }: { kind: WebFormKindTab }) {
  const { detectCurriculums, moveMail } = useWebFormMutations();
  const [confirming, setConfirming] = useState(false);
  const folder = WEB_FORM_MAIL_FOLDERS[kind];

  const move = () =>
    moveMail.mutate(
      { kind },
      { onSettled: () => setConfirming(false) }
    );

  return (
    <div className="flex flex-wrap gap-2">
      {kind === "CONTACT" && (
        <Button
          variant="outline"
          className={BUTTON}
          disabled={detectCurriculums.isPending}
          onClick={() => detectCurriculums.mutate()}
          title="Haiku lee los pedidos nuevos y pasa a Currículums los que son de alguien que busca trabajo"
        >
          {detectCurriculums.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="size-4 text-ops-bamboo" aria-hidden />
          )}
          {detectCurriculums.isPending ? "Revisando con Haiku…" : "Detectar currículums"}
        </Button>
      )}
      <Button variant="outline" className={BUTTON} disabled={moveMail.isPending} onClick={() => setConfirming(true)}>
        <FolderInput className="size-4 text-ops-bamboo" aria-hidden />
        Mover a {folder}
      </Button>

      <Dialog open={confirming} onOpenChange={(open) => !moveMail.isPending && setConfirming(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mover a {folder}</DialogTitle>
            <DialogDescription>
              Los avisos de {KIND_NOUN[kind]} que mandó la web pasan de la Bandeja de entrada de contacto@ a la carpeta
              &quot;{folder}&quot;. Esta pantalla no cambia; en el webmail se pueden volver a mover.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className={BUTTON} disabled={moveMail.isPending} onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
            <Button className={BUTTON} disabled={moveMail.isPending} onClick={move}>
              {moveMail.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <FolderInput className="size-4" aria-hidden />}
              {moveMail.isPending ? "Moviendo…" : "Mover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
