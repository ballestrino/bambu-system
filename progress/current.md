# Current Harness Session

Status: idle

## Active Feature

- None.

## Last Closed Features

- 2026-09-23: la 28, la 35, la 36, la 37 y de la 38 a la 46 pasaron a `done`.
  Detalle en `progress/history.md`.

## Auditoría de las `pending` (2026-09-23)

- Se revisaron la 3, 4, 5, 6, 8, 9, 11, 25, 26 y 27 contra sus criterios en
  `main`. Ninguna está hecha, así que siguen `pending`.
- Seguridad, a priorizar:
  - 4: `actions/settings.ts` no llama a `auth()` y confía en el `id` del
    cliente. `updateEmail` genera el token con el `oldemail` que manda el
    cliente y `newVerification` cambia el email de ese usuario: toma de cuenta.
    También deja renombrar a otro y apagarle el 2FA.
  - 6: `next` 16.1.1 (sin cambios desde el primer commit) tiene dos RCE
    críticos corregidos en 16.3.3 o posterior; `next-auth` beta.30 tiene dos
    críticos corregidos en beta.32. Objetivo: `next` 16.3.6 y React 19.2.8.
  - 3: `actions/budgetCategories/*` no piden sesión, y solo `duplicateBudget`
    mira el dueño del presupuesto.
- Casi hechas:
  - 9: falta que `getJobOccurrences` y `visit-feed` no generen visitas al leer,
    `enabled: open` en jobs y empleadas del diálogo y la medición.
  - 26: falta "Cards" → "Tarjetas", la intención de completar dentro del
    diálogo y el smoke en desktop y 390x844.
- Sin empezar o casi: 5 (Resend y Cloudinary en el scope del módulo;
  `lib/cloudinary.ts` no se usa), 8, 11 (cinco `console.log` de depuración),
  25 (`<html lang="en">`, calendario en inglés con semana desde el domingo) y
  27.

## Pendientes fuera del código

- Vercel, para el agente: confirmar `OPENAI_API_KEY` (o el gateway) y Node
  22.x o 24.x. `maxDuration` sigue en 60: el turno más largo medido fue de
  38,9 s en Medio con Terra; desde la 45 Medio razona con `xhigh`, y con
  Fluid compute conviene subirlo a 300.
- Decisiones del usuario que dejaron las revisiones del agente:
  - qué hacer con los precios con centavos de los presupuestos guardados antes
    de la 44;
  - medir Emails en Medio (Luna 6 `xhigh`) y Alto, o subir `maxDuration`;
  - si "Abrir en página" se ofrece también desde el Sheet de crear;
  - un `replaceState` durante una navegación pendiente en la 42, a confirmar.
- Datos de prueba del agente para borrar:
  - en el generador, "Prueba agente 43 cálculo", "Prueba agente 43
    propuesta", "Prueba 43 aporte vacío", "Prueba 43 propuesta editada" y
    "Prueba 43 confirmar con borrador";
  - en `/dashboard/agent`, las conversaciones de prueba de la 42 y de la 44.
- Datos de sueldos: julio tiene 141 visitas `DONE` sin hora real y los pagos
  de agosto tienen período 1–31 de agosto aunque pagan julio.

## Paused Feature

- Feature 26 - `ops_visits_guided_workflow` sigue `pending` sin cambios de
  código.
