"use client";

import type { FileUIPart } from "ai";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { uploadAgentImage } from "@/components/agent/agent-uploads";
import { AGENT_MAX_IMAGES, TOO_MANY_IMAGES_MESSAGE } from "@/lib/agent/attachment-rules";
import { compressImage } from "@/lib/agent/image-compress";

// Una imagen del composer: se achica y se sube apenas se elige, así enviar
// no espera. previewUrl es la versión achicada (null mientras se procesa).
export type ComposerImage = {
  localId: string;
  name: string;
  previewUrl: string | null;
  part: FileUIPart | null;
};

let nextLocalId = 0;

export const useComposerImages = () => {
  const [images, setImages] = useState<ComposerImage[]>([]);
  const previews = useRef(new Set<string>());

  const update = (localId: string, change: Partial<ComposerImage>) =>
    setImages((current) => current.map((image) => (image.localId === localId ? { ...image, ...change } : image)));

  // Las vistas previas se liberan al vaciar el composer o al desmontarlo.
  const drop = (localId: string) => setImages((current) => current.filter((item) => item.localId !== localId));

  const process = async (localId: string, file: File) => {
    try {
      const compressed = await compressImage(file);
      const previewUrl = URL.createObjectURL(compressed.blob);
      previews.current.add(previewUrl);
      update(localId, { previewUrl });
      const part = await uploadAgentImage(compressed, file.name);
      update(localId, { part });
    } catch (error) {
      toast.error(`${file.name || "Imagen"}: ${error instanceof Error ? error.message : "no se pudo adjuntar."}`);
      drop(localId);
    }
  };

  // Las que no entran en el tope de 7 no se agregan, y se avisa.
  const add = (files: FileList | File[]) => {
    const chosen = [...files].filter((file) => file.type.startsWith("image/") || file.type === "");
    const free = AGENT_MAX_IMAGES - images.length;
    if (chosen.length > free) toast.error(TOO_MANY_IMAGES_MESSAGE);
    const accepted = chosen.slice(0, Math.max(free, 0)).map((file) => ({
      file,
      image: { localId: `img-${nextLocalId++}`, name: file.name, previewUrl: null, part: null },
    }));
    if (!accepted.length) return;
    setImages((current) => [...current, ...accepted.map(({ image }) => image)]);
    accepted.forEach(({ file, image }) => void process(image.localId, file));
  };

  // Una quitada antes de enviar queda subida sin mensaje: el servidor la
  // borra a las 24 horas.
  const remove = drop;

  const clear = () => {
    previews.current.forEach((url) => URL.revokeObjectURL(url));
    previews.current.clear();
    setImages([]);
  };

  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const parts = images.flatMap((image) => (image.part ? [image.part] : []));
  return {
    images,
    parts,
    uploading: images.some((image) => !image.part),
    full: images.length >= AGENT_MAX_IMAGES,
    add,
    remove,
    clear,
  };
};
