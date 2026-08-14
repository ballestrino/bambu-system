"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  moveMailThreadsAction,
  setMailThreadsArchivedAction,
} from "@/actions/mail/threads";
import { MailThreadBulkToolbar } from "@/components/mail/mail-thread-bulk-toolbar";
import { MailThreadListRow } from "@/components/mail/mail-thread-list-row";
import type { MailThreadListItem } from "@/components/mail/types";
import type { MailboxView } from "@/data/mail-workspace";

export function MailThreadList({
  threads,
  selectedId,
  baseQuery,
  view,
  folderKey,
  folders,
}: {
  threads: MailThreadListItem[];
  selectedId?: string;
  baseQuery: string;
  view: MailboxView;
  folderKey?: string;
  folders: Array<{ key: string; label: string }>;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [pending, startTransition] = useTransition();
  const selectableIds = threads.filter(({ canMove }) => canMove).map(({ id }) => id);
  const selectedIds = selectableIds.filter((id) => selected.has(id));
  const allSelected = selectableIds.length > 0 && selectedIds.length === selectableIds.length;
  const archiveAvailable = folders.some(({ key }) => key === "ARCHIVE");
  const currentFolderKey = view === "inbox"
    ? "INBOX"
    : view === "archive"
      ? "ARCHIVE"
      : view === "folder"
        ? folderKey
        : undefined;

  const toggleThread = (threadId: string, checked: boolean) => {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(threadId);
      else next.delete(threadId);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(selectableIds) : new Set());
  };

  const move = (threadIds: string[], destinationKey: string) => {
    startTransition(async () => {
      const result = await moveMailThreadsAction(threadIds, destinationKey);
      if (result.error || !result.destination) {
        toast.error(result.error || "No se pudieron mover");
        return;
      }
      setSelected(new Set());
      toast.success(
        threadIds.length === 1
          ? `Movido a ${result.destination.label}`
          : `${threadIds.length} correos movidos a ${result.destination.label}`
      );
      router.refresh();
    });
  };

  const archive = (threadIds: string[], archived: boolean) => {
    startTransition(async () => {
      const result = await setMailThreadsArchivedAction(threadIds, archived);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setSelected(new Set());
      toast.success(
        `${threadIds.length} ${threadIds.length === 1 ? "correo" : "correos"} ${
          archived ? "archivado" : "restaurado"
        }${threadIds.length === 1 ? "" : "s"}`
      );
      router.refresh();
    });
  };

  if (!threads.length) {
    return (
      <div className="flex min-h-56 items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No hay conversaciones para estos filtros.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <MailThreadBulkToolbar
        selectedCount={selectedIds.length}
        selectableCount={selectableIds.length}
        allSelected={allSelected}
        pending={pending}
        restore={view === "archive"}
        archiveAvailable={archiveAvailable}
        currentFolderKey={currentFolderKey}
        folders={folders}
        onToggleAll={toggleAll}
        onMove={(destinationKey) => move(selectedIds, destinationKey)}
        onArchive={() => archive(selectedIds, view !== "archive")}
      />
      <div className="max-h-[68vh] space-y-1 overflow-y-auto pr-1">
        {threads.map((thread) => {
          const params = new URLSearchParams(baseQuery);
          params.set("thread", thread.id);
          return (
            <MailThreadListRow
              key={thread.id}
              thread={thread}
              href={`/dashboard/email?${params.toString()}`}
              selected={selected.has(thread.id)}
              active={selectedId === thread.id}
              pending={pending}
              folders={folders}
              archiveAvailable={archiveAvailable}
              onSelect={(checked) => toggleThread(thread.id, checked)}
              onMove={(destinationKey) => move([thread.id], destinationKey)}
              onArchive={(archived) => archive([thread.id], archived)}
            />
          );
        })}
      </div>
    </div>
  );
}
