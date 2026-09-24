# Current Harness Session

Status: idle

## Active Feature

- None.

## Last Closed Features

- 2026-09-23: la 4 (acciones de settings seguras), la 6 (`next` 16.3.5,
  React 19.3.0, `next-auth` beta.32 y `@auth/prisma-adapter` 2.11.3), la 3
  (permisos de presupuestos y categorías, compartidos entre admins) y `next`
  16.3.6. Detalle en `progress/history.md` y en los `impl_*.md` de cada una.
- 2026-09-23: la 28, la 35, la 36, la 37 y de la 38 a la 46 pasaron a `done`.
- Push a `origin/main` el 2026-09-23, a pedido del usuario, con la 4, la 6, la
  3 y `next` 16.3.6. Falta confirmar que el deploy de Vercel haya terminado
  bien: hasta entonces, producción sigue con los agujeros que corrigen.
- Ramas locales: solo queda `main`. Las remotas viejas (`origin/*`) siguen.

## Auditoría de las `pending` (2026-09-23)

- Se revisaron la 3, 4, 5, 6, 8, 9, 11, 25, 26 y 27 contra sus criterios en
  `main`. Ninguna estaba hecha. La 4, la 6 y la 3 ya se cerraron.
- Seguridad, a priorizar:
  - Quedan 22 altas del audit en otras dependencias: nodemailer, postcss (el
    directo), minimatch, brace-expansion, nanoid, browserslist y otras. No hay
    feature que las cubra.
- Casi hechas:
  - 9: falta que `getJobOccurrences` y `visit-feed` no generen visitas al leer,
    `enabled: open` en jobs y empleadas del diálogo y la medición.
  - 26: falta "Cards" → "Tarjetas", la intención de completar dentro del
    diálogo y el smoke en desktop y 390x844.
- Sin empezar o casi: 5 (Resend y Cloudinary en el scope del módulo;
  `lib/cloudinary.ts` no se usa), 8, 11 (los `console.log` de presupuestos
  ya los sacó la 3; quedan los de `data/user.ts`),
  25 (`<html lang="en">`, calendario en inglés con semana desde el domingo) y
  27.

## Pendientes fuera del código

- Decisiones del usuario que dejaron las revisiones del agente:
  - qué hacer con los precios con centavos de los presupuestos guardados antes
    de la 44;
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
