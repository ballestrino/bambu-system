import assert from "node:assert/strict";

import {
  buildThreadParticipants,
  hashMailInput,
  normalizeMailBody,
  normalizeMailSubject,
} from "../lib/mail-agent/normalize";
import {
  getNextMailSendAt,
  isMailSendWindowOpen,
} from "../lib/mail-agent/schedule";
import {
  extractProtectedLiterals,
  getAutoReplyBlockReasons,
  hasAlwaysManualTopic,
  isAutomatedSender,
  preservesProtectedLiterals,
} from "../lib/mail-agent/safety";
import { getSyncedMailDirection } from "../lib/mail-agent/sync-direction";
import { sortMailMessages } from "../lib/mail-agent/message-date";
import { buildMailThreadKey } from "../lib/mail-agent/threading";
import { getMailReplyAddress } from "../lib/mail-agent/reply-address";
import { resolveMailboxFolders } from "../lib/mail-agent/mail-folders";
import { mailMoveThreadsSchema } from "../schemas/mail";

assert.equal(normalizeMailSubject(" Re: FWD:  Consulta  "), "consulta");
assert.equal(normalizeMailBody(" Hola   mundo\r\n\r\n\r\n Fin "), "hola mundo\n\nfin");
assert.equal(
  hashMailInput("RE: Consulta", "Hola"),
  hashMailInput("consulta", "  HOLA ")
);
assert.deepEqual(
  buildThreadParticipants(["B@EXAMPLE.COM", "a@example.com", "b@example.com"]),
  ["a@example.com", "b@example.com"]
);
assert.deepEqual(
  getAutoReplyBlockReasons({
    fromAddress: "cliente@example.com",
    recipientCount: 1,
    hasAttachments: false,
    subject: "Precio",
    body: "¿Cuánto cuesta?",
    knownSender: true,
  }),
  ["precio_sin_fuente_oficial"]
);
assert.deepEqual(
  getAutoReplyBlockReasons({
    fromAddress: "cliente@example.com",
    recipientCount: 1,
    hasAttachments: false,
    subject: "Precio",
    body: "¿Cuánto cuesta?",
    knownSender: true,
    allowGroundedPrice: true,
  }),
  []
);

const literals = extractProtectedLiterals("Total USD 290, seña 40% y entrega 15/08 a las 14:30");
assert(literals.includes("USD 290"));
assert(literals.includes("40%"));
assert(literals.includes("15/08"));
assert(literals.includes("14:30"));
assert(preservesProtectedLiterals(literals, `Confirmamos ${literals.join(" ")}`));
assert(!preservesProtectedLiterals(["USD 290"], "Confirmamos USD 300"));

assert(hasAlwaysManualTopic("Precio del servicio", "Necesito una cotización"));
assert(hasAlwaysManualTopic("Consulta", "Quiero cancelar el contrato"));
assert(!hasAlwaysManualTopic("Horario de visita", "¿Vienen el martes?"));
assert(isAutomatedSender("no-reply@example.com"));
assert(!isAutomatedSender("cliente@example.com"));

assert.equal(
  getSyncedMailDirection("INBOX", "contacto@bambu.test", "contacto@bambu.test"),
  "INBOUND"
);
assert.equal(
  getSyncedMailDirection("SENT", "cliente@example.com", "contacto@bambu.test"),
  "OUTBOUND"
);
assert.equal(
  getSyncedMailDirection("ARCHIVE", "cliente@example.com", "contacto@bambu.test"),
  "INBOUND"
);
assert.notEqual(
  buildMailThreadKey("Petición Web", ["contacto@bambu.test"], "message-1"),
  buildMailThreadKey("Petición Web", ["contacto@bambu.test"], "message-2")
);
const datedMessages = [
  { receivedAt: new Date("2026-08-14T09:30:00Z"), sentAt: null, createdAt: new Date() },
  { receivedAt: null, sentAt: new Date("2026-07-07T18:41:00Z"), createdAt: new Date() },
];
assert.equal(sortMailMessages(datedMessages, "desc")[0].receivedAt?.getUTCDate(), 14);
assert.equal(
  getMailReplyAddress(
    {
      fromAddress: "contacto@bambu.test",
      bodyText: "Nombre: Ana\nEmail: cliente@example.com\nMensaje: Hola",
      headers: { replyTo: null },
    },
    "contacto@bambu.test"
  ),
  "cliente@example.com"
);
const listedFolder = (
  path: string,
  specialUse?: string,
  flags = new Set<string>()
): Parameters<typeof resolveMailboxFolders>[0][number] => {
  const parts = path.split(".");
  return {
    path,
    name: parts.at(-1) || path,
    parent: parts.slice(0, -1),
    flags,
    specialUse,
    listed: true,
  };
};
const mailboxFolders = resolveMailboxFolders(
  [
    listedFolder("INBOX", "\\Inbox"),
    listedFolder("INBOX.Sent", "\\Sent"),
    listedFolder("INBOX.Archive"),
    listedFolder("INBOX.Drafts", "\\Drafts"),
    listedFolder("INBOX.Presupuestos.Pendientes"),
    listedFolder("INBOX.Contenedor", undefined, new Set(["\\Noselect"])),
  ],
  "INBOX.Sent"
);
assert(mailboxFolders.some(({ key }) => key === "CUSTOM:INBOX.Presupuestos.Pendientes"));
assert(mailboxFolders.some(({ label }) => label === "Presupuestos / Pendientes"));
assert(mailboxFolders.some(({ key, path }) => key === "ARCHIVE" && path === "INBOX.Archive"));
assert(!mailboxFolders.some(({ path }) => path === "INBOX.Drafts"));
assert.deepEqual(
  mailMoveThreadsSchema.parse({ threadIds: ["thread-1", "thread-1"], folderKey: "ARCHIVE" }),
  { threadIds: ["thread-1"], folderKey: "ARCHIVE" }
);
assert.throws(() =>
  mailMoveThreadsSchema.parse({
    threadIds: Array.from({ length: 51 }, (_, index) => `thread-${index}`),
    folderKey: "ARCHIVE",
  })
);

assert.deepEqual(
  getAutoReplyBlockReasons({
    fromAddress: "no-reply@example.com",
    recipientCount: 2,
    hasAttachments: true,
    listId: "clientes.example.com",
    autoSubmitted: "auto-generated",
    subject: "Precio",
    body: "Necesito cancelar",
    knownSender: false,
  }),
  [
    "remitente_desconocido",
    "multiples_destinatarios",
    "adjuntos",
    "lista_de_correo",
    "mensaje_automatico",
    "remitente_automatico",
    "tema_sensible",
  ]
);

const mondayMorningUtc = new Date("2026-08-10T10:00:00.000Z"); // 07:00 Montevideo
const mondayLateUtc = new Date("2026-08-11T00:30:00.000Z"); // 21:30 Monday
const saturdayMorningUtc = new Date("2026-08-15T13:00:00.000Z"); // 10:00
const saturdayEarlyUtc = new Date("2026-08-15T12:30:00.000Z"); // 09:30
assert(isMailSendWindowOpen(mondayMorningUtc));
assert(!isMailSendWindowOpen(mondayLateUtc));
assert(isMailSendWindowOpen(saturdayMorningUtc));
assert(!isMailSendWindowOpen(saturdayEarlyUtc));
assert.equal(getNextMailSendAt(saturdayEarlyUtc).toISOString(), saturdayMorningUtc.toISOString());

console.log("Mail agent checks passed");
