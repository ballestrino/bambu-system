import {
  AGENT_IMAGE_MAX_BYTES,
  AGENT_IMAGE_MAX_DIMENSION,
  AGENT_IMAGE_QUALITY,
  AGENT_IMAGE_SOURCE_MAX_BYTES,
  IMAGE_TOO_LARGE_MESSAGE,
  SOURCE_TOO_LARGE_MESSAGE,
} from "@/lib/agent/attachment-rules";

// Achica una imagen en el navegador antes de subirla: lado máximo de 1600 px
// y JPEG. Una foto de 4 MB del teléfono queda en unos 300 KB. fitWithin es
// puro (lo prueba el check); el resto necesita el DOM.
export type CompressedImage = { blob: Blob; width: number; height: number };

export const fitWithin = (width: number, height: number, max = AGENT_IMAGE_MAX_DIMENSION) => {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
};

// Si a la calidad normal todavía pesa demasiado, se prueba una más baja.
const FALLBACK_QUALITY = 0.6;

const loadImage = async (url: string) => {
  const image = new Image();
  image.src = url;
  try {
    await image.decode();
  } catch {
    throw new Error("No se pudo abrir la imagen: el formato no es compatible con este navegador.");
  }
  return image;
};

const toJpeg = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));

export const compressImage = async (file: File): Promise<CompressedImage> => {
  if (file.size > AGENT_IMAGE_SOURCE_MAX_BYTES) throw new Error(SOURCE_TOO_LARGE_MESSAGE);
  const url = URL.createObjectURL(file);
  try {
    // El navegador ya aplica la orientación EXIF al dibujar.
    const image = await loadImage(url);
    const size = fitWithin(image.naturalWidth, image.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No se pudo procesar la imagen.");
    // JPEG no tiene transparencia: un PNG transparente queda sobre blanco.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size.width, size.height);
    context.drawImage(image, 0, 0, size.width, size.height);

    let blob = await toJpeg(canvas, AGENT_IMAGE_QUALITY);
    if (blob && blob.size > AGENT_IMAGE_MAX_BYTES) blob = await toJpeg(canvas, FALLBACK_QUALITY);
    if (!blob) throw new Error("No se pudo procesar la imagen.");
    if (blob.size > AGENT_IMAGE_MAX_BYTES) throw new Error(IMAGE_TOO_LARGE_MESSAGE);
    return { blob, ...size };
  } finally {
    URL.revokeObjectURL(url);
  }
};
