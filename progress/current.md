# Current Harness Session

Status: in_progress

## Feature 37 - Sueldos a mes vencido

- Feature 37 - `ops_payroll_paid_in_arrears`, sin commitear en `main`. Queda
  `pending` por lo mismo que la 36: la 35 ocupa el único `in_progress`.
- Los pagos a empleadas se siguen contando en el mes en que se hacen:
  `assignedMonth`, el Resumen, la tendencia, Costes y el PDF no cambian.
- Lo que cambia es contra qué se compara el saldo. En Finanzas → Pagos,
  `/dashboard/payroll` y la ficha de la empleada, el mes M compara los pagos
  de M contra las visitas realizadas de M−1 (horas, sugerido, devengamientos y
  saldo). La regla vive en `getPayrollWorkMonth` (`lib/ops/finance`), y
  `getPayrollPeriod` arma el rango y los nombres de mes.
- Finanzas tiene una query propia, `payrollOccurrences`, que solo se activa
  en Pagos. Usa el mismo scope que la query mensual de M−1, así que comparten
  caché. Cobros y Resumen siguen leyendo las visitas de M.
- `PayrollDialog` ya no recibe `periodStart`/`periodEnd`: calcula solo el mes
  asignado (M) y el período trabajado (M−1). Así también se corrige el acceso
  de la ficha de la empleada, que abría el diálogo sin período.
- En la ficha de la empleada, "Periodo desde/hasta" pasó a "Pagos
  desde/hasta": esas fechas eligen el mes de los pagos, no el período trabajado.
- `es-UY` escribe "setiembre", y el mes suelto en mayúscula ("Agosto"). Por
  eso se pasa a minúscula, porque va en medio de la frase.

### Verificación de la 37

- PASS: `check:finance` (con el mes anterior y el cruce de año),
  `check:finance-tables`, `check:finance-trend`, `tsc` y el lint de las carpetas
  tocadas.
- PASS: recálculo de solo lectura contra la base con las mismas funciones de la
  pantalla. Setiembre pasa de sugerido 49.132 (horas de setiembre en curso) a
  120.858 (horas de agosto), con pagado 0 y saldo 120.858. Agosto pasa a
  comparar sus 100.296 pagados contra julio.
- NOT RUN: smoke en navegador. Ni el navegador integrado ni Chrome tenían
  sesión en `localhost:3000`.
- Datos: julio tiene 141 visitas `DONE` sin hora real, así que su sugerido da
  772 y agosto muestra saldo −99.524. Es un hueco de carga previo a este cambio,
  no un error de cálculo. Además, los pagos de agosto (del 6 al 28) tienen
  período 1–31 de agosto, aunque pagan julio. Eso no afecta a Finanzas, que
  usa `assignedMonth`, pero sí al resumen por período de la empleada, que
  filtra por período.

## Feature 36 - Tablas buscables en Finanzas

- Feature 36 - `ops_finance_searchable_tables`, en la rama
  `finanzas-dashboard-navegacion`. Verificación en verde y commiteada, pero
  **sigue `pending`** hasta el cierre de sesión: la 35 ocupa el único
  `in_progress`.
- Cobros, Costes y Pagos dejaron las tarjetas y los `OpsScrollContainer`: cada
  uno es una tabla compacta con encabezados ordenables (`aria-sort`), 25 filas
  por página y un pie con conteo y total registrado. Reemplaza el criterio de
  la 28 que pedía conservar el scroll interno.
- Un solo buscador por sección, dentro de la toolbar de filtros. No distingue
  acentos ni mayúsculas y busca montos crudos y formateados (`12900`,
  `12.900`). "Limpiar" también lo vacía.
- El normalizador estaba copiado tres veces y la copia de `data/ops/shared.ts`
  es `server-only`. Pasó a `lib/search-text.ts`, y los dos selects y `data/`
  delegan en él.
- Cobros y Pagos muestran una tabla a la vez con un selector de vista en
  `?vista=` (`equipo`, `registrados`). Cambiar de vista hace `replace()`, no
  `push()`. "Ver todo" del Resumen abre `?seccion=cobros&vista=equipo`.
- Los diálogos se montan por fila y solo mientras están abiertos (`trigger={null}`
  más `defaultOpen`). Antes había un `PaymentDialog` y un `DeleteDialog` por
  tarjeta. Radix devuelve el foco al trigger, que acá no existe, así que
  `useRowDialog` se lo devuelve al botón que abrió el diálogo.
- Debajo de `sm` el monto y las acciones se pliegan en la primera celda
  (`OpsRowMobileAside`). Sin eso la tabla desbordaba 62px a 390px.
