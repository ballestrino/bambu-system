# Current Harness Session

Status: active

## Active Feature

- Ninguna. La 32 sigue bloqueada (abajo).

## Blocked Feature

- 32 `agent_mailbox`, commit `e180d99`.
  Bloqueada por: las variables de comercial@ y el smoke del usuario.
- Hecho: se quitaron la vista `/dashboard/email`, `components/mail`,
  `actions/mail`, `data/mail-workspace`, `/api/mail/*` (cron y adjuntos),
  `lib/mail-agent` (salvo `price-grounding.ts`, movido a `lib/agent/`), los
  `check:mail-*` y `nodemailer`. Las tablas `Mail*` quedan en Neon.
- Tools nuevas: `listEmails`, `readEmail` (hasta 8 por llamada) y
  `groupBudgetRequests`; `draftEmail` con `replyToRef`. IMAP en vivo con
  EXAMINE y `BODY.PEEK` (`lib/mailbox/**`).
- Autocontinuado: tramos de 12 pasos, hasta 3 tramos extra por turno, en un
  mismo mensaje (`lib/agent/auto-continue.ts`, `lib/agent/run.ts`, ruta).
- Verificado: tsc, ESLint (sin `.claude/worktrees`, que trae el `.next` de
  otra rama), `next build`, todos los `check:*`. Lectura real de contacto@:
  51 correos en 30 días, abrir uno sin leer lo deja sin leer. Dos turnos
  reales con Haiku 5.5 sin escribir en la base: 15 tools con 1 autocontinuado
  (US$ 0,011) y revisar pedidos, agrupar, sugerir precio y redactar dos
  respuestas (US$ 0,016).
- `init.ps1` con HARNESS_FULL falla solo por el entorno: el dev server del
  puerto 3000 tiene tomado el DLL de Prisma (el build) y ESLint entra a
  `.claude/worktrees/diseno-trabajos-beaa85/.next`.
- Falta: `HOSTINGER_COMERCIAL_MAIL_USER` y `HOSTINGER_COMERCIAL_MAIL_PASSWORD`
  en `.env` y en Vercel (comercial@ sin probar), el smoke del usuario en la
  app con sesión (tarjetas, línea "siguió sola") y decidir commit y merge.

## Queue

- `feature_list.json` se renumeró el 2026-09-24: las ids 1–10 son contexto
  terminado y la cola va de la 11 a la 20, en orden de prioridad. La tabla de
  equivalencias con los ids viejos está en `progress/history.md`.

## Last Closed Work

- 2026-10-29: instrucciones del equipo (35): versiones de reglas con
  `proposeInstructionChange`, reglas fijas protegidas y pantalla
  `/dashboard/instructions` con restaurar. Migración aditiva aplicada en Neon.
  Mergeada y pusheada a `main` con autorización del 2026-10-29, junto con la
  33 y la 34.

- 2026-10-29: memoria del agente (34): `AgentMemory`, `proposeMemory` y
  `searchMemory` en todas las habilidades, prompt con las vigentes y pantalla
  `/dashboard/memory`. Migración aditiva aplicada en Neon. Probada por el
  usuario. Mergeada en `main` sin push.

- 2026-10-27: Empleados como tabla (30), diseño "Empleados Bambu 1a":
  casillas, orden por nombre o tarifa, pestañas con conteo y barra en lote
  (activar, desactivar, CSV, archivar) con `setEmployeesActive` y
  `archiveEmployees`; el celular sigue con tarjetas. Sumó el selector de
  mes con grilla ("Octubre 2026"), desde/hasta de la empleada atados al mes
  global y la flecha de volver en detalle, resumen y visitas. Sin
  migraciones. Smoke con datos de ejemplo; falta el del usuario con sesión
  (lotes reales, CSV, celular). Mergeada en `main` sin push.

