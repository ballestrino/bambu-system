"use client";

import { Loader2, X } from "lucide-react";

import type { ComposerImage } from "@/components/agent/hooks/use-composer-images";
import { AGENT_MAX_IMAGES } from "@/lib/agent/attachment-rules";

// Las imágenes elegidas, antes de enviar: se ven achicadas, con un indicador
// mientras se suben y una X para quitarlas.
export function AgentComposerImages({
  images,
  onRemove,
}: {
  images: ComposerImage[];
  onRemove: (localId: string) => void;
}) {
  if (!images.length) return null;
  return (
    <div className="flex items-center gap-2 overflow-x-auto px-1.5 pt-1.5 pb-1">
      {images.map((image) => (
        <div key={image.localId} className="relative size-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
          {image.previewUrl && (
            // Vista previa local (blob:): next/image no la optimiza.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image.previewUrl} alt={image.name || "Imagen adjunta"} className="size-full object-cover" />
          )}
          {!image.part && (
            <span className="absolute inset-0 grid place-items-center bg-background/60" aria-label="Subiendo imagen">
              <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
            </span>
          )}
          <button
            type="button"
            onClick={() => onRemove(image.localId)}
            className="absolute top-0.5 right-0.5 grid size-6 place-items-center rounded-full bg-background/90 text-foreground shadow-sm ring-1 ring-border hover:bg-background"
            aria-label={`Quitar ${image.name || "imagen"}`}
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      ))}
      <span className="shrink-0 px-1 text-xs tabular-nums text-muted-foreground">
        {images.length}/{AGENT_MAX_IMAGES}
      </span>
    </div>
  );
}