- `useOpsTableState` guarda la página junto con la firma de query, orden y
  filtros. Si la firma cambia vuelve a la página 1 sin `useEffect`. El hook no
  expone refs: `react-hooks/refs` marca cualquier objeto que contenga una.
- La toolbar de Costes apilaba sus cuatro selects `w-full` en filas completas
  desde `lg`. Ahora comparten una línea.
- Sin cambios en `/payments`, `/costs`, `/payroll`, la ficha del trabajo ni la de
  la empleada: las props nuevas de diálogos, filtros y resúmenes son opcionales.

### Verificación de la 36

- PASS: `check:finance-tables` (nuevo), `check:finance`, `check:finance-trend`,
  `check:finance-pdf`, `check:employee-accruals`, `check:profitability`, `tsc`,
  lint completo, `pnpm exec next build` y `pnpm harness`.
- PASS: smoke autenticado en Chrome, agosto 2026, en oscuro y claro. Esto cubrió:
  - La búsqueda (`maria` encuentra María, `15.337` y `9637` encuentran el
    monto, sin resultados ofrece limpiar).
  - El orden, la página 2 (26–33 de 33) y el cambio de vista.
  - Back y forward, "Ver todo" y la fila expandible de Pagos.
  - Editar y "Registrar pago" abren precargados y el saldo sugerido es 12844.
    Anular abre la confirmación. Todos se cancelaron sin guardar.
  - El foco vuelve al botón que abrió el diálogo, incluido el cierre con Escape.
  - Los estados de carga (skeleton con `aria-busy`) y vacío.
- PASS: los totales del pie de Por empleada coinciden con los KPIs (sugerido
  120.858, pagado 100.296, saldo 20.562).
- PASS: 390x844 emulado con un iframe del mismo origen, porque `resize_window`
  sigue sin cambiar el viewport. En las cinco vistas no hay overflow horizontal
  y los targets miden 44px.
- PASS: regresión de `/dashboard/payments`, `/costs`, `/payroll`, la ficha del
  trabajo y la ficha de la empleada. Siguen con sus tarjetas y botones.
- Consola: solo la advertencia de hidratación de una extensión
  (`cz-shortcut-listen`) y la de `Description` en los diálogos de alta y edición,
  que ya estaba antes.

## Active Feature

- Feature 28 - `ops_finance_task_navigation`. El código está implementado y
  commiteado en la rama `finanzas-dashboard-navegacion`, pero **sigue `pending`
  en `feature_list.json`**: falta el smoke a 390x844 que pide su criterio 7, y
  la 35 todavía ocupa el único lugar de `in_progress`.

### Lecturas sin escrituras

- `getOperationalCostCategories` ya no siembra las cuatro categorías por defecto
  en cada lectura y `getOpsCostSettings` usa `findUnique` en vez de `upsert`.
  Abrir Finanzas hacía 5 escrituras en la base; ahora hace cero.
- El sembrado pasó a `actions/ops/cost-category-defaults.ts`, detrás de una
  acción explícita de admin que se ofrece desde un empty state en el panel de
  categorías. Una base nueva se resuelve con un click.
- `getOpsCostSettings` devuelve `null`, nunca `undefined`: React Query rechaza
  `undefined`, y una fila sintética con `updatedAt` móvil cambiaría el `key` de
  `BpsSettingsPanel` en cada refetch, remontando el form y borrando lo tipeado.
  El `upsert` de `updateOpsCostSettings` es legítimo y quedó.

### Navegación por secciones

- Las cinco secciones dejaron de apilarse en un scroll único. Hay un `tablist`
  con roving tabindex en desktop y un `<select>` nativo en mobile, con la sección
  activa en `?seccion=`.
- Activación manual, no automática: las flechas mueven foco y Enter activa. Con
  activación automática cada flecha metería una entrada de historial.
- Los hashes viejos (`#rentabilidad`, `#costes`) se migran al query param en un
  efecto de montaje. El fragmento no llega al servidor y `useSearchParams` no lo
  ve; leerlo durante el render rompería la hidratación.
- `<Suspense>` va en el Server Component. Sin eso `next build` falla.
- El header bajó de seis acciones a dos. Los tres diálogos de alta ya viven en su
  propia sección, y la configuración de costes pasó a un sheet secundario.

### Carga diferida

- `useJobs`, `useEmployees`, `useJobOccurrences` y `useOperationalCostCategories`
  toman un `enabled` posicional al final, calcado del que `useJobProfitability`
  ya tenía. Retrocompatible: ningún otro call site cambió.
- `financeSectionQueries` mapea qué pide cada sección. Las cuatro queries de
  dinero del mes nunca se gatean: alimentan el resumen de cada tab y el PDF, que
  se exporta desde cualquiera.
- Resumen carga categorías y empleadas porque sus accesos rápidos abren esos
  mismos diálogos.

