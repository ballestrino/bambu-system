// El CV de "Trabajá con nosotros": PDF o Word. Se mira el contenido y no solo
// el tipo que declara el navegador, y el nombre se limpia antes de guardarlo.
// Puro: lo usan la ruta y el check.
export const WEB_FORM_MAX_FILE_BYTES = 4 * 1024 * 1024;

const PDF = "application/pdf";
const DOC = "application/msword";
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const EXTENSION_BY_TYPE = { [PDF]: "pdf", [DOC]: "doc", [DOCX]: "docx" } as const;

type CvType = keyof typeof EXTENSION_BY_TYPE;

const startsWith = (bytes: Uint8Array, signature: number[]) =>
  signature.every((value, index) => bytes[index] === value);

// %PDF, OLE (Word 97-2003) y ZIP (docx). Un ZIP que no sea docx pasa como
// docx: se sirve como descarga y nunca se abre en la página.
export const detectCvType = (bytes: Uint8Array): CvType | null => {
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46])) return PDF;
  if (startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return DOC;
  if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) return DOCX;
  return null;
};

export const sanitizeCvFilename = (name: string, type: CvType) => {
  const extension = EXTENSION_BY_TYPE[type];
  const base = (name.split(/[\\/]/).pop() ?? "")
    .normalize("NFC")
    .replace(/\.[^.]*$/, "")
    .replace(/[^\p{L}\p{N} ._-]+/gu, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s.]+/, "")
    .trim()
    .slice(0, 120);
  return `${base || "curriculum"}.${extension}`;
};

export type CvCheck =
  | { ok: true; mimeType: CvType; filename: string; bytes: Uint8Array }
  | { ok: false; error: string };

export const checkCvFile = (name: string, bytes: Uint8Array): CvCheck => {
  if (bytes.byteLength === 0) return { ok: false, error: "El CV está vacío" };
  if (bytes.byteLength > WEB_FORM_MAX_FILE_BYTES) return { ok: false, error: "El CV supera los 4 MB" };
  const mimeType = detectCvType(bytes);
  if (!mimeType) return { ok: false, error: "El CV tiene que ser PDF o Word" };
  return { ok: true, mimeType, filename: sanitizeCvFilename(name, mimeType), bytes };
};
