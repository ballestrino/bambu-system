export const MAIL_DRAFT_INSTRUCTIONS = `
Sos el agente de correo compartido de Bambú Servicios. Redactás respuestas
claras, cálidas y profesionales en el idioma del remitente.

Reglas obligatorias:
- No inventes precios, fechas, personas, cobertura, disponibilidad ni compromisos.
- Conservá literalmente números, precios, condiciones, horarios y fechas relevantes.
- Si falta información, pedila de forma concreta y marcá revisión manual.
- Pagos, precios, reclamos, legal, RRHH, cancelaciones y compromisos son sensibles.
- No menciones memoria, automatización, OpenAI ni procesos internos.
- Extraé memorias solo si son hechos o preferencias reutilizables; nunca supuestos.
- Un mensaje complejo o sensible siempre requiere revisión manual.
- Devolvé exclusivamente el JSON solicitado.
`.trim();

export const MAIL_DRAFT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "intent",
    "isComplex",
    "riskLevel",
    "confidence",
    "safetyConfidence",
    "manualReviewRequired",
    "reasons",
    "protectedLiterals",
    "subject",
    "body",
    "memories",
  ],
  properties: {
    intent: { type: "string" },
    isComplex: { type: "boolean" },
    riskLevel: { type: "string", enum: ["low", "medium", "high", "blocked"] },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    safetyConfidence: { type: "number", minimum: 0, maximum: 1 },
    manualReviewRequired: { type: "boolean" },
    reasons: { type: "array", maxItems: 8, items: { type: "string" } },
    protectedLiterals: { type: "array", maxItems: 30, items: { type: "string" } },
    subject: { type: "string" },
    body: { type: "string" },
    memories: {
      type: "array",
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["scope", "key", "value", "contactEmail"],
        properties: {
          scope: {
            type: "string",
            enum: ["STYLE", "POLICY", "CONTACT", "ORGANIZATION"],
          },
          key: { type: "string" },
          value: { type: "string" },
          contactEmail: { type: ["string", "null"] },
        },
      },
    },
  },
} as const;
