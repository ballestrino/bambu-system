export const PDF_PAGE = {
  height: 842,
  width: 595,
} as const;

type TextOptions = {
  align?: "left" | "right";
  bold?: boolean;
  color?: string;
};

const winAnsiCharacters: Record<string, number> = {
  "€": 128,
  "‚": 130,
  "ƒ": 131,
  "„": 132,
  "…": 133,
  "†": 134,
  "‡": 135,
  "ˆ": 136,
  "‰": 137,
  "Š": 138,
  "‹": 139,
  "Œ": 140,
  "Ž": 142,
  "‘": 145,
  "’": 146,
  "“": 147,
  "”": 148,
  "•": 149,
  "–": 150,
  "—": 151,
  "˜": 152,
  "™": 153,
  "š": 154,
  "›": 155,
  "œ": 156,
  "ž": 158,
  "Ÿ": 159,
};

const escapePdfText = (value: string) =>
  Array.from(value.replace(/\r?\n/g, " "))
    .map((character) => {
      const code = winAnsiCharacters[character] ?? character.charCodeAt(0);
      if (character === "\\" || character === "(" || character === ")") {
        return `\\${character}`;
      }
      if (code >= 32 && code <= 126) return character;
      if (code >= 128 && code <= 255) return `\\${code.toString(8).padStart(3, "0")}`;
      return "?";
    })
    .join("");

export const estimatePdfTextWidth = (value: string, size: number) =>
  Array.from(value).reduce((width, character) => {
    if (" ilI.,:;'|!".includes(character)) return width + size * 0.25;
    if ("mwMW@%".includes(character)) return width + size * 0.8;
    return width + size * 0.52;
  }, 0);

export const wrapPdfText = (value: string, maxWidth: number, size: number) => {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [""];

  return words.reduce<string[]>((lines, word) => {
    const line = lines.at(-1) ?? "";
    const candidate = line ? `${line} ${word}` : word;
    if (!line || estimatePdfTextWidth(candidate, size) <= maxWidth) {
      lines[lines.length - 1] = candidate;
    } else {
      lines.push(word);
    }
    return lines;
  }, [""]);
};

export const pdfText = (
  x: number,
  y: number,
  size: number,
  value: string,
  options: TextOptions = {}
) => {
  const resolvedX = options.align === "right"
    ? x - estimatePdfTextWidth(value, size)
    : x;
  const color = options.color ?? "0.09 0.15 0.11";
  return `${color} rg BT /${options.bold ? "F2" : "F1"} ${size} Tf ${resolvedX.toFixed(2)} ${y.toFixed(2)} Td (${escapePdfText(value)}) Tj ET\n`;
};

export const pdfRect = (
  x: number,
  y: number,
  width: number,
  height: number,
  color: string
) => `${color} rg ${x} ${y} ${width} ${height} re f\n`;

export const pdfLine = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color = "0.85 0.89 0.85"
) => `${color} RG ${x1} ${y1} m ${x2} ${y2} l S\n`;

export const buildSimplePdf = (pages: string[]) => {
  const pageStartId = 5;
  const contentStartId = pageStartId + pages.length;
  const pageIds = pages.map((_, index) => pageStartId + index);
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
  ];

  pages.forEach((_, index) => {
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_PAGE.width} ${PDF_PAGE.height}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentStartId + index} 0 R >>`
    );
  });
  pages.forEach((content) => {
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}endstream`);
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  return new TextEncoder().encode(pdf);
};
