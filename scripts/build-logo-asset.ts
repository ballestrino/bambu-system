import { deflateSync } from "node:zlib";
import { readFileSync, writeFileSync } from "node:fs";

import { decodePng, flattenOnWhite, scalePng } from "./decode-png";

const SOURCE = "public/images/logo.png";
const TARGET = "lib/pdf/bambu-logo-asset.ts";
const TARGET_WIDTH = 140;

const source = decodePng(readFileSync(SOURCE));
const scaled = scalePng(source, TARGET_WIDTH);
const rgb = flattenOnWhite(scaled);
const hex = deflateSync(rgb, { level: 9 }).toString("hex");

const file = `// Generado por \`pnpm asset:logo\` desde ${SOURCE}. No editar a mano.
// RGB de 8 bits aplanado sobre blanco, listo para /ASCIIHexDecode + /FlateDecode.
import type { PdfImage } from "@/lib/pdf/simple-pdf";

export const bambuLogoImage: PdfImage = {
  height: ${scaled.height},
  hex: "${hex}",
  name: "Im1",
  width: ${scaled.width},
};
`;

writeFileSync(TARGET, file);

console.log(
  `Logo ${source.width}x${source.height} -> ${scaled.width}x${scaled.height}, ` +
    `${rgb.length} bytes RGB, ${hex.length} caracteres hex, escrito en ${TARGET}`
);
