import "server-only";

import { db } from "@/lib/db";
import { WEB_FORM_KIND_LABELS, webFormStatus } from "@/lib/web-forms/labels";

// El formulario web que el usuario mira en Formularios (feature 75), para el
// agente: datos, mensaje y las respuestas que ya se mandaron. Lectura fresca
// en cada turno. El CV no se lee (es un archivo), solo se nombra.
const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("es-UY", { dateStyle: "long", timeStyle: "short", timeZone: "America/Montevideo" }).format(date);

export const formatWebFormContext = async (submissionId: string) => {
  const form = await db.webFormSubmission.findUnique({
    where: { id: submissionId },
    select: {
      kind: true,
      status: true,
      name: true,
      email: true,
      phone: true,
      service: true,
      location: true,
      message: true,
      fromTrebol: true,
      createdAt: true,
      attachment: { select: { filename: true } },
      replies: {
        where: { sentAt: { not: null } },
        orderBy: { createdAt: "asc" },
        select: { subject: true, body: true, sentAt: true, sentBy: { select: { name: true } } },
      },
    },
  });
  if (!form) return "El formulario web de esta conversación ya no existe.";

  const lines = [
    `Formulario web en contexto. El usuario lo está mirando en Formularios (Bambú Gestión): si pide algo sin nombrar otro (responderlo, presupuestarlo, resumirlo), es sobre este.`,
    `Tipo: ${WEB_FORM_KIND_LABELS[form.kind]}. Estado: ${webFormStatus[form.status].label}. Recibido el ${formatDate(form.createdAt)}.`,
    `Nombre: ${form.name}. Correo: ${form.email}. Teléfono: ${form.phone}.`,
    form.service ? `Servicio elegido: ${form.service}.` : null,
    form.location ? `Zona: ${form.location}.` : null,
    form.fromTrebol ? "Viene de El Trébol." : null,
    form.attachment ? `Adjuntó un CV (${form.attachment.filename}); no lo podés leer.` : null,
    `Mensaje:\n${form.message.trim() || "(sin mensaje)"}`,
    "La respuesta por correo la manda el usuario desde la pantalla (sale de contacto@ con la firma de la empresa). Si te pide redactarla, escribirla o ponerla en el campo, usá fillWebFormReply con el texto completo en Markdown (saludo, **negrita**, *cursiva*, listas), sin firma: queda en el campo Mensaje para que la revise y la mande. Los precios, como en draftEmail, tienen que salir de una tool.",
  ];
  const replies = form.replies.map(
    (reply, index) =>
      `Respuesta ${index + 1} (${reply.sentAt ? formatDate(reply.sentAt) : ""}${reply.sentBy?.name ? `, ${reply.sentBy.name}` : ""}) — ${reply.subject}:\n${reply.body}`
  );
  return [...lines, ...(replies.length ? ["Respuestas ya enviadas:", ...replies] : ["Todavía no se le respondió por correo."])]
    .filter(Boolean)
    .join("\n");
};
