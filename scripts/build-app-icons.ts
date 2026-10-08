import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { decodePng, flattenOnWhite, scalePng } from "./decode-png";
import { encodeRgbPng } from "./encode-png";

const SOURCE = "public/images/logo.png";

// logoShare es la fracción del alto del ícono que ocupa el logo. El maskable
// deja el logo dentro de la zona segura circular (80 % del lado).
const ICONS = [
  { logoShare: 0.66, path: "app/apple-icon.png", size: 180 },
  { logoShare: 0.66, path: "public/icons/icon-192.png", size: 192 },
  { logoShare: 0.66, path: "public/icons/icon-512.png", size: 512 },
  { logoShare: 0.56, path: "public/icons/icon-maskable-512.png", size: 512 },
];

const logo = decodePng(readFileSync(SOURCE));

for (const icon of ICONS) {
  const targetHeight = Math.round(icon.size * icon.logoShare);
  const targetWidth = Math.round((logo.width * targetHeight) / logo.height);
  const scaled = scalePng(logo, targetWidth);
  const logoRgb = flattenOnWhite(scaled);

  const canvas = Buffer.alloc(icon.size * icon.size * 3, 255);
  const left = Math.floor((icon.size - scaled.width) / 2);
  const top = Math.floor((icon.size - scaled.height) / 2);
  for (let row = 0; row < scaled.height; row += 1) {
    logoRgb.copy(
      canvas,
      ((top + row) * icon.size + left) * 3,
      row * scaled.width * 3,
      (row + 1) * scaled.width * 3
    );
  }

  mkdirSync(dirname(icon.path), { recursive: true });
  writeFileSync(icon.path, encodeRgbPng(icon.size, icon.size, canvas));
  console.log(
    `${icon.path}: ${icon.size}x${icon.size}, logo ${scaled.width}x${scaled.height}`
  );
}
