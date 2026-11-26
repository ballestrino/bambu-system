# Formularios web (feature 74)

Los dos formularios de la web pública (bambu-servicios.com, repositorio
`bambu-servicios`) llegan a Bambú Gestión y se responden desde
`/dashboard/web-forms`. La respuesta sale de contacto@ por el SMTP de
Hostinger y queda en Enviados.

## Flujo

```text
Web (server action lib/mail.ts)
  ├─ POST https://gestion.bambu-servicios.com/api/web-forms   (WEB_FORMS_SECRET)
  │     └─ WebFormSubmission (+ WebFormAttachment con el CV)
  └─ Resend → contacto@ (aviso con "Ver y responder en Bambú Gestión")

Admin en /dashboard/web-forms
  └─ replyWebForm → SMTP contacto@ (nodemailer) → copia en Enviados (IMAP)
```

- Si el POST falla (sistema caído, sin secreto), la web igual manda el aviso
  por correo con todos los datos, como antes. Si el aviso falla pero el
  formulario quedó en el sistema, la persona ve "enviado".
- El aviso tiene `replyTo` con el correo de la persona: responder desde el
  buzón también le llega a ella. Lo normal es responder desde la app, que deja
  el formulario como respondido.

## Entrada: `POST /api/web-forms`

- Integración externa (ver `docs/architecture.md`). Pública en `routes.ts`;
  la autoriza `Authorization: Bearer <WEB_FORMS_SECRET>` (mínimo 32
  caracteres, comparado por hash). Sin la variable no acepta nada.
- `multipart/form-data`: `externalId` (lo genera la web por envío; repetir
  no duplica), `kind` (`CONTACT` o `JOB_APPLICATION`), `name`, `email`,
  `phone`, `message`, y en contacto `service`, `location`, `fromTrebol`.
  La postulación trae `curriculum`.
- CV: PDF, DOC o DOCX de hasta 4 MB, reconocido por su contenido (no por el
  nombre). El nombre se limpia. Se guarda en la base (`bytea`), como las
  imágenes del agente.
- Respuestas: `201 { ok, id, url }`, `200` si era repetido, `400` con el
  motivo, `401`, `413`, `500`.
- La descarga `GET /api/web-forms/[id]/attachment` pide sesión de admin y
  siempre baja como adjunto.

## Pantalla

- Barra lateral, grupo "Web" → "Formularios", con el número de nuevos (cada
  minuto). También en "Más" de la app instalada.
- Pestañas Nuevos · Respondidos · Archivados con su cuenta, filtro por tipo
  y búsqueda por nombre, correo, teléfono o mensaje. Abrir uno lo marca leído.
- Detalle: correo, teléfono y WhatsApp (números de Uruguay), servicio, zona,
  El Trébol, mensaje, CV y las respuestas enviadas.
- "Marcar respondido" (si se contestó por teléfono o WhatsApp), "Archivar",
  "Volver a nuevos" y "Desarchivar".
- Responder: asunto y saludo por defecto, firma fija
  (`lib/web-forms/reply-text.ts`) y la cita del mensaje original (se puede
  sacar). Un `requestId` por respuesta: doble clic no manda dos.

## Respuesta por correo

- `lib/mailbox/smtp-account.ts` arma el SMTP con las variables que ya tenía
  el buzón: `HOSTINGER_SMTP_HOST`, `HOSTINGER_SMTP_PORT` (465),
  `HOSTINGER_SMTP_SECURE`, `HOSTINGER_MAIL_USER`, `HOSTINGER_MAIL_PASSWORD`,
  `HOSTINGER_MAIL_FROM`, y para Enviados `HOSTINGER_IMAP_*` y
  `HOSTINGER_SENT_FOLDER`.
- `lib/web-forms/send-reply.ts`: reserva la fila (`WebFormReply` sin
  `sentAt`), manda, y al aceptar el SMTP llena `sentAt` y pasa el formulario
  a respondido. Si el SMTP falla borra la reserva y se puede reintentar. Una
  fila sin `sentAt` que quedó (corte a la mitad) se muestra como "no se
  confirmó el envío".
- La copia en Enviados es el mismo mensaje (mismo Message-ID). Si el IMAP
  falla, el correo ya salió: se avisa y no se repite.

## Variables

| Proyecto | Variable | Uso |
| --- | --- | --- |
| Bambú Gestión | `WEB_FORMS_SECRET` | Autoriza la entrada (nuevo) |
| Bambú Gestión | `HOSTINGER_*` | SMTP e IMAP de contacto@ (ya estaban) |
| Bambú Gestión | `NEXT_PUBLIC_BASE_URL` | El enlace que vuelve a la web |
| Web | `WEB_FORMS_SECRET` | El mismo valor (nuevo) |
| Web | `BAMBU_SYSTEM_URL` | Opcional; por defecto `https://gestion.bambu-servicios.com` |

## Salida a producción

1. Migración aditiva `20261126120000_web_forms` en Neon (producción).
2. `WEB_FORMS_SECRET` en los dos proyectos de Vercel (mismo valor; por
   ejemplo `openssl rand -hex 32`).
3. Deploy de Bambú Gestión antes que el de la web: la web sin el sistema
   sigue mandando el correo, así que el orden no pierde formularios.
4. Probar un formulario real y una respuesta a un correo propio.

## Checks

- `pnpm check:web-forms`: secreto, esquema, CV, SMTP desde el entorno,
  texto y HTML de la respuesta, WhatsApp y la ruta del CV.
