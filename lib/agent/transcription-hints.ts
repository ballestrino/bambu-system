import { BUSINESS_PROFILE } from "@/lib/agent/business-profile";
import type { TranscriptionHints } from "@/lib/ai/transcription-request";

// Pistas del dictado para gpt-transcribe. Puro: lo prueba el check. En una
// nota de 30 segundos el error que más molesta es una palabra del negocio mal
// escrita: van como keywords.
export const AGENT_TRANSCRIPTION_HINTS: TranscriptionHints = {
  prompt: `Mensaje de voz en español de Uruguay para el asistente de ${BUSINESS_PROFILE.name}, una empresa de servicios de limpieza. Habla de presupuestos en pesos, precios con o sin IVA, visitas, horas, empleadas, productos y correos a clientes.`,
  keywords: [
    "Bambú",
    BUSINESS_PROFILE.name,
    "Literal E",
    "IVA",
    "BPS",
    "presupuesto oficial",
    "empleadas",
    "visitas semanales",
    "horas por visita",
    "productos",
    "margen",
  ],
  languages: ["es"],
};
