"use client";

import { Archive, FolderInput, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MailThreadBulkToolbar({
  selectedCount,
  selectableCount,
  allSelected,
  pending,
  restore,
  archiveAvailable,
  currentFolderKey,
  folders,
  onToggleAll,
  onMove,
  onArchive,
}: {
  selectedCount: number;
  selectableCount: number;
  allSelected: boolean;
  pending: boolean;
  restore: boolean;
  archiveAvailable: boolean;
  currentFolderKey?: string;
  folders: Array<{ key: string; label: string }>;
  onToggleAll: (selected: boolean) => void;
  onMove: (folderKey: string) => void;
  onArchive: () => void;
}) {
  const hasSelection = selectedCount > 0;
  const checked = allSelected ? true : hasSelection ? "indeterminate" : false;

  return (
    <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
      <Checkbox
        checked={checked}
        disabled={pending || selectableCount === 0}
        aria-label="Seleccionar todos los correos visibles"
        onCheckedChange={(value) => onToggleAll(value === true)}
      />
      <span className="mr-auto text-xs text-muted-foreground">
        {hasSelection ? `${selectedCount} seleccionados` : "Seleccionar visibles"}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" disabled={pending || !hasSelection}>
            <FolderInput /> Mover
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-h-72 w-72 overflow-y-auto">
          <DropdownMenuLabel>Mover seleccionados a</DropdownMenuLabel>
          {folders.map((folder) => (
            <DropdownMenuItem
              key={folder.key}
              disabled={folder.key === currentFolderKey}
              onSelect={() => onMove(folder.key)}
            >
              {folder.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        size="sm"
        variant="outline"
        disabled={pending || !hasSelection || (!restore && !archiveAvailable)}
        onClick={onArchive}
      >
        {restore ? <Undo2 /> : <Archive />}
        {restore ? "Restaurar" : "Archivar"}
      </Button>
    </div>
  );
}
