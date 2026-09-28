# Feature 11 - `security_dependency_patch`

Rama `feature/11-security-dependency-patch`, desde `main` en `4a63e22`.
Commit de código: `b61deab`.

## Versiones

| Paquete | Antes | Después |
| --- | --- | --- |
| `nodemailer` | 7.0.13 | 9.1.1 (`^9.1.1`) |
| `mailparser` | 3.9.15 (`^3.9.15`) | 3.9.20 (fija) |
| `postcss` | 8.5.6 | 8.5.28 (`^8.5.28`) |
| `prisma` / `@prisma/client` | 6.19.1 | 6.19.3 (`^6.19.3`) |
| `@types/nodemailer` | 7.0.12 | 8.0.2 |
| `resend` | 6.6.0 | 6.30.0 (`^6.30.0`) |
| `uuid` | 13.0.0 | eliminada |

- Nodemailer 9 y no 10, por decisión del usuario. La 10 es una reescritura a
  TypeScript del 2026-09-03 que ya lleva 12 parches; la 10.0.11 (del
  2026-09-27) arregló la compatibilidad del entry CommonJS y de los tipos.
  Pasar a la 10 queda para cuando se estabilice.
- `mailparser` va fija porque cada versión fija su nodemailer exacto: la
  3.9.20 trae la 9.1.1 y desde la 3.9.21 trae la 10. Así queda una sola copia.
- Breaking changes de nodemailer 7 → 9 revisados contra `lib/mail-agent/`:
  - la 8 cambia el código `NoAuth` por `ENOAUTH`, que no se usa;
  - la 9 valida TLS al bajar contenido remoto (adjuntos por URL, OAuth2,
    proxy), y acá los adjuntos son Buffer y la auth es usuario y contraseña;
  - `nodemailer/lib/mail-composer` sigue existiendo.
- `uuid` salía solo en `lib/tokens.ts`. Ahora usa `crypto.randomUUID()`
  (v4 con CSPRNG, igual que `smtp.ts`).
- `resend` 6.30.0 reemplazó `svix` por `standardwebhooks` (desde la 6.12.4).
  Con eso salen `uuid` 10, `url-parse` y el `@types/node` 22 que traía svix.
  Del 6.6 al 6.30 no hay cambios en `emails.send`.
- Override con alcance en `pnpm-workspace.yaml`:
  `@prisma/config>deepmerge-ts: 8.0.2`. Prisma fija 7.1.5 exacto, incluso
  en la 7.10. `@prisma/config` solo llama a `deepmerge()`, y los breaking
  changes de la 8 son de `deepmergeInto` y de tipos.
- `pnpm update --depth Infinity` re-resolvió dentro de sus rangos, sin
  tocar `package.json`: minimatch 3.1.5 y 9.0.9, brace-expansion 1.1.21 y
  2.1.7, defu 6.1.7, browserslist 4.29.1, @babel/core 7.29.7, flatted
  3.4.4, js-yaml 4.3.2 y picomatch 2.3.2 y 4.0.7. nanoid pasa a 3.3.19 por
  postcss.
- `minimum-release-age=1440` respetado: pnpm tomó browserslist 4.29.1 y no
  la 4.29.2 del mismo día.
- En el lockfile no cambian versiones de `react`, `react-dom`, `next` ni
  Radix. En `next` solo cambia el sufijo del peer opcional `@babel/core`.

## Audit

- `pnpm audit --prod`: de 22 altas, 17 moderadas y 2 bajas a 1 moderada.
- `pnpm audit` completo: de 32 altas a 0 altas y 3 moderadas.
- Excepciones que quedan (ninguna alta ni crítica):
  - `uuid` 8.3.2 en `exceljs` (GHSA-w5hq-g745-h8pq): afecta v3/v5/v6 con
    `buf`, y exceljs solo llama a `v4()` sin buffer. exceljs 4.4.0 es la
    última y fija `uuid@^8`.
  - `ajv` 6.12.6 y `@humanfs/node` 0.16.7 en `eslint`: solo dev. Se
    corrigen con ESLint 10, que es una mayor.
- Aviso de peer esperado: `next-auth` y `@auth/core` piden nodemailer
  `^7.0.7 || ^8.0.5` como peer opcional del proveedor de email de Auth.js.
  La app usa solo Credentials y Google, así que no aplica.

## Verificación

- PASS: `pnpm exec prisma generate`, `tsc --noEmit`, `pnpm lint`, los 27
  `check:*` (con `check:mail-agent` y `check:job-export`) y `pnpm build`
  sin avisos.
- PASS: ida y vuelta en Node, sin red: `MailComposer` (nodemailer 9.1.1)
  arma un mail con asunto con ñ, CC, `In-Reply-To`, `References` y un
  adjunto, y `simpleParser` (mailparser 3.9.20) lo parsea igual. El
  `jsonTransport` envía y `resend.emails.send` existe.
- PASS: smoke con sesión en el Chrome del usuario, en `next dev`:
  - `/dashboard/email`: carpetas, lista y detalle del hilo "Petición de
    servicio Web". Solo lectura.
  - `/dashboard/jobs` → "Exportar Excel": se interceptó el blob antes de
    guardarlo. `trabajos-2026-09-28.xlsx`, 13.672 bytes, zip válido con
    `xl/workbook.xml` y `sheet1.xml`. Sin errores en la consola.
- NOT RUN: "Volver a revisar" (sync IMAP real con mailparser), porque
  escribe mails en producción y genera sugerencias con OpenAI. Lo cubre la
  ida y vuelta de arriba; en producción lo ejercita el cron.

## Fuera de alcance

- Error de hidratación en `/dashboard/email`: el SSR no dibuja el botón
  "Nuevo correo" (`MailComposeDialog` con `DialogTrigger asChild` y el
  trigger como prop desde un Server Component), y el cliente lo crea al
  hidratar. Se reprodujo igual en `main` (`4a63e22`) con sus dependencias,
  así que viene de antes de esta feature.