- 2026-10-27: Trabajos como tabla (31), diseño "Trabajos Bambu 1a": pestañas
  de estado con conteo, "Requiere atención", rentabilidad del mes como
  columna y acciones en lote (reactivar, pausar, exportar, archivar) con
  `setJobsStatus` en una transacción. Sin migraciones. Probada por el
  usuario en su Brave. Mergeada en `main` sin push.
- 2026-10-27: tarjetas de lotes de visitas con casillas (29): en agendar
  y en el nuevo `proposeUpdateVisits` (`UPDATE_VISITS`, el mismo cambio en
  2 a 20 visitas con una tarjeta) se desmarcan las visitas que no van; solo
  las marcadas se re-validan y se escriben, todas o ninguna. Migración
  aditiva aplicada en Neon. Smoke con Haiku 5.5, datos archivados. Mergeada
  y pusheada a `main` con autorización del 2026-10-27. Queda: los avisos
  de sueldos cuentan también las visitas desmarcadas.
- 2026-10-21: el agente agenda lotes de visitas (27b): `proposeCreateVisits`
  con hasta 20 visitas de un trabajo, días sueltos o repetición expandida en
  el servidor, tarjeta con cada visita y `createJobOccurrences` que escribe
  todas o ninguna. Migración aditiva aplicada en Neon. Smoke con Haiku 5.5
  (sin OpenAI, por decisión del usuario), datos de prueba archivados.
  Mergeada en `main` y pusheada junto con la 28 con autorización del
  2026-10-21.
- 2026-10-21: endurecimiento del auth (28): rate limits de contraseña,
  2FA, mails y registro con `AuthAttempt` (también en
  `/api/auth/callback/credentials`), `sessionVersion` que corta sesiones al
  cambiar la contraseña o borrar el usuario, y registro sin contraseña (C3).
  Migración aditiva aplicada en Neon. Smoke local con Postgres descartable.
  Mergeada en `main`; pusheada con la 27b el 2026-10-21. Queda del reporte: normalizar emails, errores
  de Resend, headers y avisos al email anterior.
- 2026-10-21: el agente cambia y elimina visitas (27a): `proposeUpdateVisit`
  y `proposeArchiveVisit` con confirmación, re-validación de `updatedAt` y
  equipo, avisos de sueldos y cruces, `queryOperations` por día con el día
  de la semana. Migración aditiva aplicada en Neon. Smoke con Haiku 5.5 sobre
  datos de prueba, ya archivados. Mergeada en `main` sin push. La
  conversación de prueba sigue en el historial del agente.
- 2026-10-21: visitas de regla movidas y aviso de sueldos (27c):
  `generatedStartAt` evita que "Generar visitas" vuelva a llenar el inicio de
  una visita movida, separada o archivada; backfill de 1338 visitas en Neon;
  "Eliminar visita" avisa las horas y el transporte que se restan de sueldos.
  Migración aditiva aplicada en Neon. Mergeada en `main` sin push. Los
  posibles duplicados (Lazarina 18/9, Formula 24/9, Godoy 2/10) quedan como
  están por decisión del usuario.
- 2026-10-20: rediseño de Visitas (26): Agenda, Día por empleada y
  Cronograma con pines en escritorio; agenda por empleada y cronograma
  deslizable con hojas en el celular. Se quitaron Lista y Tarjetas. Sin
  migraciones. Probada por el usuario (registrar, asignar e iPhone).
  Mergeada en `main` sin push.
- 2026-10-09: Claude como proveedor del agente (25): Haiku 5.5 Alto (default
  y recomendado) y Extra alto, Sonnet 5.5 Alto y Opus 5.5 Medio, con selector
  de modelo y esfuerzo y costo por mensaje. Migración aditiva aplicada en
  Neon. Mergeada y pusheada a `main` con autorización del 2026-10-09. El
  smoke en la app lo hace el usuario.
- 2026-10-08: rediseño del agente (24), diseño de claude-design "Agente
  Bambu 2a-2b": columna del historial con grupos (Fijados, Hoy, Ayer,
  Anteriores) y costo del mes, modo dentro del composer, mensajes y tarjetas
  nuevas; en el teléfono el historial es el inicio y la conversación va a
  pantalla completa sin tabs; tabs flotantes en toda la app instalada.
  Migración aditiva `pinnedAt` aplicada en Neon. Mergeada y pusheada a `main`
  con autorización del 2026-10-08.
