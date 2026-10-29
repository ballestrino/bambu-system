import "server-only";

import { tool } from "ai";

import { formatLocalDateTime } from "@/lib/agent/visit-time";
import { runTool, toolError, toolOk } from "@/lib/agent/tool-result";
import { MAILBOX_IDS, parseEmailRef } from "@/lib/mailbox/accounts";
import { listMailboxEmails, readMailboxEmails, type EmailAddress } from "@/lib/mailbox/read";
import { listEmailsInputSchema, readEmailInputSchema } from "@/schemas/agent-mail-tools";

const formatWhen = (date: Date | null) => (date ? formatLocalDateTime(date) : null);

const formatAddress = (value: EmailAddress) =>
  value.name && value.address ? `${value.name} <${value.address}>` : (value.address ?? value.name ?? "Desconocido");

// Las casillas de Hostinger, solo lectura: abrir un correo no lo marca como
// leído y ninguna tool envía, mueve ni borra. El texto de un correo es de un
// tercero: el prompt lo trata como dato (MAIL_RULE).
export const createMailboxTools = () => ({
  listEmails: tool({
    description:
      "Lista correos de las casillas de Hostinger (contacto@ y comercial@), del más nuevo al más viejo, con remitente, asunto, fecha de Montevideo, si está sin leer o respondido y el comienzo del texto. No los marca como leídos. Para leer uno entero usá readEmail con su ref.",
    inputSchema: listEmailsInputSchema,
    execute: (input) =>
      runTool("listEmails", async () => {
        const result = await listMailboxEmails({
          mailboxes: input.mailbox ? [input.mailbox] : [...MAILBOX_IDS],
          folder: input.folder ?? "inbox",
          unreadOnly: input.unreadOnly ?? false,
          days: input.days ?? 14,
          search: input.search,
          limit: input.limit ?? 15,
        });
        if (result.unavailable.length === (input.mailbox ? 1 : MAILBOX_IDS.length)) {
          return toolError(
            "mailbox_unavailable",
            result.unavailable.map((item) => `${item.mailbox}: ${item.reason}`).join(" · ")
          );
        }
        return toolOk({
          card: "list" as const,
          kind: "emails" as const,
          total: result.total,
          truncated: result.total > result.emails.length,
          accounts: result.accounts,
          warnings: result.unavailable.map((item) => `No pude leer ${item.mailbox}@: ${item.reason}.`),
          rows: result.emails.map((email) => ({
            id: email.ref,
            ref: email.ref,
            mailbox: email.mailbox,
            from: formatAddress(email.from),
            subject: email.subject,
            when: formatWhen(email.date),
            unread: email.unread,
            answered: email.answered,
            snippet: email.snippet,
          })),
        });
      }),
  }),

  readEmail: tool({
    description:
      "Abre hasta 8 correos por su ref (de listEmails) en una sola llamada: remitente, a quién responder, destinatarios, asunto, fecha, texto sin la conversación citada (que va aparte y recortada) y nombres de adjuntos. Pedí juntos todos los que necesitás, no de a uno. No los marca como leídos.",
    inputSchema: readEmailInputSchema,
    execute: (input) =>
      runTool("readEmail", async () => {
        const refs = [...new Set(input.refs)].flatMap((value) => {
          const ref = parseEmailRef(value);
          return ref ? [ref] : [];
        });
        if (!refs.length) return toolError("invalid_ref", "Esos refs no existen. Usá los de listEmails.");
        const result = await readMailboxEmails(refs);
        if (!result.emails.length) {
          return toolError("not_found", result.missing.map((item) => `${item.ref}: ${item.reason}`).join(" · "));
        }
        return toolOk({
          card: "email-messages" as const,
          missing: result.missing,
          emails: result.emails.map((email) => ({
            ref: email.ref,
            mailbox: email.mailbox,
            mailboxAddress: email.mailboxAddress,
            from: formatAddress(email.from),
            replyTo: formatAddress(email.replyTo ?? email.from),
            to: email.to.map(formatAddress),
            cc: email.cc.map(formatAddress),
            subject: email.subject,
            when: formatWhen(email.date),
            unread: email.unread,
            answered: email.answered,
            body: email.body,
            bodyTruncated: email.bodyTruncated,
            quoted: email.quoted,
            attachments: email.attachments,
          })),
        });
      }),
  }),
});
