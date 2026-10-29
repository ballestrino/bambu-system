// El texto de un correo para el modelo: sin la conversación citada debajo (la
// respuesta de Gmail, Outlook o un ">" por línea) y con un tope, así un hilo
// largo no se lleva los tokens del turno. Puro, con prueba.
const QUOTE_MARKERS = [
  // Gmail y Apple Mail, a veces partido en dos líneas: "El mar, 27 oct 2026 a
  // las 10:00, Ana <ana@x.com> escribió:".
  /^(?:El|On)\s[^\n]{0,300}(?:\n[^\n]{0,300})?\s(?:escribió|wrote):[ \t]*$/m,
  /^-{2,}\s*(?:Original Message|Mensaje original)\s*-{2,}/im,
  // Outlook: una línea "De:" seguida de "Enviado:" o "Sent:".
  /^(?:De|From):[^\n]*\n(?:[^\n]*\n)?(?:Enviado|Sent|Fecha|Date):/m,
  /^_{20,}\s*$/m,
];

const normalize = (text: string) =>
  text
    .replace(/\r\n?/g, "\n")
    .replace(/ /g, " ")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

export const splitQuotedReply = (raw: string) => {
  const text = normalize(raw);
  const cut = QUOTE_MARKERS.reduce((first, marker) => {
    const index = text.search(marker);
    return index > 0 && index < first ? index : first;
  }, text.length);
  const body = text
    .slice(0, cut)
    .split("\n")
    .filter((line) => !line.startsWith(">"))
    .join("\n");
  return { body: normalize(body), quoted: normalize(text.slice(cut)) };
};

export const EMAIL_BODY_MAX_CHARS = 6000;
export const EMAIL_QUOTED_MAX_CHARS = 1500;
export const EMAIL_SNIPPET_MAX_CHARS = 320;

export const prepareEmailText = (raw: string | null | undefined) => {
  const { body, quoted } = splitQuotedReply(raw ?? "");
  return {
    body: clip(body, EMAIL_BODY_MAX_CHARS),
    quoted: quoted ? clip(quoted, EMAIL_QUOTED_MAX_CHARS) : null,
    truncated: body.length > EMAIL_BODY_MAX_CHARS,
  };
};

export const emailSnippet = (raw: string | null | undefined) =>
  clip(splitQuotedReply(raw ?? "").body.replace(/\s+/g, " "), EMAIL_SNIPPET_MAX_CHARS);
