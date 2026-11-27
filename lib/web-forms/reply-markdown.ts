import type { ReplyDoc } from "@/lib/web-forms/reply-doc";

// El Markdown que escribe el agente (o "Copiar como Markdown") al documento
// del editor: **negrita**, *cursiva*, listas con "- " o "1. " (dos espacios o
// más por nivel), títulos "#" como negrita y una línea en blanco entre
// bloques. Puro: lo usan el composer, el editor al pegar y el check.
type Doc = ReplyDoc["content"];
type Block = Doc[number];
type Inline = { type: "text"; text: string; marks?: { type: string }[] };

const INLINE = /(\*\*[^*\n]+?\*\*|__[^_\n]+?__|\*[^*\s][^*\n]*?\*|_[^_\s][^_\n]*?_)/g;

export const parseInlineMarkdown = (line: string): Inline[] => {
  const nodes: Inline[] = [];
  let last = 0;
  for (const match of line.matchAll(INLINE)) {
    const token = match[0];
    const index = match.index ?? 0;
    if (index > last) nodes.push({ type: "text", text: line.slice(last, index) });
    const bold = token.startsWith("**") || token.startsWith("__");
    const text = bold ? token.slice(2, -2) : token.slice(1, -1);
    nodes.push({ type: "text", text, marks: [{ type: bold ? "bold" : "italic" }] });
    last = index + token.length;
  }
  if (last < line.length) nodes.push({ type: "text", text: line.slice(last) });
  return nodes.filter((node) => node.text);
};

const paragraph = (line: string): Block => ({ type: "paragraph", content: parseInlineMarkdown(line) });

const LIST_LINE = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;

type ListLine = { depth: number; ordered: boolean; number: number; text: string };

const toListLine = (line: string): ListLine | null => {
  const match = line.match(LIST_LINE);
  if (!match) return null;
  const ordered = /\d/.test(match[2]);
  return { depth: Math.floor(match[1].replace(/\t/g, "  ").length / 2), ordered, number: ordered ? parseInt(match[2], 10) : 1, text: match[3] };
};

// Arma una lista (y sus sublistas) desde `index`; devuelve hasta dónde llegó.
const buildList = (lines: ListLine[], index: number, depth: number): { block: Block; next: number } => {
  const first = lines[index];
  const items: { type: "listItem"; content: Block[] }[] = [];
  let i = index;
  while (i < lines.length && lines[i].depth >= depth) {
    const line = lines[i];
    if (line.depth > depth && items.length) {
      const nested = buildList(lines, i, line.depth);
      items[items.length - 1].content.push(nested.block);
      i = nested.next;
      continue;
    }
    if (line.ordered !== first.ordered && line.depth === depth) break;
    items.push({ type: "listItem", content: [paragraph(line.text)] });
    i += 1;
  }
  const block: Block = first.ordered
    ? { type: "orderedList", attrs: { start: first.number }, content: items }
    : { type: "bulletList", content: items };
  return { block, next: i };
};

export const markdownToReplyDoc = (markdown: string): ReplyDoc => {
  const content: Block[] = [];
  const lines = markdown.replace(/\r\n/g, "\n").trim().split("\n");
  let i = 0;
  let blank = false;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      blank = true;
      i += 1;
      continue;
    }
    // Una línea en blanco (o varias) entre bloques queda como una sola.
    if (blank && content.length) content.push({ type: "paragraph", content: [] });
    blank = false;
    if (toListLine(line)) {
      const run: ListLine[] = [];
      for (let j = i; j < lines.length; j += 1) {
        const item = toListLine(lines[j]);
        if (!item) break;
        run.push(item);
      }
      let start = 0;
      while (start < run.length) {
        const built = buildList(run, start, run[start].depth);
        content.push(built.block);
        start = built.next;
      }
      i += run.length;
      continue;
    }
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    content.push(heading ? { type: "paragraph", content: [{ type: "text", text: heading[1], marks: [{ type: "bold" }] }] } : paragraph(line.replace(/^>\s?/, "")));
    i += 1;
  }
  return { type: "doc", content };
};

// Si un texto pegado trae Markdown (negrita, cursiva o listas).
export const looksLikeMarkdown = (text: string) => /\*\*[^*]+\*\*|__[^_]+__|^\s*([-*+]|\d+[.)])\s+\S/m.test(text);