### Dashboard del Resumen

- Nueve tarjetas de igual peso → hero de tres (Cobrado, Egresos, Resultado) a
  todo el ancho, y dos columnas `xl:[minmax(0,1.6fr)_minmax(0,1fr)]`.
- El `minmax(0,...)` no es cosmético: dentro de un track `1fr` por defecto el
  `ResponsiveContainer` de recharts mide cada vez más ancho y nunca encoge.
- El gráfico de tendencia absorbe también la composición (egresos apilados), así
  no hacen falta dos gráficos.
- El desglose de egresos suma los pagos a empleadas como fila sintética, de modo
  que las filas dan exactamente `summary.totalCosts`: reconcilia con el hero por
  construcción, no por coincidencia.
- La paleta `--chart-*` clara eran los defaults de shadcn (Cobrado salía rojo) y
  no compartía matiz con la oscura, afinada a mano en bambú. Se re-afinó la clara
  a los mismos matices para que una serie conserve su identidad al cambiar tema.

### Tendencia de 3 meses (read-only)

- `getFinanceTrend` agrega por `assignedMonth` con cuatro `groupBy` en paralelo.
  Es el único read agregado de `data/`: doce números no deberían costar cientos
  de filas, y las tres tablas ya indexan `[status, assignedMonth]`.
- El rango se arma con `getAssignedMonthRange`, o sea el mismo predicado que ve
  `getFinancialSummary`, y cada bucket se pasa por `getFinancialSummary` en vez
  de re-derivar totales. La aritmética no puede divergir de la tarjeta del mes.
- `bpsEstimatePercent` queda en 0 a propósito: el estimado depende de settings
  que el cliente ya tiene, y calcularlo acá también lo contaría doble.
- Bucketing en UTC con `getFinanceMonthKey`. `getMonthKey` daría el mes anterior
  para `2026-09-01T00:00:00Z` en UTC-3.
- `financeTrendRoot` se invalida desde `invalidateJobScopes`,
  `invalidateEmployeeScopes` y `invalidateCosts`.

### Verificación

- PASS: `check:finance-trend` (nuevo, incluye la reconciliación con
  `getFinancialSummary`, la exclusión de VOIDED, los meses en cero y el bucketing
  UTC), `check:finance`, TypeScript, lint completo, `next build` (37 rutas) y
  `pnpm harness`.
- PASS: smoke autenticado en desktop, claro y oscuro. Los cinco `?seccion=`, los
  hashes legacy migrando, back/forward coherente, teclado (ArrowRight mueve foco
  sin activar, Enter activa, Home salta al primero), ARIA cruzado
  (`aria-controls`/`aria-labelledby`), targets de 44px, sin overflow horizontal,
  y consola sin errores ni warnings de hidratación.
- PASS: recorrida de los cinco tabs con recarga completa. Ninguna sección quedó
  con listas vacías por gating de más.
- PASS: prueba del `minmax(0,...)`. Al angostar el contenedor el gráfico pasa de
  721 a 473px y vuelve a 721. No hay ratchet de ancho.
- `pnpm build` completo no corre mientras haya un `pnpm dev` levantado:
  `prisma generate` no puede renombrar `query_engine-windows.dll.node`. Se usó
  `pnpm exec next build`, que sí pasa.

## Blocked Verification

- NOT RUN: 390x844. `resize_window` no cambia el viewport en este Chrome, el
  mismo bloqueo que ya había registrado la feature 35. Se verificó
  estructuralmente: el tablist es `hidden md:flex`, el selector mobile es un
  `<select>` nativo de 5 opciones dentro de un `label md:hidden`, todos los
  targets miden 44px y no hay overflow horizontal. **Falta mirarlo a ancho real**
  antes de cerrar la 28.
- NOT RUN: prueba de cero escrituras contra la base. El cambio está verificado
  por lectura de código y el panel de BPS muestra el valor real guardado (33),
  pero no se comparó `updatedAt` antes y después de cargar Finanzas tres veces.

## Paused Feature

- Feature 35 - `ops_weekly_schedules` sigue `in_progress`. Su código quedó
  commiteado (`b598c09`) con todos sus checks en verde
  (`check:schedule`, `check:schedule-availability`, `check:schedule-move`,
  `check:schedule-pdf`, TypeScript, lint, `next build`), pero **no se marcó
  `done`**: `docs/verification.md` exige browser smoke para páginas UI y el
  tablero nunca se probó autenticado. Su propia nota además reporta un FK
  `JobOccurrence_updatedById_fkey` por cookie de sesión vieja: hay que cerrar
  sesión y volver a entrar antes de probar arrastre, alta y borrado.
- Feature 26 - `ops_visits_guided_workflow` sigue `pending` sin cambios de
  código.
