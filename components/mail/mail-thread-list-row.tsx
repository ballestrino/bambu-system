"use client";

import { Archive, EllipsisVertical, Undo2 } from "lucide-react";
import Link from "next/link";

import { MailMoveSubmenu } from "@/components/mail/mail-move-submenu";
import type { MailThreadListItem } from "@/components/mail/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const formatter = new Intl.DateTimeFormat("es-UY", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function MailThreadListRow({
  thread,
  href,
  selected,
  active,
  pending,
  folders,
  archiveAvailable,
  onSelect,
  onMove,
  onArchive,
}: {
  thread: MailThreadListItem;
  href: string;
  selected: boolean;
  active: boolean;
  pending: boolean;
  folders: Array<{ key: string; label: string }>;
  archiveAvailable: boolean;
  onSelect: (selected: boolean) => void;
  onMove: (folderKey: string) => void;
  onArchive: (archived: boolean) => void;
}) {
  const lastMessage = thread.messages[0];
  const archiveDisabled = !thread.canMove || (!thread.isArchived && !archiveAvailable);

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border p-2 transition-colors hover:bg-muted/60",
        active && "border-[#53985E] bg-[#F0F7F1] dark:bg-[#263123]",
        selected && "ring-1 ring-inset ring-[#53985E]"
      )}
    >
      <Checkbox
        className="mt-1"
        checked={selected}
        disabled={pending || !thread.canMove}
        aria-label={`Seleccionar ${thread.subject}`}
        onCheckedChange={(checked) => onSelect(checked === true)}
      />
      <Link href={href} className="min-w-0 flex-1 px-1 py-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("min-w-0 truncate text-sm", thread.unreadCount && "font-bold")}>
            {thread.subject}
          </p>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {formatter.format(thread.lastMessageAt)}
          </span>
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {lastMessage?.fromName || lastMessage?.fromAddress || thread.participantEmails.join(", ")}
        </p>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {lastMessage?.bodyText}
        </p>
        <div className="mt-2 flex gap-2">
          {thread.unreadCount ? <Badge>{thread.unreadCount} sin leer</Badge> : null}
          {lastMessage?.suggestion?.status === "READY" ? (
            <Badge variant="outline">Sugerencia lista</Badge>
          ) : null}
        </div>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={pending}
            aria-label={`Más acciones para ${thread.subject}`}
          >
            <EllipsisVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <MailMoveSubmenu
            folders={folders}
            currentFolderKey={thread.currentFolderKey}
            disabled={!thread.canMove}
            onMove={onMove}
          />
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={archiveDisabled}
            onSelect={() => onArchive(!thread.isArchived)}
          >
            {thread.isArchived ? <Undo2 /> : <Archive />}
            {thread.isArchived ? "Restaurar" : "Archivar"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
