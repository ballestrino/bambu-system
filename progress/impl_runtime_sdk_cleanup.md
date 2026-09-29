# Feature 15 - `runtime_sdk_cleanup`

Rama `feature/15-runtime-sdk-cleanup`, desde `main` en `0e1d298`. Commits
`357a602` (la feature) y `4fa783c` (la ruta de recuperación que encontró el
smoke).

## Qué cambió

- `lib/mail.ts`: `getResend()` crea el cliente con el primer correo y
  `getBaseUrl()` lee `NEXT_PUBLIC_BASE_URL` al mandarlo, sin la barra final.
  Si falta alguna, falla con un error en español que la nombra. Antes, `new
  Resend(undefined)` corría al importar el módulo y tiraba "Missing API
  key", así que rompía cualquier acción que lo importara (login, registro,
  reset y settings).
- Cloudinary retirado: se borró `lib/cloudinary.ts` (no lo importaba nadie),
  y se sacaron la dependencia `cloudinary`, `CLOUDINARY_*` de `.env.template`
  y el bloque `images` de `next.config.ts`. En el lockfile solo cambia esa
  dependencia. Solo lectura: 3 usuarios y ninguno con `image`.
- `updateProfileImage` devuelve `{ error: "La subida de imágenes de perfil
  está desactivada" }` en lugar de un éxito. Ninguna pantalla la llama.
- `data/user.ts`: sin `try/catch` ni `console.log`. Un usuario que no existe
  es `null`; un error de la base sube a la acción, que antes lo leía como
  "no registrado". Los que la llaman (login, reset, registro, verificación,
  nueva contraseña y `getSessionUser`) no dependían del `undefined`.
- Wrappers de categorías: el de crear se exporta como
  `createBudgetCategoryAction` (era `getBudgetCategoryAction`) y dice "Error
  al crear la categoría". El de leer dice "Error al obtener la categoría".
  `get-budgets` usa "No se pudieron leer los presupuestos" en vez de
  "Unexpected error state". El wrapper de crear no lo usa nadie: el hook
  llama a la acción del servidor directamente.
- Smoke: `/auth/reset` nunca estuvo en `routes.ts`, así que `proxy.ts` lo
  trataba como privado y "¿Olvidaste tu contraseña?" volvía al login. Se
  agregó a `authRoutes`, como login y registro (con sesión, el cambio se pide
  desde Configuración).

## Verificación

- PASS: `init.ps1`, `tsc`, `pnpm lint`, los 29 `check:*` y `pnpm build`
  completo (con `prisma generate`).
  - `check:mail-config` es nuevo: importa `lib/mail.ts` sin configuración,
    prueba los errores de clave y URL faltantes y, con un `fetch` falso (no
    se manda nada), los links y destinatarios de los tres correos. Con el
    `lib/mail.ts` anterior falla al importar.
  - `check:settings-auth` ahora verifica el error de `updateProfileImage`,
    que `lib/cloudinary.ts` no vuelva y que `/auth/reset` abra sin sesión.
- Smoke del usuario en `localhost:3000`, con correos reales:
  - registro, con el mail de verificación y su link: pasa;
  - código de dos pasos: pasa;
  - recuperación de contraseña: el botón no abría la página (el bug de
    arriba). Con el arreglo abre `/auth/reset` (verificado en el navegador
    integrado, sin sesión) y el mail llegó.
  - Logs del servidor sin errores.
- Datos: el smoke creó una cuenta de prueba (rol USER, sin presupuestos ni
  conversaciones) y dejó un token de recuperación sin usar. El usuario
  decidió conservarla.

## Fuera de alcance

- `resend.emails.send` devuelve `{ error }` en lugar de lanzar, y
  `lib/mail.ts` lo ignora: un envío rechazado por Resend igual responde
  "Email enviado".
