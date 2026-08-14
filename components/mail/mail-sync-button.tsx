"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { syncSharedMailboxAction } from "@/actions/mail/sync";
import { Button } from "@/components/ui/button";

export function MailSyncButton({ disabled = false }: { disabled?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const sync = () => {
    startTransition(async () => {
      const result = await syncSharedMailboxAction();
      if (result.error || !result.result) {
        toast.error(result.error || "No se pudo revisar la bandeja");
      } else if (result.result.skipped) toast.info("Ya hay una revisión en curso");
      else {
        const { importedCount, updatedCount, initialImportDone } = result.result;
        const changed = importedCount + updatedCount;
        const detail = changed
          ? `${changed} mensaje${changed === 1 ? "" : "s"} actualizado${changed === 1 ? "" : "s"}.`
          : "No había mensajes nuevos.";
        if (initialImportDone) toast.success(`Bandeja revisada. ${detail}`);
        else toast.info(`${detail} Todavía quedan correos históricos; volvé a revisar.`);
      }
      router.refresh();
    });
  };

  return (
    <Button variant="outline" onClick={sync} disabled={disabled || pending}>
      <RefreshCw className={pending ? "animate-spin" : ""} />
      {pending ? "Revisando..." : "Volver a revisar"}
    </Button>
  );
}
