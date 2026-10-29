// Las casillas de Hostinger que lee el agente. Puro: recibe el entorno, así lo
// usan las tools y el check. Las claves quedan en el servidor y nunca llegan
// al modelo ni al navegador.
export const MAILBOX_IDS = ["contacto", "comercial"] as const;

export type MailboxId = (typeof MAILBOX_IDS)[number];

export const MAILBOX_FOLDERS = ["inbox", "sent"] as const;

export type MailboxFolderId = (typeof MAILBOX_FOLDERS)[number];

// contacto@ usa las variables de siempre; comercial@ las suyas. El servidor
// IMAP es el mismo para las dos.
const MAILBOX_ENV = {
  contacto: { user: "HOSTINGER_MAIL_USER", password: "HOSTINGER_MAIL_PASSWORD" },
  comercial: { user: "HOSTINGER_COMERCIAL_MAIL_USER", password: "HOSTINGER_COMERCIAL_MAIL_PASSWORD" },
} as const satisfies Record<MailboxId, { user: string; password: string }>;

export type MailboxAccount = {
  id: MailboxId;
  address: string;
  imap: { host: string; port: number; secure: boolean };
  auth: { user: string; pass: string };
  sentFolder: string;
};

type Env = Record<string, string | undefined>;

const read = (env: Env, key: string) => env[key]?.trim() || undefined;

const parsePort = (value: string | undefined) => {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 ? port : 993;
};

export type MailboxAccountResult =
  | { ok: true; account: MailboxAccount }
  | { ok: false; id: MailboxId; missing: string[] };

export const resolveMailboxAccount = (id: MailboxId, env: Env = process.env): MailboxAccountResult => {
  const keys = MAILBOX_ENV[id];
  const host = read(env, "HOSTINGER_IMAP_HOST");
  const user = read(env, keys.user);
  const pass = read(env, keys.password);
  if (!host || !user || !pass) {
    const missing = [
      ...(host ? [] : ["HOSTINGER_IMAP_HOST"]),
      ...(user ? [] : [keys.user]),
      ...(pass ? [] : [keys.password]),
    ];
    return { ok: false, id, missing };
  }
  return {
    ok: true,
    account: {
      id,
      address: user.toLowerCase(),
      imap: {
        host,
        port: parsePort(read(env, "HOSTINGER_IMAP_PORT")),
        secure: read(env, "HOSTINGER_IMAP_SECURE")?.toLowerCase() !== "false",
      },
      auth: { user, pass },
      sentFolder: read(env, "HOSTINGER_SENT_FOLDER") ?? "Sent",
    },
  };
};

// Un correo se nombra por casilla, carpeta y UID: "contacto/inbox/1234". El
// modelo lo copia de listEmails para abrirlo o responderlo.
export type EmailRef = { mailbox: MailboxId; folder: MailboxFolderId; uid: number };

export const formatEmailRef = (ref: EmailRef) => `${ref.mailbox}/${ref.folder}/${ref.uid}`;

const EMAIL_REF_PATTERN = /^(contacto|comercial)\/(inbox|sent)\/([1-9]\d{0,9})$/;

export const parseEmailRef = (value: string): EmailRef | null => {
  const match = value.trim().match(EMAIL_REF_PATTERN);
  if (!match) return null;
  return { mailbox: match[1] as MailboxId, folder: match[2] as MailboxFolderId, uid: Number(match[3]) };
};
