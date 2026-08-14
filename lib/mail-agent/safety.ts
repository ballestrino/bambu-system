const protectedPatterns = [
  /(?:USD|US\$|\$|€)\s?\d[\d.,]*/gi,
  /\b\d+(?:[.,]\d+)?\s?%/g,
  /\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/g,
  /\b\d{1,2}:\d{2}(?:\s?(?:a\.?m\.?|p\.?m\.?))?\b/gi,
  /\b\d+(?:[.,]\d+)?\b/g,
] as const;

const manualTopicPattern = new RegExp(
  [
    "pago", "precio", "presupuesto", "cotiz", "reclamo", "queja",
    "abog", "legal", "contrato", "despido", "sueldo", "recursos humanos",
    "cancel", "baja", "devoluci", "reembolso", "compromiso", "garant",
    "payment", "price", "complaint", "legal", "cancel", "refund",
  ].join("|"),
  "i"
);

const automatedSenderPattern =
  /(?:^|[._-])(no-?reply|do-?not-?reply|mailer-daemon|postmaster)(?:@|[._-])/i;

export const extractProtectedLiterals = (value: string) => {
  const matches = protectedPatterns.flatMap((pattern) => value.match(pattern) ?? []);
  const unique = [...new Set(matches.map((item) => item.trim().replace(/[.,]$/, "")))]
    .filter(Boolean)
    .sort((left, right) => right.length - left.length);
  return unique.filter(
    (candidate, index) =>
      !unique.some((other, otherIndex) => otherIndex < index && other.includes(candidate))
  );
};

export const hasAlwaysManualTopic = (subject: string, body: string) =>
  manualTopicPattern.test(`${subject}\n${body}`);

export const isAutomatedSender = (address: string) =>
  automatedSenderPattern.test(address);

export const preservesProtectedLiterals = (
  required: string[],
  proposedReply: string
) => required.every((literal) => proposedReply.includes(literal));

type AutoReplyGateInput = {
  fromAddress: string;
  recipientCount: number;
  hasAttachments: boolean;
  listId?: string | null;
  autoSubmitted?: string | null;
  subject: string;
  body: string;
  knownSender: boolean;
};

export const getAutoReplyBlockReasons = (input: AutoReplyGateInput) => {
  const reasons: string[] = [];
  if (!input.knownSender) reasons.push("remitente_desconocido");
  if (input.recipientCount !== 1) reasons.push("multiples_destinatarios");
  if (input.hasAttachments) reasons.push("adjuntos");
  if (input.listId) reasons.push("lista_de_correo");
  if (input.autoSubmitted && input.autoSubmitted.toLowerCase() !== "no") {
    reasons.push("mensaje_automatico");
  }
  if (isAutomatedSender(input.fromAddress)) reasons.push("remitente_automatico");
  if (hasAlwaysManualTopic(input.subject, input.body)) reasons.push("tema_sensible");
  return reasons;
};
