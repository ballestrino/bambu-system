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
// desde un click() por código. Mientras se dicta no se muestra.
export function AgentAttachMenu({ full, onFiles }: { full: boolean; onFiles: (files: FileList) => void }) {
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
            className="size-11 shrink-0 rounded-full text-ops-bamboo-strong hover:bg-ops-surface-muted hover:text-ops-bamboo-strong data-[state=open]:bg-ops-bamboo-soft sm:size-8 [&_svg:not([class*='size-'])]:size-[18px]"
            aria-label="Adjuntar"
          >
            <Plus aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" sideOffset={10} className="w-[250px] rounded-[14px] p-1.5 shadow-[var(--ops-shadow-elevated)]">
          <DropdownMenuItem asChild disabled={full}>
            <label htmlFor={inputId} className="min-h-11 cursor-pointer gap-2.5 rounded-[10px] px-2.5 text-sm font-medium">
              <ImagePlus className="size-[18px] text-ops-bamboo-strong" aria-hidden />
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
