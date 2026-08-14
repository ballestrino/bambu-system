export const MAIL_ATTACHMENT_LIMIT_BYTES = 4 * 1024 * 1024;
export const MAIL_IMPORT_MONTHS = 3;
export const MAIL_SYNC_BATCH_SIZE = 75;
export const MAIL_SUGGESTION_BATCH_SIZE = 5;

const requiredMailKeys = [
  "HOSTINGER_IMAP_HOST",
  "HOSTINGER_SMTP_HOST",
  "HOSTINGER_MAIL_USER",
  "HOSTINGER_MAIL_PASSWORD",
] as const;

const parseBoolean = (value: string | undefined, fallback: boolean) => {
  if (!value) return fallback;
  return value.toLowerCase() !== "false";
};
const parsePort = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const getMailConfigurationStatus = () => {
  const missingMail = requiredMailKeys.filter((key) => !process.env[key]);

  return {
    mailReady: missingMail.length === 0,
    openAiReady: Boolean(process.env.OPENAI_API_KEY),
    cronReady: Boolean(process.env.MAIL_SYNC_CRON_SECRET),
    missingMail: [...missingMail],
  };
};

export const getMailRuntimeConfig = () => {
  const status = getMailConfigurationStatus();
  if (!status.mailReady) {
    throw new Error(`Falta configurar: ${status.missingMail.join(", ")}`);
  }

  const user = process.env.HOSTINGER_MAIL_USER!;
  return {
    imap: {
      host: process.env.HOSTINGER_IMAP_HOST!,
      port: parsePort(process.env.HOSTINGER_IMAP_PORT, 993),
      secure: parseBoolean(process.env.HOSTINGER_IMAP_SECURE, true),
    },
    smtp: {
      host: process.env.HOSTINGER_SMTP_HOST!,
      port: parsePort(process.env.HOSTINGER_SMTP_PORT, 465),
      secure: parseBoolean(process.env.HOSTINGER_SMTP_SECURE, true),
    },
    auth: { user, pass: process.env.HOSTINGER_MAIL_PASSWORD! },
    from: process.env.HOSTINGER_MAIL_FROM || user,
    sentFolder: process.env.HOSTINGER_SENT_FOLDER || "Sent",
  };
};

export const requireMailCronSecret = (authorization: string | null) => {
  const expected = process.env.MAIL_SYNC_CRON_SECRET;
  if (!expected || authorization !== `Bearer ${expected}`) {
    throw new Error("Cron de correo no autorizado");
  }
};
