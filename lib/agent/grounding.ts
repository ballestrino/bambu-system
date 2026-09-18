import { LITERAL_E_NOTE } from "@/lib/agent/business-profile";
import { roundMoney } from "@/lib/agent/tool-result";
import {
  extractQuotedMoneyAmounts,
  getGroundedPriceMismatch,
} from "@/lib/mail-agent/price-grounding";

// Qué importes puede citar el agente: los que devolvió una tool en esta
// conversación. Las tools que dan importes los declaran en `grounding`, así
// esto no depende de la forma de cada salida.
export type OfficialSource = {
  sourceOptionId: string;
  officialBudgetId: string;
  name: string;
  version: number;
  hasProducts: boolean;
  prices: { net: number; ivaAmount: number; final: number; hourlyNet: number };
};

export type ToolGrounding = { amounts: number[]; sources?: OfficialSource[] };

export type Grounding = {
  evidence: Map<string, OfficialSource>;
  amounts: Set<number>;
};

export const createGrounding = (): Grounding => ({ evidence: new Map(), amounts: new Set() });

export const addGroundedAmounts = (grounding: Grounding, amounts: number[]) =>
  amounts
    .filter((amount) => Number.isFinite(amount))
    .forEach((amount) => grounding.amounts.add(roundMoney(amount)));

export const addToolGrounding = (grounding: Grounding, toolGrounding: ToolGrounding) => {
  addGroundedAmounts(grounding, toolGrounding.amounts);
  toolGrounding.sources?.forEach((source) => {
    grounding.evidence.set(source.sourceOptionId, source);
    addGroundedAmounts(grounding, Object.values(source.prices));
  });
};

type PersistedPart = { type: string; state?: string; output?: unknown };

const readToolGrounding = (output: unknown): ToolGrounding | null => {
  if (!output || typeof output !== "object" || !("ok" in output) || !output.ok) return null;
  const data = (output as { data?: { grounding?: ToolGrounding } }).data;
  return data?.grounding && Array.isArray(data.grounding.amounts) ? data.grounding : null;
};

// Reconstruye la evidencia desde las partes tool-* guardadas, así sobrevive
// entre turnos y recargas. Si el historial se recorta, lo que queda afuera ya
// no se puede citar y draftEmail falla en seguro.
export const collectGroundingFromMessages = (messages: { parts: PersistedPart[] }[]) => {
  const grounding = createGrounding();
  messages.forEach((message) =>
    message.parts.forEach((part) => {
      if (!part.type.startsWith("tool-") || part.state !== "output-available") return;
      const toolGrounding = readToolGrounding(part.output);
      if (toolGrounding) addToolGrounding(grounding, toolGrounding);
    })
  );
  return grounding;
};

const normalizeNote = (text: string) =>
  text.replace(/[*_~`]/g, "").replace(/\s+/g, " ").trim().toLocaleLowerCase("es-UY");

export const includesLiteralENote = (body: string) =>
  normalizeNote(body).includes(normalizeNote(LITERAL_E_NOTE));

export type EmailDraftCheck =
  | { ok: true; quotedAmounts: number[] }
  | { ok: false; code: "ungrounded_price" | "price_mismatch" | "missing_literal_e"; message: string };

// Un borrador para un cliente solo puede citar importes con fuente, y si cita
// alguno lleva la nota de Literal E.
export const validateEmailDraft = (body: string, grounding: Grounding): EmailDraftCheck => {
  const quotedAmounts = extractQuotedMoneyAmounts(body);
  if (!quotedAmounts.length) return { ok: true, quotedAmounts };
  if (!grounding.amounts.size) {
    return {
      ok: false,
      code: "ungrounded_price",
      message: "El borrador cita importes y no hay ninguno con fuente en esta conversación.",
    };
  }
  const { mismatch, mismatches } = getGroundedPriceMismatch(body, [...grounding.amounts]);
  if (mismatch) {
    return {
      ok: false,
      code: "price_mismatch",
      message: `Estos importes no salen de ninguna fuente: ${mismatches.join(", ")}.`,
    };
  }
  if (!includesLiteralENote(body)) {
    return {
      ok: false,
      code: "missing_literal_e",
      message: "Falta la nota de Literal E debajo de los precios.",
    };
  }
  return { ok: true, quotedAmounts };
};
