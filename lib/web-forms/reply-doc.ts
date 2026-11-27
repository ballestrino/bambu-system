import { z } from "zod";

// El mensaje de una respuesta con formato: el documento del editor (Tiptap)
// con párrafos, saltos de línea, listas con viñetas o numeradas, negrita,
// cursiva y tamaño. Puro: lo usan el composer, el esquema, el envío y el
// check. El HTML del correo se arma acá, escapando el texto: nunca se manda
// HTML que venga del navegador.
export const REPLY_FONT_SIZES = [
  { id: "small", label: "Chico", css: "13px" },
  { id: "normal", label: "Normal", css: null },
  { id: "large", label: "Grande", css: "18px" },
  { id: "huge", label: "Muy grande", css: "22px" },
] as const;

const ALLOWED_SIZES = new Set<string>(REPLY_FONT_SIZES.flatMap((size) => (size.css ? [size.css] : [])));

type Mark = { type: string; attrs?: Record<string, unknown> | null };
type Inline = { type: "text"; text: string; marks?: Mark[] | null } | { type: "hardBreak" };
type Paragraph = { type: "paragraph"; content?: Inline[] | null };
type ListItem = { type: "listItem"; content: Block[] };
type BulletList = { type: "bulletList"; content: ListItem[] };
type OrderedList = { type: "orderedList"; attrs?: { start?: number | null } | null; content: ListItem[] };
type Block = Paragraph | BulletList | OrderedList;
export type ReplyDoc = { type: "doc"; content: Block[] };

const LIMIT = 2000;

const markSchema = z.object({ type: z.string().max(40), attrs: z.record(z.string(), z.unknown()).nullish() });

const inlineSchema = z.union([
  z.object({ type: z.literal("text"), text: z.string().max(10000), marks: z.array(markSchema).max(10).nullish() }),
  z.object({ type: z.literal("hardBreak") }),
]);

const paragraphSchema = z.object({ type: z.literal("paragraph"), content: z.array(inlineSchema).max(LIMIT).nullish() });

// Las listas se pueden anidar (Tab en el editor).
const blockSchema: z.ZodType<Block> = z.lazy(() => z.union([paragraphSchema, bulletListSchema, orderedListSchema]));

const listItemSchema: z.ZodType<ListItem> = z.lazy(() =>
  z.object({ type: z.literal("listItem"), content: z.array(blockSchema).min(1).max(50) })
);

const bulletListSchema: z.ZodType<BulletList> = z.lazy(() =>
  z.object({ type: z.literal("bulletList"), content: z.array(listItemSchema).min(1).max(LIMIT) })
);

const orderedListSchema: z.ZodType<OrderedList> = z.lazy(() =>
  z.object({
    type: z.literal("orderedList"),
    attrs: z.object({ start: z.number().int().min(0).max(100000).nullish() }).nullish(),
    content: z.array(listItemSchema).min(1).max(LIMIT),
  })
);

export const replyDocSchema: z.ZodType<ReplyDoc> = z.object({
  type: z.literal("doc"),
  content: z.array(blockSchema).max(LIMIT),
});

const inlineText = (node: Inline) => (node.type === "text" ? node.text : "\n");

const paragraphText = (paragraph: Paragraph) => (paragraph.content ?? []).map(inlineText).join("");

// Texto plano: un párrafo por línea; las listas con "- " o "1. ", con dos
// espacios por nivel.
const blockLines = (block: Block, indent: string): string[] => {
  if (block.type === "paragraph") return [`${indent}${paragraphText(block)}`];
  const start = block.type === "orderedList" ? block.attrs?.start ?? 1 : 1;
  return block.content.flatMap((item, index) => {
    const marker = block.type === "orderedList" ? `${start + index}. ` : "- ";
    const [first, ...rest] = item.content.flatMap((child) => blockLines(child, `${indent}  `));
    return [`${indent}${marker}${(first ?? "").trimStart()}`, ...rest];
  });
};

export const replyDocToText = (doc: ReplyDoc) => doc.content.flatMap((block) => blockLines(block, "")).join("\n");

export const textToReplyDoc = (text: string): ReplyDoc => ({
  type: "doc",
  content: text.split(/\r?\n/).map((line) => ({
    type: "paragraph",
    content: line ? [{ type: "text", text: line }] : [],
  })),
});

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const fontSizeOf = (marks: Mark[]) => {
  const size = marks.find((mark) => mark.type === "textStyle")?.attrs?.fontSize;
  return typeof size === "string" && ALLOWED_SIZES.has(size) ? size : null;
};

const renderInline = (node: Inline) => {
  if (node.type === "hardBreak") return "<br>";
  const marks = node.marks ?? [];
  let html = escapeHtml(node.text);
  if (marks.some((mark) => mark.type === "italic")) html = `<em>${html}</em>`;
  if (marks.some((mark) => mark.type === "bold")) html = `<strong>${html}</strong>`;
  const size = fontSizeOf(marks);
  return size ? `<span style="font-size:${size}">${html}</span>` : html;
};

const LIST_STYLE = "margin:0;padding-left:24px";

const renderBlock = (block: Block): string => {
  if (block.type === "paragraph") {
    const inner = (block.content ?? []).map(renderInline).join("");
    return `<p style="margin:0">${inner || "&nbsp;"}</p>`;
  }
  const items = block.content.map((item) => `<li>${item.content.map(renderBlock).join("")}</li>`).join("");
  if (block.type === "bulletList") return `<ul style="${LIST_STYLE}">${items}</ul>`;
  const start = block.attrs?.start ?? 1;
  return `<ol style="${LIST_STYLE}"${start !== 1 ? ` start="${start}"` : ""}>${items}</ol>`;
};

const isBlank = (block: Block) =>
  block.type === "paragraph" && (block.content ?? []).every((node) => node.type === "text" && !node.text.trim());

// Sin líneas vacías al principio ni al final (como el texto, que va con trim).
const trimBlocks = (blocks: Block[]) => {
  let start = 0;
  let end = blocks.length;
  while (start < end && isBlank(blocks[start])) start += 1;
  while (end > start && isBlank(blocks[end - 1])) end -= 1;
  return blocks.slice(start, end);
};

// Párrafos sin margen: una línea vacía en el editor es una línea vacía en el
// correo.
export const replyDocToHtml = (doc: ReplyDoc) => trimBlocks(doc.content).map(renderBlock).join("");
