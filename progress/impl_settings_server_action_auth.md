# Feature 4 - `settings_server_action_auth`

Rama `feature/4-settings-auth`, desde `main` en `102c98a` (después de la 45 y
la 46, que no tocan nada de settings).

## Qué estaba mal

- `actions/settings.ts` no llamaba a `auth()`. Las seis acciones recibían el
  `id` del usuario desde el cliente.
- `updateEmail` generaba el token con el `oldemail` que mandaba el cliente, y
  `newVerification` cambia el email de quien tenga ese `oldemail`. Con tu
  propio id y contraseña, más el email de otra persona, te quedabas con su
  cuenta al verificar.
- Con el id de otro usuario se le podía cambiar el nombre y prender o apagar el
  2FA.
- `data/user.ts`, `lib/tokens.ts` y los cuatro `data/*token*` y
  `two-factor-confirmation` eran `"use server"`: cada export es un endpoint
  público, entre ellos el generador de tokens de verificación y las lecturas de
  tokens de reset.

## Qué cambió

- `actions/settings/account.ts` (nombre, email e imagen) y
  `actions/settings/security.ts` (contraseña y 2FA). Cada acción arranca con
  `getSessionUser()`, valida con `schemas/settings.ts` y escribe solo sobre
  `user.id`. Ninguna recibe un id.
- `updateEmail` toma el email a reemplazar de la base (`user.email`) y rechaza
  el mismo email que ya tenés.
- `lib/session-user.ts` (`server-only`): `auth()` y después la fila de la base,
  o `null`.
- `schemas/settings.ts`: nombre (trim, 2 a 50), email y contraseña, cambio de
  contraseña con confirmación que coincide (antes el formulario no lo
  comparaba) e imagen (`data:image/`, 5MB).
- Sin `"use server"`: `data/user.ts`, `lib/tokens.ts`,
  `data/verification-token.ts`, `data/password-reset-token.ts`,
  `data/two-factor-token.ts` y `data/two-factor-confirmation.ts`. Solo los
  importan acciones y `auth`.
- `app/settings/page.tsx` es un Server Component: lee la sesión con `auth()` y
  redirige al login sin ella. Los formularios y el botón de cerrar sesión
  (`components/settings/sign-out-button.tsx`) son los componentes de cliente.
- Cambiar el nombre hace `update()` y `router.refresh()`, así que ya no hace
  falta refrescar la página a mano. Cambiar el email avisa con un toast a
  dónde se mandó el enlace; antes cerraba el diálogo sin decir nada.
- Los diálogos de nombre y email ya no quedan en "Guardando..." si el campo
  está vacío.
- Borrados sin uso, que además pasaban `user.id`: `security-page.tsx`,
  `Enable2FA.tsx`, `enable-2fa-dialog.tsx` y `2FA-policy.tsx`.
- `updateProfileImage` sigue sin subir nada (depende de la 5 y Cloudinary) y
  ninguna pantalla la usa, pero ya pide sesión y valida.

## Enlaces de los correos con sesión (hallado en el smoke)

- El usuario siguió el enlace de confirmación del cambio de email y terminó
  en el home. `/auth/new-verification` y `/auth/new-password` estaban en
  `authRoutes`, y el proxy manda al home a quien entra logueado a esas rutas.
  El cambio de email y el "¿Olvidaste tu contraseña?" de Configuración se
  piden con sesión, así que el token nunca se usaba. El bug venía desde
  `2b67108`.
- Las dos rutas pasaron a `publicRoutes`, así que abren con o sin sesión.
- `newVerification` devuelve `emailChanged: true` en un cambio de email, y
  el formulario va a `/settings` en vez de `/auth/login`. Sin sesión, el
  proxy la sigue mandando al login. Se sacó el `session.user.email = ...`, que
  no hacía nada: el callback `jwt` recarga el usuario por id en cada lectura.

## Verificación

- PASS: `check:settings-auth` (nuevo). Revisa el código fuente (ninguna acción
  recibe identidad, todas empiezan por la sesión y validan, el email a
  reemplazar sale de la base, ningún helper de auth es `"use server"`, los que
  llaman no mandan ids, página de servidor) y el comportamiento de los schemas.
- PASS: 14 de 14 mutaciones detectadas (email del cliente, parámetro `id`,
  acción sin sesión, sin validar, `"use server"` de vuelta, página cliente,
  confirmación sin comparar, fallback en el id de la sesión y escritura sobre
  otro id).
- PASS: `tsc`, ESLint, `.\init.ps1` y `pnpm exec next build`.
- PASS: el manifiesto de Server Actions del build tiene las cinco acciones de
  settings que usa la UI y ninguna de `data/user`, `lib/tokens` ni los
  `data/*token*`.
- PASS: sin sesión, `/settings` redirige al login.
- PASS: `check:settings-auth` también cubre que los dos enlaces sean
  públicos y la redirección a `/settings`. La mutación que devuelve
  `/auth/new-verification` a `authRoutes` se detecta.
- PASS: sin sesión, `/auth/new-verification` con un token inválido carga y
  muestra "La verificación expiro".
- PASS (2026-09-23): smoke del usuario con sesión. El cambio de nombre, el
  de correo (con el enlace de confirmación), el de contraseña y el 2FA
  funcionan.

## Fuera de alcance

- `data/budget.ts`, `data/budgets.ts` y `data/budgetCategory.ts` siguen siendo
  `"use server"` y aparecen en el manifiesto (`getBudgetCategories` y
  `getBudgetCategoryById` sin sesión). Le toca a la 3.
- `components/settings/security/reset-password-form.tsx` no lo importa nadie
  desde antes de esta feature (usa `resetPasswordLoggedIn`, que ya era
  seguro). Para la 11.
- Los `console.log` de `data/user.ts` son de la 11.
