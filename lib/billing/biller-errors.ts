export type BillerErrorKind =
  | "not_configured"
  | "invalid_config"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation"
  | "rate_limited"
  | "server"
  | "network"
  | "invalid_response";

export type BillerFieldError = { field: string; messages: string[] };

export class BillerError extends Error {
  readonly kind: BillerErrorKind;
  readonly status?: number;
  readonly fields: BillerFieldError[];

  constructor(
    kind: BillerErrorKind,
    message: string,
    options: { status?: number; fields?: BillerFieldError[] } = {}
  ) {
    super(message);
    this.name = "BillerError";
    this.kind = kind;
    this.status = options.status;
    this.fields = options.fields ?? [];
  }
}

const toMessages = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(String) : value === undefined ? [] : [String(value)];

// Un 422 de emitir es [{ field, message: string[] }]; el de detalle y el de
// notificaciones traen message como texto.
const readFieldErrors = (body: unknown): BillerFieldError[] => {
  if (!Array.isArray(body)) return [];
  return body.flatMap((entry) =>
    entry && typeof entry === "object" && "field" in entry
      ? [{ field: String(entry.field), messages: toMessages((entry as { message?: unknown }).message) }]
      : []
  );
};

const readMessage = (body: unknown) => {
  if (body && typeof body === "object" && "message" in body) {
    return String((body as { message: unknown }).message);
  }
  return typeof body === "string" && body.trim() ? body.trim().slice(0, 300) : "";
};

export const billerErrorFromResponse = (status: number, body: unknown) => {
  const fields = readFieldErrors(body);
  const message = readMessage(body) || fields.flatMap((field) => field.messages).join(" ");
  const withStatus = { status, fields };

  if (status === 401) return new BillerError("unauthorized", message || "Token de Biller inválido", withStatus);
  if (status === 403) return new BillerError("forbidden", message || "Biller no permite esta operación", withStatus);
  if (status === 404) return new BillerError("not_found", message || "Biller no encontró el comprobante", withStatus);
  if (status === 422 || status === 400) return new BillerError("validation", message || "Biller rechazó los datos", withStatus);
  if (status === 429) return new BillerError("rate_limited", "Biller pidió esperar entre llamados", withStatus);
  return new BillerError("server", message || `Biller respondió ${status}`, withStatus);
};

const USER_MESSAGES: Record<BillerErrorKind, string> = {
  not_configured: "Biller no está configurado: faltan BILLER_BASE_URL, BILLER_TOKEN o BILLER_SUCURSAL.",
  invalid_config: "La configuración de Biller no es válida.",
  unauthorized: "Biller rechazó el token. Generá uno nuevo en Biller › API › Tokens.",
  forbidden: "Biller no permite esta operación con el plan o la empresa actual.",
  not_found: "Biller no encontró el comprobante.",
  validation: "Biller rechazó los datos.",
  rate_limited: "Biller está limitando los llamados. Probá de nuevo en unos segundos.",
  server: "Biller no respondió bien. Probá de nuevo en unos minutos.",
  network: "No se pudo conectar con Biller.",
  invalid_response: "Biller respondió algo que no se pudo leer.",
};

// Mensaje para la pantalla: el tipo de error y, si Biller explicó algo, lo suyo.
export const describeBillerError = (error: unknown) => {
  if (!(error instanceof BillerError)) return USER_MESSAGES.server;
  const base = USER_MESSAGES[error.kind];
  const detail = error.kind === "validation" || error.kind === "invalid_config" ? error.message : "";
  return detail && !base.includes(detail) ? `${base} ${detail}` : base;
};
