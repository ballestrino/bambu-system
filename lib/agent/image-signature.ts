import type { AgentImageMediaType } from "@/lib/agent/attachment-rules";

// El formato real de una imagen por sus primeros bytes. Puro: lo prueba el
// check. La ruta no confía en el tipo que manda el navegador: guarda y sirve
// solo lo que de verdad es JPEG, PNG o WEBP.
const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) =>
  signature.every((byte, index) => bytes[offset + index] === byte);

export const detectImageMediaType = (bytes: Uint8Array): AgentImageMediaType | null => {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  // "RIFF" ···· "WEBP"
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) {
    return "image/webp";
  }
  return null;
};
