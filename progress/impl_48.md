# Implementación - billing_list_filters (feature 48)

Rama `claude/elegant-edison-wmcobi`, sobre la 47 (`a36df32`).

## Qué hace

- Las pestañas "Borrador N/M" y "Emitidas N" pasan a vistas Borrador,
  Emitidas y Archivadas (`billing-views.tsx`, antes `billing-tabs.tsx`).
  Cada vista cuenta lo que muestra con los filtros puestos. Archivadas
  reemplaza al plegable "Archivadas · N" de la 47.
- Filtros (`lib/billing/billing-list-filters.ts`, reglas puras): tipo
  (e-Factura 11x y exportación, e-Ticket 10x, notas de crédito o débito),
  estado ante DGI (pendiente = `ISSUING`/`ISSUED`, aceptada, rechazada, sin
  confirmar), marcadas o desmarcadas (solo en el borrador) y búsqueda por
  nombre sin tildes o por los dígitos del RUT/cédula (desde 3). Se filtra en
  el cliente sobre el mes cargado (`hooks/use-billing-list.ts`), al
  instante, y los filtros siguen al cambiar de mes.
- Diseño por pedido del usuario durante la sesión: sin chips. En escritorio
  "Filtros · N" abre y cierra un panel con un desplegable por grupo y
  "Limpiar filtros" al lado. En el teléfono, un botón redondo con la cuenta
  abre la misma hoja inferior que los filtros de Visitas (`VisitSheet`),
  con los campos grandes, "Limpiar" y "Ver N facturas".
- "Emitir N" sigue con el borrador entero (`BillingIssueBar draft={draft}`);
  si el filtro oculta marcadas, el borrador avisa "El filtro oculta N
  marcadas: Emitir las incluye igual". Una vista sin coincidencias muestra
  "Ninguna factura coincide" con "Limpiar filtros".
- `DraftRow` e `IssuedInvoiceRow` traen `document` (el RUT o la cédula del
  receptor) para buscar.
- De paso: con el borrador vacío, en el teléfono ya no queda la tarjeta sin
  contenido (nota de la revisión de la 47).

## Verificación

- PASS: `tsc --noEmit`, `pnpm lint`, `pnpm check:billing` (con
  `scripts/billing-filter-checks.ts`: tipo, búsqueda, grupos por vista,
  combinaciones, que marcadas no aplica a Emitidas, que lo no emitido no
  tiene estado DGI, totales de "Emitir" y fuente), `init.sh`, `pnpm build`.
- Chromium con `next dev` sobre un Postgres 16 local (borrador de noviembre
  con una desmarcada; emitidas aceptada, pendiente, e-Ticket y nota; una
  rechazada archivada; Biller con un token falso de test):
  - 1440 px: "Desmarcadas" deja 3 en Borrador y la barra en 2 marcadas ·
    $ 29.280 con el aviso; + e-Factura → 2; cerrar el panel conserva los
    filtros; en Emitidas solo Tipo y Estado DGI; Aceptada + "2145" → 1
    (Hotel Costa); Limpiar vuelve a 5/3/2; archivar desde Emitidas la pasa a
    Archivadas. Sin errores de página.
  - 390 px: sin scroll horizontal; el botón redondo abre "Filtrar facturas"
    con los tres campos (dos en Emitidas), "Ver 2 facturas", la cuenta en el
    botón, "Limpiar" en la hoja y la búsqueda por RUT.
- El 500 de la consola es la sincronización con el token falso de Biller
  (`ValidationError` tirado en la server action, ya anotado en la 43).
