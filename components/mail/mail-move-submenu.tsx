"use client";

import { FolderInput } from "lucide-react";

import {
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";

export function MailMoveSubmenu({
  folders,
  currentFolderKey,
  disabled,
  onMove,
}: {
  folders: Array<{ key: string; label: string }>;
  currentFolderKey?: string;
  disabled?: boolean;
  onMove: (folderKey: string) => void;
}) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger disabled={disabled}>
        <FolderInput /> Mover a
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent className="max-h-72 w-72 overflow-y-auto">
          {folders.map((folder) => (
            <DropdownMenuItem
              key={folder.key}
              disabled={folder.key === currentFolderKey}
              onSelect={() => onMove(folder.key)}
            >
              {folder.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
