import { BUSINESS_PROFILE, LITERAL_E_NOTE } from "@/lib/agent/business-profile";
import type { OfficialSource } from "@/lib/agent/grounding";

// Instrucciones de draftEmail. El esquema del correo viene del chat de
// presupuestos anterior (data/ai-system-message.ts), con la regla de precios
// del agente: solo importes con fuente.
const EMAIL_SCHEME = [
  "Estimado/a [Nombre del cliente],",
  "",
  "[Introducción personalizada]",
  "",
  "1. Alcance del servicio",
  "[Lista del alcance: frecuencia, horas por visita, cantidad de personas y tareas]",
  "",
  "2. Condiciones económicas",
  "[Precios según las reglas de abajo]",
  LITERAL_E_NOTE,
  "",
  "[Cierre. Por ejemplo: Quedamos atentos a sus consultas.]",
  "",
  "Saludos cordiales,",
  BUSINESS_PROFILE.signature,
  `📞 ${BUSINESS_PROFILE.phone} | 🌐 ${BUSINESS_PROFILE.website}`,
].join("\n");

const PRICE_RULES = [
  "Reglas de precios:",
  "- Con dos opciones: 'Opción 1 (sin productos)' y 'Opción 2 (con productos)', cada una con 'Precio sin IVA: $ X' y 'Precio con IVA: $ Y'.",
  "- Con una sola opción: 'Precio sin IVA: $ X' y 'Precio con IVA: $ Y'.",
  "- Si el cliente ya tiene productos o pidió sin productos, mostrá solo esa opción.",
  "- Formato de montos: $ 12.345,67.",
  `- Inmediatamente debajo de los precios va siempre, textual: "${LITERAL_E_NOTE}"`,
  "- Usá solo importes de la lista de importes permitidos. Si un importe no está, no lo escribas.",
].join("\n");

const WHATSAPP_RULES = [
  "Canal WhatsApp:",
  "- Texto plano, sin Markdown ni títulos, en párrafos cortos. Sin asunto.",
  "- Saludo breve, alcance en una o dos líneas, precios, la nota de Literal E y firma corta.",
].join("\n");

export const buildEmailDraftInstructions = (channel: "email" | "whatsapp") =>
  [
    `Redactás mensajes para clientes de ${BUSINESS_PROFILE.name}, en español rioplatense con un tono profesional y cordial.`,
    "Respondé solo con el mensaje pedido: asunto (vacío en WhatsApp) y cuerpo.",
    channel === "email" ? `Esquema del correo:\n${EMAIL_SCHEME}` : WHATSAPP_RULES,
    PRICE_RULES,
  ].join("\n\n");

const formatAmount = (amount: number) =>
  `$ ${amount.toLocaleString("es-UY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const buildEmailDraftPrompt = ({
  brief,
  to,
  subject,
  allowedAmounts,
  sources,
}: {
  brief: string;
  to?: string;
  subject?: string;
  allowedAmounts: number[];
  sources: OfficialSource[];
}) =>
  [
    `Pedido: ${brief}`,
    to ? `Destinatario: ${to}` : "Destinatario: no indicado (usá un saludo genérico).",
    subject ? `Asunto sugerido: ${subject}` : null,
    allowedAmounts.length
      ? `Importes permitidos: ${allowedAmounts.map(formatAmount).join(", ")}`
      : "Importes permitidos: ninguno. No escribas precios.",
    sources.length
      ? `Presupuestos oficiales de referencia: ${sources
          .map((source) => `${source.name} v${source.version} (${source.hasProducts ? "con" : "sin"} productos)`)
          .join("; ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
