# Feature 16 - `ops_es_uy_locale`

Rama `feature/16-ops-es-uy-locale`, desde `main` en `4eec427`. Código en
`9701442`.

## Qué cambió

- `app/layout.tsx`: `<html lang="es-UY">` (era `en`).
- `components/ui/calendar.tsx`: el `Calendar` compartido usa por defecto el
  locale `es` de `react-day-picker/locale`, con `weekStartsOn = 1` (lunes).
  Ese locale es el `es` de date-fns más los textos de accesibilidad de
  DayPicker en español ("Hoy, lunes, 28 de septiembre de 2026, seleccionado",
  "Ir al mes anterior"). El desplegable de meses ya no usa
  `toLocaleString("default")`: formatea con la librería de fechas que le pasa
  DayPicker, así que sigue al `locale` del calendario. Quien pase otro
  `locale` o `weekStartsOn` lo sobreescribe, como antes con cualquier prop.
  También lo usa el filtro de fechas de presupuestos.
- Visitas selecciona hoy por defecto:
  - `getDefaultVisitDay(month, todayKey)` en `calendar-utils.ts`: hoy si el
    calendario muestra el mes actual, el primer día de cualquier otro mes.
  - `useTodayKey()` (`components/ops/hooks/useTodayKey.ts`) entrega el día
    local del navegador con `useSyncExternalStore`. El servidor y la pasada
    de hidratación leen `null` y caen en el primer día del mes: un "hoy"
    calculado en el servidor (UTC) difiere del de Montevideo desde las 21:00
    y rompería la hidratación. Tras hidratar pasa a hoy; en una navegación
    del lado del cliente arranca en hoy.
  - Sigue valiendo lo que el usuario elige en el mes: si toca otro día, ese
    día manda mientras siga en ese mes.
- Los presets de "Generar visitas" ya salían del día seleccionado
  (`dayKey` en `calendar-month-panel.tsx`), así que siguen al nuevo
  valor por defecto sin tocar el panel ni el diálogo.

## Verificación

- PASS: `init.ps1`, `tsc`, `pnpm lint`, los 30 `check:*` y `next build`
  (sin `prisma generate`: el schema no cambió y había un servidor de
  desarrollo con el cliente cargado).
  - `check:ops-locale` es nuevo. Renderiza el `Calendar` de verdad
    (`renderToStaticMarkup`) y prueba: semana `lu…do`, título
    `septiembre 2026`, etiquetas de accesibilidad y del día en español, meses
    del desplegable `ene…dic`, ningún mes, día ni "Today/Selected" en inglés,
    `weekStartsOn` sobreescribible. Prueba `getDefaultVisitDay` (mes actual,
    mes anterior y siguiente, mismo mes de otro año, cambio de año, 29 de
    febrero, sin día conocido, medianoche local) y que el hook lee `null` en
    el servidor. Falla contra el layout, el calendario y Visitas anteriores
    (probado cada uno por separado).
- Smoke en el Chrome del usuario (`localhost:3000`, solo lectura, hora local
  21:29, cuando el día UTC del servidor ya era el 29):
  - Escritorio, Visitas: `lang="es-UY"`, título `septiembre 2026`, semana
    `lu ma mi ju vi sá do`, el 28 (hoy) seleccionado con la etiqueta "Hoy,
    lunes, 28 de septiembre de 2026, seleccionado" y "Agenda del 28 set.
    2026".
  - "Generar visitas" con el 28 seleccionado: "Semana del día" 28/09 →
    04/10. Con el 15: semana 14/09 → 20/09, "Todo el mes" 01/09 → 30/09 y
    "Del día a fin de mes" 15/09 → 30/09. No se generó nada (el preview no
    escribe; se cerró con Escape o "Cancelar").
  - Otro mes: octubre selecciona el 1 (su semana 28/09 → 04/10) y agosto el
    1. Al volver al mes actual queda el día elegido (15).
  - Barrido de textos, `aria-label`, `title`, placeholders y texto de SVG
    buscando meses, días, "Today", AM/PM y ordinales en inglés, en escritorio
    y en un iframe de 390x844 del mismo origen (el Chrome del usuario no
    deja achicar su ventana): Visitas (Calendario, Cronograma, Lista, Cards,
    sheet de filtros y diálogo de generar), Inicio, Trabajos, detalle y
    visitas de un trabajo, Empleadas, sus tres pantallas de detalle,
    Devengados, Finanzas, Pagos, Sueldos, Costos y Correo. Sin etiquetas en
    inglés: solo salieron textos cargados por usuarios ("Jan de Nul", "Sept/Oct"
    en el nombre de un presupuesto, "Monday" en un correo de un cliente).
  - Consola: un aviso de hidratación cuyo diff es solo
    `cz-shortcut-listen="true"` en `<body>` (una extensión del Chrome del
    usuario), sin nada de Visitas.
  - `localStorage` como estaba: mes `2026-09` y vista `calendar`.

## Fuera de alcance

- El calendario dice "septiembre" (date-fns `es`, como pide el criterio) y
  el resto de Operaciones "setiembre" (`Intl` es-UY: el selector de mes
  "Setiembre De 2026" y "Semana del 28 de setiembre…" del cronograma). Ambas
  se aceptan; falta decidir si el calendario debe decir "setiembre".
- El selector de mes de arriba muestra "Setiembre De 2026": la clase
  `capitalize` pone en mayúscula también el "de".
- A 390 px el documento se desborda en dos pantallas que no usan el
  calendario: el selector de vistas de Visitas (418 px) y Finanzas (448 px).
- `dayKey` de `calendar-month-panel.tsx` pasa el día seleccionado por la zona
  de Montevideo; en un navegador al este de Uruguay caería un día antes.
- El `Close` de accesibilidad de los Sheet y Dialog de shadcn sigue en inglés.
- Los `<input type=date|month|time>` nativos muestran el idioma del
  navegador; en el Chrome del usuario salen `28/09/2026`.
