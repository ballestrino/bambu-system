# Current Harness Session

Status: in_progress

## Active Feature

- 16 `ops_es_uy_locale`, en la rama `feature/16-ops-es-uy-locale`, desde
  `main` en `4eec427`. Código en `9701442`.
  - `lang="es-UY"`. El `Calendar` compartido usa el locale `es` de
    `react-day-picker/locale` (date-fns `es` más los textos de accesibilidad
    en español) con lunes como primer día. Visitas selecciona hoy en el mes
    actual y el primer día de cualquier otro mes (`getDefaultVisitDay` y
    `useTodayKey`, que lee `null` en el servidor para no romper la
    hidratación); los presets de "Generar visitas" ya seguían el día
    seleccionado.
  - PASS: `tsc`, lint, los 30 `check:*` (con `check:ops-locale`, nuevo, y su
    prueba de mutación) y `next build`.
  - Smoke en el Chrome del usuario, solo lectura: escritorio y 390x844 sin
    etiquetas de mes, día ni fecha en inglés en Operaciones, hoy
    seleccionado, y los tres presets siguen al día elegido. Sin datos
    escritos. La verificación está en verde y falta el OK para cerrarla y
    mergearla. Detalle en `progress/impl_ops_es_uy_locale.md`.

## Queue

- `feature_list.json` se renumeró el 2026-09-24: las ids 1–10 son contexto
  terminado y la cola va de la 11 a la 20, en orden de prioridad. La tabla de
  equivalencias con los ids viejos está en `progress/history.md`.
- Activa: 16 `ops_es_uy_locale`. Sigue la 17 `ops_visits_guided_intents`.

## Last Closed Work

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
- Si el calendario debe decir "setiembre" como el resto de Operaciones: el
  criterio de la 16 pide el `es` de date-fns, que dice "septiembre".
