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
- Dos pestañas (feature 75): Pedidos de servicio y Currículums, cada una
  con sus nuevos. Adentro, Nuevos · Respondidos · Archivados con su cuenta y
  búsqueda por nombre, correo, teléfono o mensaje. Abrir uno lo marca leído;
  un enlace a uno de la otra pestaña la cambia.
- Escritorio: la lista a la izquierda tiene su propio scroll (alto de la
  pantalla) y el formulario elegido a la derecha queda pegado arriba al
  bajar, con su propio scroll.
- Detalle: correo, teléfono y WhatsApp (números de Uruguay), servicio, zona,
  El Trébol, mensaje, CV y las respuestas enviadas.
- "Marcar respondido" (si se contestó por teléfono o WhatsApp), "Archivar",
  "Volver a nuevos", "Desarchivar" y "Es un currículum" / "Es un pedido de
  servicio" (pasa de pestaña; corrige a Detectar currículums).
- Responder: asunto por defecto ("Petición de servicio de limpieza
  doméstica - Bambú Servicios Integrales", con el servicio pedido; sin
  servicio u "Otro", "de limpieza"; a una postulación, "Tu postulación en
  …"), saludo, firma fija (`lib/web-forms/reply-text.ts`), el "Saludos," de
  cierre y la cita del mensaje original (los dos se pueden sacar; lo del
  saludo se recuerda en el navegador, `localStorage`
  `bambu.web-forms.closing`). Un `requestId` por respuesta: doble clic no
  manda dos.
- El mensaje tiene formato: negrita, cursiva, tamaño (Chico, Normal,
  Grande, Muy grande) y listas con viñetas o numeradas (Tab anida), con
  Tiptap (`components/web-forms/reply-editor.tsx`). Viaja el documento del
  editor como JSON plano, no HTML: `lib/web-forms/reply-doc.ts` lo valida
  (solo párrafos, saltos, listas, negrita, cursiva y los tamaños permitidos)
  y arma el HTML escapando el texto. En la base queda el texto sin formato
  (listas con "- " y "1. ").
- Pegar: lo copiado con "Copiar como email" del agente (o de un correo)
  conserva negrita, cursiva y listas, con una línea vacía entre párrafos y
  listas como se ve en el correo. Texto plano con Markdown ("Copiar como
  Markdown") se convierte con `lib/web-forms/reply-markdown.ts`.

## Ordenar (feature 75)

- "Detectar currículums" (pestaña Pedidos de servicio): Haiku 5.5 lee los
  pedidos de servicio nuevos (hasta 100) y pasa a Currículums los de alguien
  que busca trabajo. Una llamada; el consumo queda como `SKILL` sin
  conversación. Solo cambia el tipo. `lib/web-forms/classify-cvs.ts`.
- "Mover a Solicitudes de presupuesto" / "Mover a Trabaja con nosotros", con
  confirmación: mueven en el IMAP de contacto@ los avisos de la web ("Petición
  de servicio Web", "Trabaja con nosotros") de la Bandeja de entrada a la
  carpeta. El tipo es el del formulario en el sistema (mismo correo de la
  persona en Reply-To y menos de 2 días), así un pedido marcado como
  currículum va a Trabaja con nosotros. Un aviso de pedido sin formulario en
  el sistema queda donde está y se cuenta. Es la única escritura en un buzón
  fuera de Enviados (`lib/web-forms/sort-mail.ts`); el agente sigue en solo
  lectura.

## Agente

- Botón "Agente" (en el teléfono, flotante): el panel de Facturación
  (`components/agent/agent-floating-panel.tsx`) con la habilidad General
  (todas las tools, como Panda) y el historial de todas las conversaciones.
- Cada turno lleva el formulario elegido como contexto
  (`{ kind: "web-form", submissionId }` → `lib/web-forms/agent-context.ts`):
  datos, mensaje y respuestas enviadas. La conversación queda con
  `contextKind` `web-form` ("Formulario web" en el historial).
- "Escribí la respuesta" (o "ponela en el campo"): el agente usa
  `fillWebFormReply` (solo activa con un formulario en contexto) con el
  texto en Markdown y, si hace falta, el asunto. Valida los importes como
  `draftEmail` y la página reemplaza asunto y Mensaje del formulario
  (`components/web-forms/reply-fill-store.ts`). No manda nada: la persona
  revisa y toca Enviar.
- No queda atado a una conversación: al elegir otro formulario, la que tenía
  mensajes pasa al historial y arranca una nueva. El panel flota encima de
  la página (arriba a la derecha, como en Facturación): abrirlo no mueve
  nada.

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
  texto y HTML de la respuesta, WhatsApp y la ruta del CV,
  y desde la 75 el formato del mensaje (HTML escapado, tamaños permitidos),
  el asunto con el servicio, Detectar currículums (referencias) y qué
  avisos se mueven a cada carpeta.
