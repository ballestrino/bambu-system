# Feature 22 - Bambú como app en iOS (`pwa_ios_standalone`)

Rama `feat/pwa-ios-standalone`. Plan aprobado por el usuario el 2026-10-08.

## Decisiones del usuario

- Tabs: Inicio · Visitas · Presupuestos · Agente · Más.
- Los tabs aparecen solo en la app abierta desde el ícono (standalone) y en
  celular. En el navegador queda la navegación de siempre.
- Ícono: el logo sobre fondo blanco, generado por script.
- Prueba en el iPhone con `pnpm dev` por Wi-Fi, sin Vercel.

## Qué cambió

- **Manifest e íconos.**
  - `app/manifest.ts` define `start_url` `/dashboard` y `display`
    `standalone`.
  - `pnpm asset:icons` (`scripts/build-app-icons.ts` y
    `scripts/encode-png.ts`) genera `app/apple-icon.png` (180) y, en
    `public/icons/`, los de 192 y 512 y el maskable de 512.
  - Son PNG estáticos: el matcher de `proxy.ts` ya excluye `.png` y
    `.webmanifest`.
- **Meta de iOS** (`app/layout.tsx`):
  - `viewport` con `viewportFit: "cover"` y `theme-color` claro (#ffffff) y
    oscuro (#10130d).
  - `appleWebApp` con barra de estado `default`.
  - Next 16 emite `mobile-web-app-capable`, no la variante `apple-`. iOS
    igual toma `display: standalone` del manifest.
- **Variante y espacio de los tabs** (`app/globals.css`):
  - Variante `app-tabs`: `@media (display-mode: standalone) and (width <
    48rem)` más `:root:has([data-bottom-tabs])`.
  - `--bottom-tabs-space` vale 0 por defecto y 3.5rem + el inset inferior
    bajo esa condición. El `body` lo usa como `padding-bottom`.
- **Navegación.**
  - `components/dashboard/dashboard-nav.ts` reúne los grupos del sidebar,
    los tabs y los grupos de "Más".
  - `components/nav/bottom-tabs.tsx` y `components/nav/more-sheet.tsx`: la
    hoja "Más" (Sheet abajo) lleva el resto de las secciones, herramientas,
    tema, Ajustes y Cerrar sesión.
  - `Nav.tsx` monta los tabs como hermano del header para admins, porque el
    `backdrop-blur` del header atraparía un hijo `fixed`. La hamburguesa y el
    disparador flotante del sidebar se ocultan con `app-tabs:hidden`.
- **Que nada quede tapado.**
  - El layout del dashboard usa `100dvh` y descuenta los tabs.
  - La página del agente y su skeleton descuentan los tabs. El composer usa
    `in-data-agent-page:app-tabs:pb-3`; el orden de las variantes importa,
    porque al revés el selector queda `[data-agent-page] :root`.
  - El botón flotante del agente y `mobileOffset` de Sonner suben con
    `--bottom-tabs-space`.
  - Los adjuntos de correo abren con `target="_blank"`.
- **Arreglo de paso.** `SidebarProvider` del dashboard con `min-h-0`. Su
  `min-h-svh` sumaba el header de 5rem como scroll en todas las páginas del
  dashboard (81 px de sobra a 390x790; en la app, 136 px). Ahora es 0 en
  ambos modos.
- `next.config.ts`: `allowedDevOrigins` sale de `DEV_ALLOWED_ORIGINS` (solo
  dev). Sin eso, Next 16 bloquea con 403 el websocket de HMR pedido desde la
  IP de la PC.

## Verificación

- PASS:
  - `init.ps1` (arnés, Prisma, lint)
  - `tsc --noEmit`
  - `next build`: `pnpm build` falló en `prisma generate` con EPERM porque
    el dev server tenía tomado el engine; el schema no cambió.
- Sin sesión, `/manifest.webmanifest` devuelve JSON (200) y los 4 PNG dan
  200, sin redirigir al login. El `<head>` trae:
  - `viewport-fit=cover`
  - dos `theme-color`
  - `apple-mobile-web-app-title` y `apple-mobile-web-app-status-bar-style`
  - `apple-touch-icon`
  - el link al manifest
- Smoke de solo lectura en el Chrome del usuario (admin). La app se simuló en
  un iframe de 390x790, copiando por JS las reglas de `display-mode:
  standalone` sin la condición:
  - Tabs visibles y el activo correcto en Inicio, Presupuestos (también en el
    detalle de un presupuesto), Agente y Trabajos (marca "Más").
  - Hamburguesa y disparador del sidebar ocultos.
  - La hoja "Más" navega y se cierra.
  - El composer del agente termina 23 px arriba de los tabs, el botón
    flotante 39 px arriba y el área de toasts 72 px sobre el borde.
  - El modo oscuro se ve bien. La consola no tiene errores.
- Sin la simulación (modo navegador): sin tabs, `--bottom-tabs-space` en
  0px y la hamburguesa y el disparador visibles. En escritorio no cambió
  nada.
- Turbopack sirvió un `globals.css` viejo hasta reiniciar `pnpm dev`. Si
  la variante no aparece, reiniciar el server.

## iPhone y agente a pantalla completa

- 2026-10-08: el usuario probó la app instalada en su iPhone por Wi-Fi
  (`DEV_ALLOWED_ORIGINS=192.168.1.5`) y funciona bien.
- Pidió que el agente ocupe la pantalla completa. Con `app-tabs`, la página
  del agente y su fallback quedan `fixed` entre la barra de estado y los tabs
  (`components/agent/agent-page-full-screen.ts`, `z-45`, encima del header
  `z-40` y debajo de los Sheet/Dialog `z-50`). El título y el borde del panel
  se ocultan; los tabs siguen visibles. En navegador y escritorio no cambia.
- Los tabs toman el alto de `--bottom-tabs-space` (borde e inset incluidos).
  Antes medían 56 px más el borde y el agente pisaba ~1 px de su borde.
- PASS: `tsc`, `init.ps1` y `next build`. Smoke en el Chrome del usuario con
  standalone simulado:
  - el agente va de y=0 hasta el borde de los tabs, sin scroll del documento
  - el historial abre encima
  - en modo navegador sigue `static`, con título y header

## Controles del agente (pedido del 2026-10-08)

Cambios pedidos tras probar en el iPhone. Valen en todas partes (página y
Sheet, celular y escritorio):

- **Selector de modo.** Es más chico (h-8 en el teléfono, h-7 en escritorio),
  sin tooltip ni nombre de modelo. Al lado muestra "≈ US$ X por mensaje" y
  cada opción muestra el suyo.
  - El estimado sale de `getAgentSettings`
    (`data/agent/usage-estimates.ts` y `lib/agent/message-cost-estimate.ts`).
  - Si hay 5 o más mensajes de los últimos 60 días con el mismo modelo y
    razonamiento, es su promedio real.
  - Si no, se valora a precio del modelo el uso típico de un mensaje más los
    tokens de razonamiento de su nivel.
  - Hoy da: Bajo ≈ 0,003 (67 mensajes con Luna 6 xhigh), Medio ≈ 0,029 y
    Alto ≈ 0,036 (Sol 6.1 todavía no tiene 5 mensajes).
  - Si falla la lectura del uso, los modos se muestran sin estimado.
- **Costo de la conversación.** Pasa a texto chico y gris a la derecha de la
  fila del modo. Sigue abriendo Costos de IA.
- **Estado vacío.** Sin sugerencias ni descripción de habilidad.
- **Chips de habilidades.** Se eliminan Presupuestos, Emails y Consejos
  (`agent-skill-chips.tsx` borrado, y el `skill` sale de la sesión). Los
  mensajes van con la habilidad general, la que ya era el default.
- **Historial.** El diálogo recibe el foco en vez del buscador
  (`onOpenAutoFocus`), así en el teléfono no salta el teclado.
- **Checks.** `agent-page-source-checks.ts` y
  `check-official-budget-workspace.ts` ahora leen
  `components/dashboard/dashboard-nav.ts`. Los cambios de navegación de esta
  feature los habían roto y no se habían corrido.
- PASS:
  - los 32 `check:*`, con `check:agent-cost-estimate` nuevo
  - `tsc`, `init.ps1` y `next build`
  - smoke en el Chrome del usuario: standalone simulado a 390 px,
    escritorio y el Sheet de "Generar con IA" en un presupuesto, sin enviar
    mensajes ni cambiar el modo

