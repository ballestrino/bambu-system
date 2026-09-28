# Feature 14 - `budget_query_cache`

Rama `feature/14-budget-query-cache`, desde `main` en `77f8b25`. Commits
`0f0ddb4` (claves y helpers) y `2c31049` (refetch con `refetchOnMount`
apagado).

## Qué cambió

- `components/budgets/query-keys.ts`: `budgetKeys` (`["budgets", "list",
  filters]`, `["budgets", "detail", slug]`) y `budgetCategoryKeys` (`roots`,
  `children`, `detail`), con la forma de `officialBudgetKeys`.
- `components/budgets/hooks/budget-cache.ts`: los helpers, como
  `useOpsInvalidation`:
  - `putBudgetOnTop`: al crear, duplicar o guardar, pone el presupuesto
    primero en la primera página sin filtros (recorta al `limit` y ajusta
    `totalCount`/`totalPages` si es nuevo), lo fusiona en las listas que ya
    lo tenían (conserva las relaciones) y marca todas las listas.
  - `removeBudgetFromLists` (borrado optimista), `removeBudgetDetail` (por
    id, porque el detalle usa el slug como clave), `invalidateBudgetLists` e
    `invalidateBudgetSources` (`opsQueryKeys.budgetSourcesRoot`, nuevo).
  - `invalidateBudgetScopes`, para el agente y los presupuestos oficiales, e
    `invalidateCategoryScopes`.
- Quedan en la fábrica los hooks de presupuestos y de categorías, las
  mutaciones de presupuestos oficiales, las propuestas del agente y el
  guardado desde el agente. En `components/`, `hooks/`, `app/` y `lib/` ya no
  queda ninguna clave escrita a mano.

## Bugs corregidos

- `queryKey[1].query`: la clave era `["budgets", { filters }]`, así que
  siempre daba `undefined`. Crear, editar y duplicar escribían el
  presupuesto en todas las listas, incluidas las búsquedas y los filtros, y
  nunca invalidaban las búsquedas.
- Guardar pisaba el detalle con el presupuesto que devuelve la acción, sin
  opciones ni categorías. Ahora el detalle se vuelve a pedir.
- `providers/ReactQueryProvider.tsx` apaga `refetchOnMount`. Por eso una
  consulta invalidada fuera de pantalla mostraba datos viejos al montarse
  (lo encontró el smoke: al editar, el detalle mantenía el nombre anterior).
  Los detalles de presupuestos y categorías y el selector de Trabajos se
  invalidan con `refetchType: "all"`. Las listas ya piden
  `refetchOnMount: true`.
- Borrar no sacaba el detalle del caché, y las escrituras de presupuestos no
  refrescaban el selector de presupuestos de Trabajos.

## Verificación

- PASS: `tsc`, `pnpm lint`, los 28 `check:*` y `next build` sin avisos.
  `check:budget-cache` es nuevo: usa un `QueryClient` real con los defaults
  de la app. La mutación que vuelve a escribir en todas las listas lo rompe,
  y también la que saca `refetchType: "all"`. Se actualizaron
  `agent-budget-editor-source-checks`, `agent-sheet-source-checks` y
  `check-official-budget-workspace`.
- Smoke con sesión en el Chrome del usuario, en el `next dev` del 3001, con
  datos de prueba aprobados:
  - categoría "Prueba 14 categoría": aparece en la lista sin recargar;
  - presupuesto "Prueba 14 caché" con esa categoría: aparece primero;
  - con las búsquedas "Guaraní" y "Prueba 14" en caché, duplicar: la copia
    va primera. "Guaraní" no la muestra, ni al abrirla ni después del
    refetch (antes del arreglo aparecía), y "Prueba 14" se refresca a 2;
  - editar a "…editado" y "…editado 2": primero en la lista sin refetch, con
    su etiqueta, y el detalle muestra el nombre nuevo y sus 2 opciones sin
    recargar (después del segundo commit);
  - editar la categoría (nombre y color): la etiqueta cambia en las dos
    tarjetas;
  - el selector de presupuesto de un trabajo nuevo muestra los dos, con el
    nombre nuevo (se canceló sin guardar);
  - borrar la copia y el original: salen de la lista al instante y el
    detalle sale del caché. Borrar la categoría.
  - Consola: solo la advertencia conocida de la extensión
    (`cz-shortcut-listen`).
- Limpieza: una consulta de solo lectura confirmó 0 presupuestos, 0
  categorías y 0 opciones "Prueba 14". Hay 206 presupuestos, los mismos que
  antes.

## Fuera de alcance

- `lib/budget-slug.ts` sigue borrando las letras con acento: "Prueba 14
  caché" dio el slug `prueba-14-cach`. Ya estaba anotado en la feature del
  agente.
- Otras consultas de la app también dependen de `refetchOnMount: false`
  (por ejemplo, las de presupuestos oficiales). No se tocaron.
