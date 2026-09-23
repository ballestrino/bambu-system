# Feature 3 - `budget_authorization_contracts`

Rama `feature/3-budget-authorization`, desde `main` en `628efc1`.

## Decisión del usuario

- Los presupuestos y sus categorías son un espacio compartido entre admins.
  Hay 3 admins, y los tres tienen presupuestos (173, 23 y 5). Cualquier admin
  lee, edita, duplica y borra cualquier presupuesto, y `Budget.userId` solo
  guarda quién lo creó. Quedó documentado en `docs/architecture.md`
  ("Budget Model"). Con esto, el criterio 1 ("solo los del usuario") se
  cumple como "solo admins", con el modelo documentado, igual que permite el
  criterio 3.

## Qué estaba mal

- Las acciones de categorías (crear, editar y borrar) no pedían sesión.
- `data/budget.ts`, `data/budgets.ts` y `data/budgetCategory.ts` eran
  `"use server"`, así que cada lectura era un endpoint público:
  - las de categorías no pedían sesión;
  - `getBudgets` y `getBudgetById` alcanzaban con estar logueado.
- `updateBudget` y `duplicateBudget` solo pedían estar logueado. Duplicar
  exigía ser el autor, pero editar y borrar no.
- `deleteBudget` validaba el id con el schema de publicar oficiales.
- `newSlug` no se validaba.
- Había cinco `console.log` de depuración.

## Qué cambió

- `lib/budget-admin.ts`: `getBudgetAdminSession()` devuelve la sesión de
  admin o `{ error }`. Lo usan todas las lecturas y acciones de presupuestos
  y categorías.
- Las lecturas de `data/budget*` son `server-only` y piden la sesión de admin
  antes de consultar. Las de categoría por id y las subcategorías también
  validan el id. Las respuestas mantienen su forma, así que la página de
  editar y el agente no cambian.
- El cliente llega a las lecturas por dos archivos `"use server"`:
  `components/budgets/actions/budget-reads.ts` y
  `components/budgets/categories/actions/budget-category-reads.ts`. Es el
  mismo patrón que `official-budget-reads.ts`.
- Acciones de presupuestos: todas usan la sesión de admin.
  - Crear valida con `BudgetSchema` y chequea el slug directo en la base.
  - Editar valida el id (`BudgetIdSchema`) y la URL (`BudgetSlugSchema`, la
    misma forma que genera `slugifyBudgetName`; los 201 slugs guardados la
    cumplen).
  - Borrar valida con `BudgetIdSchema`.
  - Duplicar valida el id, ya no exige ser el autor, y la copia queda a
    nombre de quien duplica.
  - Los `{ error: "error" }` pasan a mensajes claros.
- Acciones de categorías: sesión de admin, `schemas/budget-category.ts`
  (nombre, descripción, color hex y padre por cuid) y siempre
  `{ category }` o `{ error }`. Los hooks de editar y borrar leen `.category`
  y muestran el mensaje del servidor.
- Agente: se sacó la regla de autor al proponer duplicar
  (`stored-budget-proposals.ts`) y al confirmar
  (`proposal-preconditions.ts`), junto con el `actorId` que quedaba sin uso.
  Se actualizaron `check:agent-proposals`, `docs/agent.md` y
  `docs/agent-plan.md`, que dejaba esto "para la feature 3".
- Sin `console.log`: `create-budget.ts` (dos), `useCreateBudgetForm`,
  `useEditBudgetForm` y `BudgetDropdown`.

## Verificación

- PASS: `check:budget-auth` (nuevo) y 16 de 16 mutaciones detectadas:
  - lectura `"use server"`, sin sesión o sin validar el id;
  - el cliente importando `data/`;
  - la regla de autor de vuelta en duplicar;
  - URL sin validar;
  - base antes de la sesión;
  - `console.log`;
  - `{ category }` suelto;
  - el helper tragando cualquier error;
  - el agente con la regla de autor;
  - regex de slug y color flojas.
- PASS: los 25 `check:*`, `tsc`, ESLint, `.\init.ps1` y `next build`.
- PASS: el manifiesto de Server Actions del build no tiene ninguna acción de
  `data/` ni de `lib/`. Las de presupuestos son las acciones con sesión de
  admin y las lecturas nuevas.
- PASS: smoke con sesión en el Chrome del usuario (Next 16.3.5):
  - lista, búsqueda, detalle, página de editar, categorías y subcategorías;
  - categoría "Prueba feature 3": crear, editar y borrar;
  - presupuesto "Prueba feature 3" con esa categoría: crear, editar (una URL
    con mayúsculas y espacios se rechaza con el mensaje del schema) y
    guardar con la URL nueva;
  - duplicar, y borrar la copia y el original.

  Todas las respuestas fueron 200. Los datos de prueba se borraron.
- NOT RUN: una sesión que no sea admin, porque los 3 usuarios son admins. Lo
  cubren el helper, `check:budget-auth` y el layout privado.
- Consola: solo la advertencia de hidratación de la extensión
  (`cz-shortcut-listen`), que ya estaba.

## Fuera de alcance

- El botón "Generar con IA" de editar presupuesto no hace nada: crear lo
  conecta al Sheet del agente y editar no. Se sacó el `console.log` y quedó
  un comentario.
