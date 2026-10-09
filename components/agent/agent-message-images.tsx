import type { FileUIPart } from "ai";

import { cn } from "@/lib/utils";

// Las imágenes de un mensaje del usuario. Vienen de /api/agent/attachments,
// que pide sesión: next/image no las puede optimizar. Tocar una la abre
// entera en otra pestaña.
export function AgentMessageImages({ images }: { images: FileUIPart[] }) {
  if (!images.length) return null;
  const single = images.length === 1;
  return (
    <div className={cn("grid gap-1", single ? "grid-cols-1" : "grid-cols-3")}>
      {images.map((image) => (
        <a
          key={image.url}
          href={image.url}
          target="_blank"
          rel="noreferrer"
          className="block overflow-hidden rounded-xl bg-ops-surface/10"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url}
            alt={image.filename || "Imagen adjunta"}
            loading="lazy"
            className={cn("w-full object-cover", single ? "max-h-72" : "aspect-square")}
          />
        </a>
      ))}
    </div>
  );
}
