"use client";

import { ChevronDown, FolderClosed } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MailFolderNav({
  folders,
  currentFolderKey,
}: {
  folders: Array<{ key: string; label: string }>;
  currentFolderKey?: string;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="space-y-1 rounded-lg border p-2">
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs font-semibold text-muted-foreground hover:bg-muted"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
      >
        <FolderClosed className="size-3.5" />
        <span className="flex-1">Carpetas</span>
        <ChevronDown
          className={cn("size-3.5 transition-transform", !expanded && "-rotate-90")}
        />
      </button>
      {expanded ? (
        <div className="max-h-44 space-y-1 overflow-y-auto">
          {folders.map((folder) => (
            <Button
              key={folder.key}
              variant={currentFolderKey === folder.key ? "secondary" : "ghost"}
              size="sm"
              className="h-auto w-full justify-start whitespace-normal py-1.5 text-left text-xs"
              asChild
            >
              <Link href={`/dashboard/email?view=folder&folder=${encodeURIComponent(folder.key)}`}>
                {folder.label}
              </Link>
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
