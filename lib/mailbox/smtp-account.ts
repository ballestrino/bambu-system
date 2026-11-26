// El SMTP de contacto@ en Hostinger, con las variables que ya usa el buzón
// (HOSTINGER_*). Puro: recibe el entorno, así lo usan el envío y el check. La
// clave queda en el servidor.
import { resolveMailboxAccount, type MailboxAccount } from "@/lib/mailbox/accounts";

export const WEB_FORMS_SENDER_NAME = "Bambú Servicios Integrales";

export type SmtpAccount = {
  host: string;
  port: number;
  secure: boolean;
  auth: { user: string; pass: string };
  // Dirección que va en From (HOSTINGER_MAIL_FROM o el usuario).
  fromAddress: string;
  // Para guardar la copia en Enviados por IMAP.
  mailbox: MailboxAccount;
};

type Env = Record<string, string | undefined>;

const read = (env: Env, key: string) => env[key]?.trim() || undefined;

// "Nombre <correo>" o "correo": se queda con el correo.
const extractAddress = (value: string) => (value.match(/<([^>]+)>/)?.[1] ?? value).trim().toLowerCase();

export type SmtpAccountResult = { ok: true; account: SmtpAccount } | { ok: false; missing: string[] };

export const resolveSmtpAccount = (env: Env = process.env): SmtpAccountResult => {
  const mailbox = resolveMailboxAccount("contacto", env);
  const host = read(env, "HOSTINGER_SMTP_HOST");
  if (!mailbox.ok || !host) {
    return {
      ok: false,
      missing: [...(host ? [] : ["HOSTINGER_SMTP_HOST"]), ...(mailbox.ok ? [] : mailbox.missing)],
    };
  }
  const port = Number(read(env, "HOSTINGER_SMTP_PORT"));
  const validPort = Number.isInteger(port) && port > 0 ? port : 465;
  const secureFlag = read(env, "HOSTINGER_SMTP_SECURE")?.toLowerCase();
  const from = read(env, "HOSTINGER_MAIL_FROM");
  return {
    ok: true,
    account: {
      host,
      port: validPort,
      // Sin la variable: TLS directo solo en el 465 (en el 587 va STARTTLS).
      secure: secureFlag ? secureFlag !== "false" : validPort === 465,
      auth: mailbox.account.auth,
      fromAddress: from ? extractAddress(from) : mailbox.account.address,
      mailbox: mailbox.account,
    },
  };
};
