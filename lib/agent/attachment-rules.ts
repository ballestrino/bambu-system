// Límites de las imágenes y del dictado del composer. Puro: lo usan el
// navegador (antes de subir), las rutas (al recibir) y el check.

// Imágenes por mensaje.
export const AGENT_MAX_IMAGES = 7;

// El navegador achica cada imagen a este lado máximo y la pasa a JPEG. Con
// gpt-6 una imagen de 1600 × 1200 son unos 1.900 parches (unos 2.300 tokens),
// lejos del tope de 30.000 parches que OpenAI rechaza, y una captura de
// teléfono queda legible.
export const AGENT_IMAGE_MAX_DIMENSION = 1600;
export const AGENT_IMAGE_QUALITY = 0.82;

// Vercel corta todo pedido de más de 4,5 MB, así que cada imagen se sube en
// su propio pedido y el mensaje lleva solo su dirección. Ya achicada, una
// imagen pesa de 150 a 600 KB: 3 MB deja margen sin acercarse al corte.
export const AGENT_IMAGE_MAX_BYTES = 3 * 1024 * 1024;

// Un original más grande no se intenta abrir: decodificarlo en un teléfono
// puede quedarse sin memoria.
export const AGENT_IMAGE_SOURCE_MAX_BYTES = 30 * 1024 * 1024;

// Formatos que acepta OpenAI y que guarda la ruta. El navegador manda JPEG;
// el GIF queda afuera porque OpenAI no acepta los animados.
export const AGENT_IMAGE_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type AgentImageMediaType = (typeof AGENT_IMAGE_MEDIA_TYPES)[number];

export const isAgentImageMediaType = (value: string): value is AgentImageMediaType =>
  (AGENT_IMAGE_MEDIA_TYPES as readonly string[]).includes(value);

// Las imágenes se sirven por una ruta con sesión, nunca como data URL en el
// mensaje: el historial queda liviano y el navegador las cachea.
export const AGENT_ATTACHMENTS_API = "/api/agent/attachments";

export const AGENT_ATTACHMENT_ID_PATTERN = /^[a-z0-9]{20,40}$/;

const ATTACHMENT_URL_PATTERN = /^\/api\/agent\/attachments\/([a-z0-9]{20,40})$/;

export const agentAttachmentUrl = (id: string) => `${AGENT_ATTACHMENTS_API}/${id}`;

export const parseAgentAttachmentId = (url: string) => url.match(ATTACHMENT_URL_PATTERN)?.[1] ?? null;

// Los ids de las imágenes de un mensaje, en orden y sin repetir.
export const getAttachmentIds = (parts: readonly { type: string; url?: string }[]) => [
  ...new Set(
    parts.flatMap((part) => {
      const id = part.type === "file" && part.url ? parseAgentAttachmentId(part.url) : null;
      return id ? [id] : [];
    })
  ),
];

// Dictado: notas cortas. A los 2 minutos la grabación se corta sola.
export const AGENT_MAX_RECORDING_SECONDS = 120;

// Opus a 32 kbps son unos 480 KB en 2 minutos y AAC del iPhone, cerca de 1 MB.
// OpenAI acepta hasta 25 MB; el tope real es el de Vercel.
export const AGENT_AUDIO_MAX_BYTES = 4 * 1024 * 1024;

// Lo que graba cada navegador (Chrome y Firefox webm, Safari mp4) y la
// extensión con la que OpenAI reconoce el formato. Ogg no lo acepta.
const AUDIO_EXTENSIONS: Readonly<Record<string, string>> = {
  "audio/webm": "webm",
  "audio/mp4": "mp4",
  "audio/x-m4a": "m4a",
  "audio/m4a": "m4a",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
};

// "audio/webm;codecs=opus" → "webm". null = formato que OpenAI no acepta.
export const getAudioExtension = (mediaType: string) => {
  const base = mediaType.split(";")[0].trim().toLowerCase();
  return Object.hasOwn(AUDIO_EXTENSIONS, base) ? AUDIO_EXTENSIONS[base] : null;
};

// El orden importa: Safari no graba webm y Firefox graba ogg si no se le pide.
export const RECORDING_MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"] as const;

export const RECORDING_BITS_PER_SECOND = 32_000;

const megabytes = (bytes: number) =>
  `${(bytes / (1024 * 1024)).toLocaleString("es-UY", { maximumFractionDigits: 1 })} MB`;

export const IMAGE_TOO_LARGE_MESSAGE = `La imagen pesa más de ${megabytes(AGENT_IMAGE_MAX_BYTES)} aun achicada.`;
export const SOURCE_TOO_LARGE_MESSAGE = `La imagen pesa más de ${megabytes(AGENT_IMAGE_SOURCE_MAX_BYTES)}.`;
export const AUDIO_TOO_LARGE_MESSAGE = `El audio pesa más de ${megabytes(AGENT_AUDIO_MAX_BYTES)}.`;
export const TOO_MANY_IMAGES_MESSAGE = `Podés adjuntar hasta ${AGENT_MAX_IMAGES} imágenes por mensaje.`;
