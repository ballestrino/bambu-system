# Current Harness Session

Status: in_progress

## Active Feature

- 14 `budget_query_cache`, en la rama `feature/14-budget-query-cache`. Código
  en `0f0ddb4`.
  - `components/budgets/query-keys.ts` (`budgetKeys`, `budgetCategoryKeys`) y
    `components/budgets/hooks/budget-cache.ts` (helpers, como
    `useOpsInvalidation`).
  - Crear, duplicar y guardar: `putBudgetOnTop`, primero solo en la primera
    página sin filtros, y el resto de las listas invalidadas. El bug de
    `queryKey[1].query` ya no existe.
  - Guardar invalida el detalle en vez de pisarlo con un presupuesto sin
    opciones ni categorías (bug que había de antes). Borrar saca el detalle
    por id. Las escrituras de presupuestos invalidan
    `opsQueryKeys.budgetSourcesRoot` (nuevo); las de categorías, sus
    detalles y los presupuestos.
  - PASS: `tsc`, lint, los 28 `check:*` (con `check:budget-cache`, nuevo, y
    su prueba de mutación) y `next build`.
- Smoke con permiso del usuario: pasa, y los datos de prueba se borraron (0
  "Prueba 14" en la base). Encontró que `refetchOnMount: false` dejaba el
  detalle viejo al editar; se arregló en `2c31049`. La verificación está en
  verde y falta el OK para cerrarla y mergearla. Detalle en
  `progress/impl_budget_query_cache.md`.

## Queue

- `feature_list.json` se renumeró el 2026-09-24: las ids 1–10 son contexto
  terminado y la cola va de la 11 a la 20, en orden de prioridad. La tabla de
  equivalencias con los ids viejos está en `progress/history.md`.
- Activa: 14 `budget_query_cache`.
- Para la 15: resend ya está en 6.30.0 desde la 11.

## Last Closed Work

- 2026-09-28: limpieza de pruebas del agente (13), solo datos: 7
  conversaciones borradas. En `main` sin push (solo documentación).
- 2026-09-28: huecos de sueldos (12), pusheada.
- 2026-09-28: parche de dependencias con avisos altos (11), pusheado
  (`origin/main` en `2a464de`). Hay que confirmar que el cron de correo
  sincronice bien con mailparser 3.9.20.
- Fuera de alcance, ya estaba en `main`: error de hidratación del botón
  "Nuevo correo" en `/dashboard/email`.

## Decisiones pendientes del usuario

- Qué hacer con los precios con centavos de los presupuestos guardados antes
  de las reglas de precio del agente.
- Si "Abrir en página" se ofrece también desde el Sheet de crear del agente.
- Un `replaceState` durante una navegación pendiente en la página del agente,
  a confirmar.
- Qué período usa la rentabilidad de Trabajos cuando el control de mes deje de
  ser global (se decide en la 18).
- Cargar en Finanzas → Pagos los sueldos de agosto pagados en septiembre (lo
  hace el usuario). Hasta entonces, septiembre muestra $ 120.354 pendientes.
