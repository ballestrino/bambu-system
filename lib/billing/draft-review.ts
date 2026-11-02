import { z } from "zod";

import { BILLING_ADENDA_MAX, BILLING_ITEM_CONCEPT_MAX } from "@/schemas/billing";

// Revisión del borrador con IA (feature 52): el modelo lee las adendas y los
// detalles y sugiere cambios; no escribe nada. Una persona aplica cada uno
// desde el panel, con las acciones de siempre (compare-and-set). Puro.

export type ReviewRow = {
  adenda: string | null;
  cfeLabel: string;
  id: string;
  lines: { concepto: string; subtotal: number }[];
  // Meses (de los últimos 6) en que se le facturó a este cliente; null si no
  // se puede saber (un consumidor final sin título).
  monthsBilled: number | null;
  name: string;
  // Lo que decía la factura del mes pasado de la que se repitió.
  sourceAdenda: string | null;
  sourceConcepts: string[];
};

export const REVIEW_KINDS = ["adenda", "concepto", "remove", "note"] as const;

export const reviewOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      invoiceId: z.string(),
      kind: z.enum(REVIEW_KINDS),
      lineIndex: z.number().int().nullable(),
      proposed: z.string().nullable(),
      reason: z.string(),
    })
  ),
});

export type ReviewSuggestion = {
  current: string | null;
  // Para reconocer la factura: el detalle y el subtotal sin IVA.
  detail: string;
  id: string;
  invoiceId: string;
  kind: (typeof REVIEW_KINDS)[number];
  lineIndex: number | null;
  name: string;
  proposed: string | null;
  reason: string;
  subtotal: number;
};

export const buildReviewInstructions = (draftMonth: string, serviceMonth: string) =>
  [
    "Sos el revisor del borrador de facturas de Bambú, una empresa de limpieza de Uruguay.",
    `El borrador es de ${draftMonth}. Bambú factura a mes vencido: cada factura de ${draftMonth} cobra el servicio de ${serviceMonth}.`,
    "El borrador se armó copiando las facturas del mes pasado, así que los textos pueden haber quedado con un mes viejo o mal corrido.",
    "Revisá cada factura y sugerí solo cambios claros:",
    `1. adenda o concepto: si nombra un mes que no es ${serviceMonth} (o junta dos meses que no corresponden), proponé el texto completo corregido para que diga ${serviceMonth}. Copiá el resto igual, letra por letra, con los saltos de línea, la dirección y los nombres. Nunca cambies montos ni números. Si no nombra ningún mes, no la toques.`,
    "2. remove: si la factura es de un servicio puntual que no se repite cada mes (final de obra, limpieza única, único servicio, armado para un evento, mudanza, limpieza profunda de una vez), proponé sacarla del borrador. monthsBilled dice en cuántos de los últimos 6 meses se le facturó al cliente: 1 apoya que fue puntual, 3 o más que es mensual.",
    "3. note: algo raro que una persona tiene que mirar y que no se arregla con un texto (por ejemplo, la adenda habla de dos meses de servicio).",
    "Para adenda, proposed es la adenda completa y lineIndex es null. Para concepto, proposed es el concepto completo de esa línea (hasta 80 caracteres) y lineIndex es su número. Para remove y note, proposed es null.",
    "reason es una frase corta en español rioplatense que explica el cambio. Si no hay nada para sugerir, devolvé la lista vacía. No sugieras dos veces lo mismo.",
  ].join("\n");

export const buildReviewPrompt = (rows: ReviewRow[]) =>
  JSON.stringify(
    rows.map((row) => ({
      invoiceId: row.id,
      cliente: row.name,
      tipo: row.cfeLabel,
      adenda: row.adenda,
      lineas: row.lines.map((line, index) => ({ lineIndex: index, concepto: line.concepto, subtotalSinIva: line.subtotal })),
      monthsBilled: row.monthsBilled,
      mesPasado: { adenda: row.sourceAdenda, conceptos: row.sourceConcepts },
    })),
    null,
    1
  );

const numbersIn = (text: string) => new Set(text.match(/\d+/g) ?? []);

// Un texto corregido no puede traer números nuevos (montos, direcciones),
// salvo el año.
const keepsNumbers = (before: string, after: string) => {
  const known = numbersIn(before);
  return [...numbersIn(after)].every((value) => known.has(value) || /^20\d\d$/.test(value));
};

const normalize = (value: string) => value.replace(/\r\n/g, "\n").trim();

// Lo que vuelve del modelo, contra el borrador: una factura que no está, una
// línea que no existe, un texto igual, largo de más o con números nuevos se
// descarta. Una sola sugerencia por factura y tipo (y línea).
export const validateReviewSuggestions = (rows: ReviewRow[], raw: z.infer<typeof reviewOutputSchema>): ReviewSuggestion[] => {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const seen = new Set<string>();
  const result: ReviewSuggestion[] = [];
  for (const item of raw.suggestions) {
    const row = byId.get(item.invoiceId);
    const reason = item.reason.trim();
    if (!row || !reason) continue;
    const key = `${row.id}:${item.kind}:${item.kind === "concepto" ? item.lineIndex : ""}`;
    if (seen.has(key)) continue;

    let current: string | null = null;
    let proposed: string | null = null;
    if (item.kind === "adenda" || item.kind === "concepto") {
      const line = item.kind === "concepto" && item.lineIndex !== null ? row.lines[item.lineIndex] : undefined;
      if (item.kind === "concepto" && !line) continue;
      current = item.kind === "adenda" ? row.adenda : line!.concepto;
      proposed = item.proposed ? normalize(item.proposed) : null;
      const max = item.kind === "adenda" ? BILLING_ADENDA_MAX : BILLING_ITEM_CONCEPT_MAX;
      if (!current || !proposed || proposed === normalize(current) || proposed.length > max) continue;
      if (!keepsNumbers(current, proposed)) continue;
    }
    seen.add(key);
    result.push({
      current,
      detail: row.lines.map((line) => line.concepto).join(", ") || row.cfeLabel,
      id: key,
      invoiceId: row.id,
      kind: item.kind,
      lineIndex: item.kind === "concepto" ? item.lineIndex : null,
      name: row.name,
      proposed,
      reason: reason.slice(0, 300),
      subtotal: row.lines.reduce((sum, line) => sum + line.subtotal, 0),
    });
  }
  return result;
};
