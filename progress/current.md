# Current Harness Session

Status: in_progress

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
