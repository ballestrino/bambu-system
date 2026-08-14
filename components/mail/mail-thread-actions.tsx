"use client";

import { Archive, FolderInput, Mail, MailOpen, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import {
  moveMailThreadAction,
  setMailThreadArchivedAction,
  setMailThreadReadAction,
} from "@/actions/mail/threads";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MailThreadActions({
  threadId,
  unread,
  archived,
  currentFolderKey,
  folders,
}: {
  threadId: string;
  unread: boolean;
  archived: boolean;
  currentFolderKey?: string;
  folders: Array<{ key: string; label: string }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<{ success?: boolean; error?: string }>) => {
    startTransition(async () => {
      const result = await action();
      if (result.error) toast.error(result.error);
      else router.refresh();
    });
  };
  const move = (folderKey: string) => {
    startTransition(async () => {
      const result = await moveMailThreadAction(threadId, folderKey);
      if (result.error || !result.destination) {
        toast.error(result.error || "No se pudo mover");
        return;
      }
      toast.success(`Movido a ${result.destination.label}`);
      router.refresh();
    });
  };
  const archiveAvailable = folders.some(({ key }) => key === "ARCHIVE");
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => run(() => setMailThreadReadAction(threadId, unread))}
      >
        {unread ? <MailOpen /> : <Mail />}
        {unread ? "Marcar leída" : "Marcar no leída"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pending || (!archived && !archiveAvailable)}
        title={!archived && !archiveAvailable ? "Hostinger no informó una carpeta Archivo" : undefined}
        onClick={() => run(() => setMailThreadArchivedAction(threadId, !archived))}
      >
        {archived ? <Undo2 /> : <Archive />}
        {archived ? "Restaurar" : "Archivar"}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" disabled={pending}>
            <FolderInput /> Mover a
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-h-72 w-72 overflow-y-auto">
          <DropdownMenuLabel>Mover hilo a carpeta</DropdownMenuLabel>
          {folders.map((folder) => (
            <DropdownMenuItem
              key={folder.key}
              disabled={folder.key === currentFolderKey}
              onSelect={() => move(folder.key)}
            >
              {folder.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
