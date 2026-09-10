import { PDF_PAGE } from "@/lib/pdf/simple-pdf";

// Equivalentes en RGB 0-1 de los tokens --ops-* de app/globals.css.
export const scheduleColors = {
  bamboo: "0.32 0.60 0.37",
  bambooSoft: "0.92 0.96 0.93",
  bambooStrong: "0.14 0.30 0.18",
  border: "0.86 0.89 0.85",
  muted: "0.40 0.45 0.41",
  text: "0.09 0.15 0.11",
} as const;

export const scheduleLayout = {
  bottomLimit: 58,
  contentWidth: PDF_PAGE.width - 44 * 2,
  margin: 44,
  rightEdge: PDF_PAGE.width - 44,
} as const;

// x de cada columna y ancho util para el ajuste de texto.
export const scheduleColumns = {
  address: { width: 152, x: 274 },
  schedule: { width: 68, x: 52 },
  teammates: { width: 110, x: 434 },
  work: { width: 144, x: 124 },
} as const;
