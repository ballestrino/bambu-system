# Feature 6 - `platform_dependency_patch_review`

Rama `feature/6-platform-deps`, desde `main` en `cfd389c`.

## Versiones

| Paquete | Antes | Después |
| --- | --- | --- |
| `next` | 16.1.1 | 16.3.5 |
| `eslint-config-next` | 16.1.1 | 16.3.5 |
| `react` / `react-dom` | 19.2.3 | 19.3.0 |
| `@types/react` / `@types/react-dom` | 19.2.7 / 19.2.3 | 19.3.0 |
| `next-auth` | 5.0.0-beta.30 (`^5.0.0-beta.20`) | 5.0.0-beta.32 (fija) |
| `@auth/prisma-adapter` | 2.11.1 (`^2.4.2`) | 2.11.3 (`^2.11.3`) |

- Next.js 16.x es la línea Active LTS (nextjs.org/support-policy, consultado
  el 2026-09-23). Su última versión es la 16.3.6, que salió el 2026-09-22 a
  las 16:19 UTC. El `minimum-release-age=1440` global de pnpm la bloqueaba
  hasta el 2026-09-23 a las 16:19 UTC.
- El usuario eligió la 16.3.5. La 16.3.6 solo corrige una RCE crítica en el
  `ImageResponse` Node de `next/og`, que viene de Satori (GHSA-vcvr-r3jv-pc5j,
  afecta de >=16.2.0 a <16.3.6). La app no usa `next/og`, `ImageResponse` ni
  archivos `opengraph-image` o `icon` generados. Subir a 16.3.6 queda para
  cuando pase la regla.
- React: Next 16.2 y 16.3 recomiendan `react@latest`, que es la 19.3.0.
- `next-auth` y `@auth/prisma-adapter` entran por seguridad. `next-auth`
  beta.30 tenía dos críticas (CVE-2026-73420 y CVE-2026-73421) y el adaptador
  traía `@auth/core` 0.41.1, con la crítica del normalizador de emails. Ahora
  queda una sola `@auth/core`, la 0.41.3.
- El lockfile solo cambia dependencias de esos paquetes: sharp 0.35, SWC,
  `@next/env`, el `postcss` interno de Next, `scheduler` y `@auth/core`.

## Notas de migración

- 16.2 y 16.3 no anuncian cambios que rompan esta app. Traen mejoras de dev,
  build y render, y funciones opcionales (Cache Components, Instant
  Navigations, `unstable_catchError`) que no se activaron.
- La página de error 500 por defecto cambió de diseño. La app no define
  `global-error.tsx`, así que en producción se ve la nueva.
- No hizo falta tocar código de la app.

## Audit (`pnpm audit --prod`)

- Antes: 6 críticas, 42 altas, 38 moderadas y 5 bajas.
- Después: 0 críticas, 22 altas, 17 moderadas y 2 bajas. `next`, `next-auth`,
  `@auth/core` y `sharp` salen del reporte.
- Quedan avisos en nodemailer, postcss (el directo), minimatch,
  brace-expansion, nanoid, browserslist, uuid, effect, defu, deepmerge-ts y
  @babel/core, que no entran en esta feature.

## Verificación

- PASS: `tsc`, `pnpm lint` (con `eslint-config-next` 16.3.5, sin reglas
  nuevas rotas) y `pnpm exec next build` en Next 16.3.5, sin avisos.
- PASS: los 25 `check:*`. `check:agent-sheet` fallaba en un checkout con
  CRLF porque `scripts/agent-usage-rows-checks.ts` (de la 45) no normalizaba
  los finales de línea. Se alineó con los demás scripts.
- PASS: `next dev` en el 3001 sin sesión:
  - el login carga sin errores en la consola;
  - `/api/auth/session`, `providers` (Google y credenciales) y `csrf`
    responden 200;
  - `/settings` y `/dashboard/*` redirigen;
  - `/auth/new-verification` abre;
  - el servidor no registra errores.
- PASS: smoke con sesión en el Chrome del usuario, con los procesos
  cerrados, `.next` borrada y `pnpm dev` de nuevo en el 3000 con Next
  16.3.5:
  - la sesión existente sigue válida con `next-auth` beta.32;
  - Inicio, Generador de presupuestos, Visitas, Finanzas, Empleados y
    Configuración cargan con datos;
  - el agente en `/dashboard/agent`, en Medio, respondió "¿Cómo viene el
    mes?" con dos tools de lectura (Luna 6, 20,1k tokens, US$ 0,0013, 25 s);
  - todas las respuestas del servidor son 200, sin errores en la consola ni
    en el servidor.
- PASS: el usuario cerró sesión y volvió a entrar con credenciales en Next
  16.3.5 y `next-auth` beta.32.
- Datos: la conversación "¿Cómo viene el mes?" quedó en `/dashboard/agent`.
