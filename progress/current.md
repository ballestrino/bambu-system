# Current Harness Session

Status: idle

## Active Feature

- None.

## Queue

- `feature_list.json` se renumeró el 2026-09-24: las ids 1–10 son contexto
  terminado y la cola va de la 11 a la 20, en orden de prioridad. La tabla de
  equivalencias con los ids viejos está en `progress/history.md`.
- Próxima: 18 `ops_contextual_period`.

## Last Closed Work

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
