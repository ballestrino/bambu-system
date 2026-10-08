"use client";

import { ImagePlus, Plus } from "lucide-react";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AGENT_MAX_IMAGES } from "@/lib/agent/attachment-rules";

// El "+" del composer. La opción es un <label> del input de archivos (que vive
// fuera del menú): Safari en iOS solo abre el selector desde un toque real, no
// desde un click() por código.
export function AgentAttachMenu({
  disabled,
  full,
  onFiles,
}: {
  disabled: boolean;
  full: boolean;
  onFiles: (files: FileList) => void;
}) {
  const inputId = useId();
  return (
    <>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          if (event.target.files?.length) onFiles(event.target.files);
          // Elegir la misma imagen de nuevo vuelve a disparar el cambio.
          event.target.value = "";
        }}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 shrink-0 rounded-full"
            disabled={disabled}
            aria-label="Adjuntar"
          >
            <Plus aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top">
          <DropdownMenuItem asChild disabled={full}>
            <label htmlFor={inputId} className="cursor-pointer">
              <ImagePlus aria-hidden />
              Subir imágenes
              <span className="ml-auto pl-3 text-xs text-muted-foreground">
                {full ? "Máximo alcanzado" : `hasta ${AGENT_MAX_IMAGES}`}
              </span>
            </label>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