- 2026-10-08: ajuste de la 23, dictado estilo ChatGPT: el "+" desaparece
  mientras graba, onda de la voz, ■ deja el texto y ➤ lo envía. Mergeado y
  pusheado a `main` con autorización del 2026-10-08.
- 2026-10-08: dictado e imágenes en el agente (23): micrófono con
  `gpt-transcribe` (texto al composer, costo por minuto en "Costos de IA") y
  "+" para subir hasta 7 imágenes por mensaje, achicadas en el navegador y
  subidas una por pedido. Migración aditiva aplicada en Neon. Mergeada y
  pusheada a `main` con autorización del 2026-10-08. Sin smoke de punta a
  punta: el usuario eligió no crear datos de prueba.
- 2026-10-08: Bambú como app en iOS (22): manifest, íconos y meta de iOS;
  tabs Inicio · Visitas · Presupuestos · Agente · Más solo en la app
  instalada; agente a pantalla completa y acomodado al teclado; selector de
  modo compacto con costo estimado por mensaje; sin sugerencias ni chips.
  Probada por el usuario en su iPhone por Wi-Fi. Mergeada y pusheada a
  `main` con autorización del 2026-10-08.
- 2026-09-29: modos del agente (21): Bajo/default Luna 6 xhigh;
  Medio Sol 6.1 low; Alto Sol 6.1 medium. Checks, TypeScript, init y smoke
  autenticado del selector verdes. Commit y push a main autorizados el
  2026-09-29 junto con los commits locales pendientes.
- 2026-09-28: intents explícitos del diálogo de visitas, "Tarjetas" y error
  con Reintentar en la agenda (17), en `main` sin push. Queda fuera: contadores
  del mes en 0 cuando el mes no carga, Refrescar colgado si las opciones de
  filtro se pausan y el toast en inglés de un server action fallido.
- 2026-09-28: calendario y fechas de operaciones en es-UY (16), en `main` sin
  push. El calendario queda en "septiembre" por decisión del usuario. Queda
  fuera: el selector de mes muestra "Setiembre De 2026" (`capitalize`), el
  desborde a 390 px del selector de vistas de Visitas y de Finanzas, y el
  `Close` en inglés de los Sheet y Dialog. (El desborde de Visitas se
  arregló en la 17.)
- 2026-09-28: Resend perezoso, sin Cloudinary y "¿Olvidaste tu contraseña?"
  arreglado (15), en `main` sin push. Queda fuera: `lib/mail.ts` ignora el
  `{ error }` de `resend.emails.send`.
- 2026-09-28: caché de presupuestos (14), en `main` sin push.
- 2026-09-28: limpieza de pruebas del agente (13), solo datos: 7
  conversaciones borradas. En `main` sin push (solo documentación).
- 2026-09-28: huecos de sueldos (12), pusheada.
- 2026-09-28: parche de dependencias con avisos altos (11), pusheado
  (`origin/main` en `2a464de`). Hay que confirmar que el cron de correo
  sincronice bien con mailparser 3.9.20.
- Fuera de alcance, ya estaba en `main`: error de hidratación del botón
  "Nuevo correo" en `/dashboard/email`.

## Decisiones pendientes del usuario

- Qué hacer con los precios con centavos de los presupuestos guardados antes
  de las reglas de precio del agente.
- Si "Abrir en página" se ofrece también desde el Sheet de crear del agente.
- Un `replaceState` durante una navegación pendiente en la página del agente,
  a confirmar.
- Qué período usa la rentabilidad de Trabajos cuando el control de mes deje de
  ser global (se decide en la 18).
- Cargar en Finanzas → Pagos los sueldos de agosto pagados en septiembre (lo
  hace el usuario). Hasta entonces, septiembre muestra $ 120.354 pendientes.
