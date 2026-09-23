# Review - agent_budget_editor

**Verdict:** APPROVED

La re-revisión de las correcciones (árbol de trabajo sobre `16ff4ae`)
aprueba la feature: está al final, en "Re-revisión (correcciones sobre
16ff4ae)". Lo que sigue hasta esa sección es la primera revisión, sobre
`40c586d`, que había pedido cambios.

Rama `feature/43-agent-budget-editor`. Revisé `01e6226..40c586d`
(`a4311e3` feat y `40c586d` docs) sobre el checkout de
`feature/44-agent-pricing-rules`, HEAD `16ff4ae`, con el árbol limpio. Las
líneas citadas son de HEAD. Para ver la 43 sola usé `git show 40c586d:<ruta>`
y un `git -c core.autocrlf=false archive 40c586d` extraído en el scratchpad,
con los `node_modules` del repo enlazados, donde corrí los checks, `tsc` y los
scripts de reproducción.

Leí `docs/architecture.md`, `docs/conventions.md`, `docs/verification.md`,
`CHECKPOINTS.md`, `AGENTS.md`, `docs/agent-plan.md` (feature 43 y "Ajustes al
implementar la 43"), `docs/agent.md` ("Propuestas" y "Editor de
presupuestos"), la sección 43 de `progress/current.md`,
`progress/impl_agent_budget_editor.md` y la entrada 43 de
`feature_list.json`. Además del diff completo, leí enteros
`actions/agent/confirm-proposal.ts`, `lib/agent/proposal-store.ts`,
`lib/agent/proposal-context.ts`, `lib/agent/turn.ts`, `lib/agent/run.ts`,
`lib/agent/grounding.ts`, `CreateBudgetForm.tsx`, `BudgetDetails.tsx` y
`actions/budgets/create-budget.ts`.

Todos los checks pedidos pasan y no hay violaciones de arquitectura. Pido
cambios por tres bloqueantes, los tres reproducidos con scripts puros: con un
aporte en 0 % se guardan precios distintos de los que mostró el editor; un
borrador se muestra como guardado sobre una propuesta ya confirmada; y
después de guardar una propuesta editada, el modelo lee como confirmado el
resumen anterior, con sus precios.

## Findings

### Bloqueante

1. **Un aporte habilitado en 0 % (o vacío) se guarda con el porcentaje por defecto: lo guardado no es lo que mostró el editor.**
   - **Qué pasa.** En el editor, el porcentaje de un aporte se puede poner en
     0 o dejar vacío con el switch prendido
     (`components/budgets/create-budget/CreateBudgetForm.tsx:374,408,442`).
     El detalle y el pie lo calculan como 0 %
     (`lib/budget-calculations.ts:129-130`). Guardar pasa por
     `buildCreateBudgetProposal` (`actions/agent/save-budget.ts:40-45`), que
     aplica `applyBudgetChanges` con la regla de los cambios del modelo: un
     aporte habilitado con 0 % toma el porcentaje por defecto
     (`lib/agent/budget-calculation.ts:163-165`). `createBudget` guarda ese
     payload. El generador, con los mismos valores, guarda 0
     (`actions/budgets/create-budget.ts:87,108`): guarda lo que muestra.
   - **Cómo lo reproduje** (`review-43/contrib-zero.ts`, puro). Recorre el
     mismo camino que guardar: `agentBudgetEditorSchema`,
     `agentSaveBudgetSchema`, `buildCreateBudgetProposal` con la fuente que
     usa `save-budget.ts` y la aritmética de `createBudget`. Parte de la
     tarjeta de un cálculo nuevo.
     - En `40c586d`, con Aguinaldo en 0 %: el editor muestra $ 7.971,45 sin
       productos y $ 8.893,77 con productos. Se guardaría $ 8.873,62 y
       $ 9.795,94, con 13,415 %. Con Patronales en 0 % pasa lo mismo:
       $ 8.024,58 contra $ 8.873,62.
     - En HEAD, con Aguinaldo en 0 %: el editor muestra $ 8.000,54 y se
       guardaría $ 8.906,00. Con 3 horas y el Aguinaldo vacío, el editor
       muestra $ 6.100,12 y se guardaría $ 6.832,00, y además el margen pasa
       de 45,53 % a 46,66 %.
     - Los controles (3 horas, o el aporte apagado con el switch) dan lo
       mismo que el editor, tanto en `40c586d` como en HEAD.
   - **Impacto de la 44.** Lo agrava. Con la fuente `edited`, el cambio de
     porcentaje aparece en `changedFields`, así que `shouldRoundPrice` redondea
     (`lib/agent/agent-pricing.ts:59-62,72-74`). En HEAD hasta Personales en
     0 % cambia el precio: con 3 horas, el editor muestra $ 6.779,21 y se
     guardaría $ 6.832,00.
   - **Por qué importa.** Guarda en silencio precios distintos de los que el
     usuario vio al guardar (+11 % en el ejemplo). Rompe el criterio 3
     ("creates the budget with the edited values") y el contrato del editor.
     Se llega sin buscarlo: basta con borrar el porcentaje o poner 0 para
     sacar un aporte.
   - **Arreglo mínimo.** Normalizar los valores del editor antes de armar la
     propuesta: un aporte habilitado sin porcentaje mayor que 0 pasa a
     deshabilitado, que es como lo guarda y lo relee el generador. La otra
     opción es no aplicar la regla del modelo con la fuente `edited`. Con
     cualquiera de las dos, `changedFields` queda vacío y la 44 no redondea.
     Sumar a
     `check:agent-budget-editor` la aserción de que
     `runBudgetCalculation(payload.values)` coincide con los totales del
     editor, con cada aporte en 0 y vacío.

2. **Un borrador se aplica sobre una propuesta ya guardada: "Ver detalle" muestra como guardado lo que no se guardó.**
   - **Qué pasa.**
     - `openBudget` usa el borrador de la llamada a tool siempre que exista,
       aunque la propuesta esté CONFIRMED o EXECUTING
       (`components/agent/budget-editor/use-budget-editor.ts:33-36`).
       `AgentBudgetActions` le pasa los `values` guardados, pero el borrador
       los pisa (`components/agent/cards/agent-budget-actions.tsx:20-23`).
     - El borrador solo se borra al guardar desde el editor
       (`agent-budget-sheet.tsx:79`).
     - En la tarjeta de la propuesta, "Confirmar" sigue habilitado con un
       borrador (`agent-proposal-card.tsx:55,99`). Confirma los valores del
       agente, sin los cambios.
     - La vista de solo lectura dibuja el formulario, no lo guardado
       (`agent-budget-sheet.tsx:63-69,110,125`, `agent-budget-detail.tsx:14`).
   - **Cómo lo reproduje** (`review-43/draft-state.ts`, parte B). Corrí el
     `useBudgetEditor` real con un dispatcher de hooks mínimo:
     1. En una propuesta de crear con 1 empleada, Editar y pasar a 2.
     2. Cerrar: la tarjeta dice "Tenés cambios sin guardar.".
     3. "Confirmar" en la tarjeta: se guarda 1 empleada, $ 8.873,62.
     4. "Ver detalle" abre el editor de solo lectura, con "guardado en el
        generador" y los links, pero muestra 2 empleadas y $ 17.349,84.
   - **Por qué importa.** El usuario cree guardados sus cambios, que se
     perdieron sin aviso. Además, el Sheet del presupuesto guardado muestra
     precios que no son los guardados. Rompe el criterio 5 ("the sheet show[s]
     the saved budget"). Pasa lo mismo si la propuesta se guarda desde otra
     pestaña o pasa a EXECUTING o CONFIRMED con el editor abierto.
   - **Arreglo mínimo.**
     - No aplicar el borrador si la propuesta está bloqueada, y borrarlo.
     - Con la propuesta bloqueada, dibujar el detalle con `proposal.values`.
     - En la tarjeta de la propuesta, con un borrador, avisar que "Confirmar"
       usa los valores del agente y que los cambios se guardan desde el
       editor (o deshabilitarlo).
     - Sumar la aserción al check. La lógica está en el hook y se puede
       probar como hice yo.

3. **Después de guardar una propuesta editada, el modelo lee el resumen anterior como confirmado, y puede citar esos precios.**
   - **Qué pasa.** `reviseAgentProposal` reescribe el `payload` y el
     `summary` de la fila (`lib/agent/proposal-store.ts:99-109`). La salida
     guardada de la tool conserva el `summary` original, y
     `withLiveProposals` le parcha solo `status`, `result` y `error`
     (`lib/agent/proposal-context.ts:14,73`). En el turno siguiente, el
     modelo recibe "CONFIRMED" junto con los insumos y totales anteriores. La
     evidencia de precios sale del `grounding` de esa misma salida
     (`lib/agent/turn.ts:79-80`, `lib/agent/grounding.ts:44-47`): el precio
     viejo se puede citar y el guardado no. La línea del bloque solo dice
     "Crear “X”: confirmada. Quedó en …"
     (`lib/agent/proposal-context.ts:39-49`).
   - **Cómo lo reproduje.**
     - `review-43/model-view.ts` corre `serializeProposal`,
       `withLiveProposals`, `collectGroundingFromMessages` y el
       `convertToModelMessages` del SDK con `toModelOutput`, como `run.ts`. En
       HEAD, la tool muestra "CONFIRMED · 1 empleada · $ 8.906,00" y lo
       guardado tiene 2 empleadas y $ 17.413,16. $ 8.906,00 se puede citar en
       `draftEmail` y $ 17.413,16 no. En `40c586d` da lo mismo, con
       $ 8.873,62 contra $ 17.349,84.
     - Consulté la base, solo lectura, sobre los datos del smoke. En "Prueba
       agente 43 propuesta", la salida guardada dice 1 empleada, $ 17.349,84 y
       $ 18.272,16; la propuesta y el presupuesto guardado tienen 2 empleadas,
       $ 34.302,30 y $ 35.224,62.
   - **Por qué importa.** El agente puede decir que el presupuesto guardado
     cuesta lo que calculó antes de la edición. Si le piden el mail, puede
     redactarlo con ese precio, y `draftEmail` lo acepta. Es la misma trampa
     que resolvió la 40: el modelo le creyó a la salida de la tool antes que
     al bloque (`docs/agent.md:146-149`). El criterio 4 pide que el agente lo
     vea en los turnos siguientes, y hoy lo ve con datos equivocados.
   - **Arreglo mínimo.**
     - En `withLiveProposals`, parchar también `summary` y
       `grounding: { amounts: getSummaryAmounts(live.summary) }` con la fila
       viva.
     - Para una CREATE_BUDGET confirmada, poner en la línea del bloque los
       finales guardados y sumarlos a la evidencia. Esto cubre también el
       cálculo guardado desde el editor: su salida (4 h, $ 17.349,84 en el
       smoke) no dice nada de lo guardado (3 h, $ 13.111,73), aunque en ese
       caso no hay una contradicción directa.
     - Aserción en el check.

### Menores (no bloqueantes)

4. **Deshacer una edición deja un borrador viejo.** El borrador se anota solo
   si `isDirty` (`agent-budget-sheet.tsx:54-58`). Si un campo vuelve a su
   valor inicial, `isDirty` pasa a false y queda el último borrador. Lo
   reproduje con el form control real de react-hook-form 7.70
   (`review-43/draft-state.ts`, parte A):
   - Escribir un nombre y borrarlo deja el nombre en el borrador.
   - Agregar una categoría y sacarla deja la categoría.

   Al reabrir vuelven, la tarjeta dice "Tenés cambios sin guardar." y
   guardar los incluye. Los campos que cambian el precio no se ven afectados,
   porque el precio sincronizado se actualiza un render después. El arreglo
   no puede ser solo "borrar si no está sucio": después de reabrir,
   `isDirty` se mide contra el borrador. Conviene anotar en cada cambio y
   comparar contra los valores de la tarjeta. El check fija la regla actual
   (`scripts/agent-budget-editor-source-checks.ts:56`).
5. **Guardar mientras el agente responde falla con un mensaje equivocado.**
   La respuesta se guarda en `onEnd` (`app/api/agent/chat/route.ts:79-88`) y
   `findSavableBudgetCall` solo lee mensajes guardados
   (`data/agent/tool-calls.ts:16-23`). La tarjeta aparece a mitad del turno:
   guardar desde el editor antes de que termine responde "Ese presupuesto ya
   no está en la conversación." (`actions/agent/save-budget.ts:36`). En
   cambio, "Confirmar" en la tarjeta de la propuesta sí funciona. Conviene
   deshabilitar Guardar mientras responde, o dar un mensaje que diga eso.
6. **La tarjeta del cálculo y el editor no muestran el resultado
   desconocido.** Una EXECUTING vieja (`unknownOutcome`) se muestra como
   "Guardando en el generador…" (`agent-budget-actions.tsx:35`) y el editor
   queda "guardándose", con el botón girando, para siempre
   (`agent-budget-sheet.tsx:63-69`). La tarjeta de propuesta de la 41 ya la
   muestra como "Resultado desconocido".
7. **Algunos mensajes de validación salen en inglés.** El editor solo
   traduce nombre, visitas, empleadas e IVA
   (`schemas/agent-proposals.ts:61-66`). Con un valor negativo en horas, hora
   nominal, transporte, productos o un aporte, el campo muestra "Too small:
   expected number to be >=0" (`review-43/editor-messages.ts`). El criterio 3
   pide mensajes en castellano, y `docs/agent.md:267` lo afirma.
8. **El check nuevo depende de los saltos de línea.** Hay cuatro regex con
   `\n` literal (`scripts/agent-budget-editor-source-checks.ts:12,18,44,83`).
   El repo tiene `core.autocrlf=true` y no tiene `.gitattributes`, así que un
   checkout nuevo deja CRLF. Sobre un `git archive` con esa configuración,
   `check:agent-budget-editor` falla en `40c586d` y en `16ff4ae`, aunque el
   código está bien. Los checks de 38-42 pasan. Basta con normalizar
   `read()` o usar `\r?\n`.
9. **`findSavableBudgetCall` lee toda la conversación.** Trae las `parts` de
   todos los mensajes del asistente en cada guardado
   (`data/agent/tool-calls.ts:16-23`), sin límite. Además es el único lector
   de `data/agent/` sin guard propio: confía en el `userId` que le pasa la
   acción. Hoy es seguro, porque la única llamada es posterior a
   `requireAdminSession()`, pero se aparta del patrón del resto.
10. **Detalles.**
    - En el camino idempotente (P2002), `values` sale de `built` y no de la
      fila guardada (`lib/agent/tools/proposals.ts:58`). Contradice el arreglo
      3 de la 40. La UI usa los `values` vivos cuando los tiene.
    - La sección "Verificación" de `docs/agent.md` (línea 462) no lista
      `check:agent-budget-editor`.
    - `use-budget-editor.ts` es un hook fuera de `components/agent/hooks/`
      (`docs/conventions.md:33`).

### Verificado sin hallazgos

- **Guard y pertenencia.**
  - `saveAgentBudget` llama a `requireAdminSession()` antes que nada y valida
    con zod.
  - `findSavableBudgetCall` filtra por `conversation: { userId }`, rol
    ASSISTANT, tipo de parte guardable, `output-available` y `ok`. Con la
    conversación de otro, con propuestas de guardar, duplicar o publicar, o
    con una tool fallida, responde "ya no está".
  - `reviseAgentProposal` exige el mismo `actorId` y `kind`, y
    `confirmAgentProposal` filtra por `actorId`.
  - Las partes de tool solo las escribe el servidor: el mensaje del usuario
    solo acepta texto. Las categorías no tienen dueño.
- **Una sola escritura.** El único `(conversationId, toolCallId)`, el P2002,
  el update condicional sobre estados revisables y el claim de confirmar
  alcanzan. Lo verifiqué leyendo el código, sin escribir en la base; el claim
  es el mismo que la 40 probó con dos confirmaciones en paralelo:
  - Con doble click o dos pestañas, con valores iguales o distintos, hay un
    solo `createBudget`. Gana el último payload antes del claim y el otro
    pedido devuelve "se está ejecutando" o el estado guardado.
  - Guardar dos veces una ya confirmada no escribe.
- **Estados.**
  - CONFIRMED y EXECUTING no se tocan.
  - PENDING, REJECTED, EXPIRED y FAILED vuelven a PENDING, con TTL nuevo,
    `error` y `resolvedAt` limpios y `proposal.revise`, que guarda el estado
    anterior.
  - Una descartada al regenerar ya no tiene la llamada, así que da error.
  - La auditoría real del smoke es `create`, `revise(PENDING)` y `confirm`
    para la propuesta, y `create` y `confirm` para el cálculo.
- **Nombre.**
  - Vacío: el esquema del cliente, en castellano, en el campo.
  - Inválido: `invalid_name`, en el campo.
  - Tomado: la verificación previa, en el campo.
  - Si otro lo toma en carrera, falla con el mensaje de `createBudget`, fuera
    del campo, y se puede reintentar.
- **Lo guardado coincide con el editor en el caso normal.** Con 3 horas, en
  `40c586d` y en HEAD, el detalle, el pie y lo guardado coinciden al centavo.
  El IVA es mayor que 0 en los dos schemas. La opción con productos se crea
  solo con productos, y las categorías y la descripción pasan tal cual. En la
  base, los dos presupuestos del smoke tienen los valores editados (3 h y 2
  empleadas) con los precios de la tarjeta.
- **`values` no llega al modelo.**
  - Con el registro real (`createAgentTools`) y el `convertToModelMessages`
    del SDK con las opciones de `run.ts`, queda oculto en las tres tools
    (`review-43/real-tools-model-view.ts`).
  - Dentro del turno, el SDK 7.0.105 arma el resultado con `toModelOutput`.
  - El bloque del prompt y `withLiveProposals` no lo agregan, y la evidencia
    lee solo `data.grounding`.
  - Regenerar usa el mismo camino.
- **El editor encima del Sheet de Presupuestos.**
  - Tiene su propio `FormProvider`, que tapa el del generador.
  - Los diálogos Radix anidados funcionan y el foco vuelve con
    `onCloseAutoFocus`.
  - Los botones de `CreateBudgetForm` son `type="button"` o disparadores de
    Radix.
  - En crear, el Sheet está en el `Header`, fuera del `<form>` de la página,
    así que un submit no burbujea por el portal.
- **Impacto de la 44 sobre la 43.**
  - Pasar a `edited` era necesario. Con `defaults`, la 44 estimaría
    transporte y productos y redondearía, pisando lo editado. En el caso
    normal lo guardado sigue siendo lo editado, como probó el control, pero
    agrava el bloqueante 1.
  - El cambio en `agent-budget-totals-card.tsx` es solo la nota del
    redondeo, y el del check es el cambio de nombre de la fuente.
- **Arquitectura.**
  - La acción está en `actions/` con guard, la lectura en `data/` y los zod
    en `schemas/`.
  - Los helpers puros están en `lib/` (`budget-draft`,
    `proposal-preconditions` reexportado sin cambiar imports) y la escritura
    de `AgentProposal` en `proposal-store`, como aceptó la 40.
  - El wrapper en `components/agent/actions/` lanza errores tipados.
  - Todos los archivos tienen 200 líneas o menos (el más largo,
    `lib/agent/proposals.ts`, 187).
  - Solo se agregan un `console.error` en el catch y el mensaje de éxito del
    check.

### Fuera de alcance

- De la 44: la tarjeta redondea a pesos la "Hora sin IVA", pero el detalle
  usa el componente de la página, que la muestra con centavos. Además,
  `check:agent-pricing` tiene la misma fragilidad CRLF
  (`scripts/agent-pricing-source-checks.ts:14`).
- Previo: `BudgetSchema` tiene mensajes en inglés también en el generador, y
  `slugifyBudgetName` descarta las letras acentuadas: "Prueba agente 43
  cálculo" quedó en `/prueba-agente-43-clculo`.

## Checkpoints

- **C1: [x]** Existen los archivos del harness y `.\init.ps1` sale con 0.
- **C2: [x]** Hay una sola `in_progress` (la 35). La 43 sigue `pending` a
  propósito y `progress/current.md` la describe con su estado real.
- **C3: [x]** Los límites de `actions/`, `data/`, `schemas/`, `lib/` y los
  componentes se respetan, y el guard va primero. Quedan dos detalles
  menores: el lector sin guard propio (9) y la ubicación del hook (10).
- **C4: [x]** Pasan el harness, lint, `prisma validate`, `tsc`, los checks y
  el `next build` del líder, y el implementador registró el smoke de UI. El
  check nuevo no cubre los tres bloqueantes y depende de los saltos de línea
  (8).
- **C5: [x]** El árbol está limpio: mis scripts están fuera del repo. No se
  agregan `console.log`, `debugger` ni TODO.

## Evidence

- `.\init.ps1` (PowerShell): **pass**, exit 0 en 24 s. Harness con 44
  features y una `in_progress`, `prisma validate` y ESLint.
- `pnpm exec tsc --noEmit --incremental false`: **pass**, exit 0 en 16 s.
- En HEAD `16ff4ae`, todos **pass**:
  - `pnpm check:agent-budget-editor` ("Agent budget editor checks passed").
  - `pnpm check:agent-proposals`.
  - `pnpm check:agent-sheet`.
  - `pnpm check:agent-page`.
  - `pnpm check:agent-tools`.
  - `pnpm check:official-budgets`.
  - `pnpm check:mail-agent`.
- La 43 sola, sobre el `git archive` LF de `40c586d`: **pass**. Pasan los
  siete checks y `tsc` (13 s).
- Los mismos checks sobre un `git archive` con `core.autocrlf=true`:
  **fail** `check:agent-budget-editor` en `40c586d` y en `16ff4ae`
  (`/grounding,\n\s+values,\n/`), y **fail** `check:agent-pricing`. Pasan
  `check:ai-gateway`, `check:agent-tools`, `check:agent-proposals`,
  `check:agent-sheet`, `check:agent-page`, `check:official-budgets` y
  `check:mail-agent` (hallazgo 8).
- `pnpm exec next build` (lo corrió el líder sobre `16ff4ae`, y cubre 41-44):
  **pass**, exit 0 en 39 s. Compiló en 11,1 s, pasó TypeScript, generó 29
  páginas estáticas y listó 38 rutas, entre ellas `ƒ /api/agent/chat` y
  `ƒ /dashboard/agent`. El log está en `scratchpad/next-build-16ff4ae.log`.
- Scripts del revisor en `scratchpad/review-43/`, sin base ni modelo salvo
  la lectura de abajo:
  - `contrib-zero.ts`: **falla**, lo guardado es distinto (hallazgo 1). Los
    controles coinciden.
  - `draft-state.ts`: **falla** (hallazgos 2 y 4).
  - `model-view.ts`: **falla** (hallazgo 3).
  - `real-tools-model-view.ts`: **pass**, `values` queda oculto en las tres
    tools.
  - `editor-messages.ts`: seis campos dan el mensaje de zod en inglés
    (hallazgo 7). El margen no llega a negativo desde la UI.
- Consulta de solo lectura a la base del `.env` (`findMany`, sin escrituras,
  sin imprimir secretos): leí 14 propuestas CREATE_BUDGET. Las 2
  del smoke confirman el hallazgo 3 y la auditoría. Los 2 presupuestos de
  prueba tienen los valores editados.

## Criterios de aceptación

1. **"Ver detalle" y "Editar" en las tarjetas de cálculo y de propuesta de
   crear, con un Sheet encima del chat y del Sheet de Presupuestos: cumplido.**
   Lo verifiqué leyendo el código y está en el smoke del implementador.
2. **El detalle sin y con productos de la página, recalculado en vivo:
   cumplido.** Usa `BudgetDetails` con `useWatch`. En el smoke, con 3 h, los
   finales coinciden con `runBudgetCalculation`.
3. **Guardar valida en castellano, informa la dirección tomada en el nombre y
   crea el presupuesto con lo editado: no cumplido.** Un aporte en 0 o vacío
   se guarda con el porcentaje por defecto (hallazgo 1), y hay mensajes en
   inglés para valores negativos (hallazgo 7). Nombre vacío, inválido y
   tomado funcionan.
4. **Una propuesta CREATE_BUDGET de la llamada, confirmada en la misma
   acción, idempotente, auditada y visible para el agente: cumplido, con
   observaciones.**
   - Hay una sola escritura.
   - Queda auditado: `create`, `revise` y `confirm` están en la base.
   - Aparece en el bloque.
   - Pero el modelo ve el resumen previo a la edición como confirmado
     (hallazgo 3).
5. **Después de guardar, la tarjeta y el Sheet muestran lo guardado con sus
   links, y lo guardado o en curso es de solo lectura: no cumplido.** Un
   borrador se muestra sobre una propuesta confirmada (hallazgo 2), y una
   EXECUTING vieja queda "guardándose" (hallazgo 6). El camino normal
   funciona.
6. **Las tres tools devuelven `values`, el modelo no los recibe y las salidas
   viejas se arman con los insumos: cumplido.** Lo probé con el registro real
   y el SDK. Lo de las salidas viejas lo cubre el check.
7. **Los cambios sin guardar sobreviven a cerrar y reabrir, y la tarjeta
   avisa: cumplido, con observaciones.** Un cambio deshecho vuelve
   (hallazgo 4), y el borrador se aplica sobre una propuesta guardada
   (hallazgo 2).
8. **Checks, TypeScript, lint, build y smoke autenticado en escritorio y en
   390x844: cumplido.** Los re-corrí, el build lo corrió el líder y el smoke
   está en el `impl`. Con la salvedad CRLF del hallazgo 8.

## Evidencia de la prueba autenticada del implementador

- **Alcanza para:**
  - detalle igual a la tarjeta y edición en vivo;
  - borrador al cerrar y reabrir;
  - nombre vacío y nombre tomado;
  - guardar un cálculo y una propuesta editada, con valores y precios que
    coinciden con la base;
  - el agente abre por nombre el cálculo guardado;
  - el editor encima del Sheet, recarga, 390x844, claro y oscuro.
- **Falta, sin OpenAI salvo el último punto:**
  - un aporte en 0 o vacío;
  - "Confirmar" en la tarjeta con un borrador y después "Ver detalle";
  - deshacer una edición y reabrir;
  - guardar mientras responde;
  - dos guardados en paralelo y una FAILED revisada, que ya estaban anotados
    como NOT RUN;
  - un turno siguiente a guardar una propuesta editada, en el que el agente
    tiene que citar el precio guardado.

## Para aprobar

- **Obligatorio:** los hallazgos 1, 2 y 3, cada uno con su aserción en
  `check:agent-budget-editor`.
  1. Normalizar los aportes habilitados sin porcentaje, o no aplicar la
     regla del modelo con la fuente `edited`.
  2. No aplicar el borrador sobre una propuesta bloqueada, dibujar lo
     guardado con `proposal.values` y avisar en "Confirmar" si hay un
     borrador.
  3. Parchar `summary` y `grounding` en `withLiveProposals`, y poner los
     finales guardados de una CREATE_BUDGET confirmada en el bloque.
- **Recomendado en la misma pasada, porque son chicos:** 4, 6 y 8, y el 5
  (deshabilitar Guardar mientras responde).
- **Smoke a sumar:** un aporte vacío, "Confirmar" con un borrador y después
  "Ver detalle", y el turno siguiente a guardar una propuesta editada.

## Re-revisión (correcciones sobre 16ff4ae)

**Veredicto: APPROVED.**

Revisé las correcciones sin commitear de la rama
`feature/44-agent-pricing-rules` (HEAD `16ff4ae`) en lo que toca a la 43,
contra la sección "Correcciones de la revisión (2026-09-22)" de
`progress/impl_agent_budget_editor.md` y la sección 43 de
`progress/current.md`. Leí el diff de `lib/agent/agent-pricing.ts`,
`lib/agent/budget-draft.ts`, `lib/agent/proposal-context.ts`,
`lib/agent/turn.ts`, `lib/agent/tools/proposals.ts`,
`schemas/agent-proposals.ts`, `data/agent/tool-calls.ts`, el editor
(`agent-budget-sheet.tsx`, `agent-budget-footer.tsx`,
`components/agent/hooks/use-budget-editor.ts`), las tarjetas
(`agent-budget-actions.tsx`, `agent-proposal-card.tsx`) y los checks. Volví
a correr sin cambios dos scripts de la primera revisión y escribí uno nuevo
para los borradores, porque cambió la API del hook.

Los tres bloqueantes quedaron resueltos y cada uno tiene aserciones que
fallan si se revierte el arreglo. Los menores 4 a 8 y 10 también quedaron
resueltos. Del 9 queda la lectura sin límite, que está anotada. Lo nuevo que
encontré es menor.

### Qué quedó resuelto

1. **Aporte en 0 % o vacío (bloqueante): resuelto.**
   - Con la fuente `edited`, `applyAgentChanges` sale antes por `asEdited`
     (`lib/agent/agent-pricing.ts:76-80,88`). No pasa por
     `applyBudgetChanges`: no hay estimados, redondeo ni porcentaje por
     defecto. Solo recalcula `price` con la misma cuenta que el "Sync Price"
     de `CreateBudgetForm.tsx`. `changedFields` queda vacío y `rounding` en
     `null`.
   - Solo `actions/agent/save-budget.ts` usa `edited`. Las tools del modelo
     nunca lo pasan (lo busqué con grep).
   - Corrí `contrib-zero.ts`, de la primera revisión, sin cambios. Los siete
     casos dan **SAME**: Aguinaldo, Patronales y Personales en 0 %,
     Aguinaldo vacío con 3 horas, Personales en 0 con 3 horas y los dos
     controles. Por ejemplo, con Aguinaldo en 0 % el editor muestra
     $ 8.000,54 y $ 9.220,54, se guarda lo mismo e
     `incidence_contribution` queda en 0. Antes se guardaba $ 8.906,00.
   - La aserción recorre los tres aportes en 0 y vacíos. Compara
     `runBudgetCalculation` del payload con el de lo editado y revisa
     `summary.after` y que no haya avisos
     (`scripts/check-agent-budget-editor.ts:98-107`).
2. **Borrador sobre lo guardado (bloqueante): resuelto.**
   - `resolveEditorValues` (`lib/agent/budget-draft.ts:28-35`) abre una
     propuesta CONFIRMED o EXECUTING con `proposal.values`. Si no está
     bloqueada, abre con el borrador o con los valores de la tarjeta. El
     editor lo usa como `defaultValues` (`agent-budget-sheet.tsx:57`).
   - Con la propuesta bloqueada no se anota el borrador
     (`agent-budget-sheet.tsx:67`). Si pasa a CONFIRMED con el editor
     abierto, `form.reset(saved)` y `dropDraft` (`:76-83`). La query de
     propuestas usa el structural sharing de TanStack Query, así que
     `proposal.values` conserva la referencia en un refetch igual y el reset
     corre solo cuando cambia.
   - En una propuesta PENDING con borrador, la tarjeta avisa con tono de
     advertencia que Confirmar la guarda sin esos cambios
     (`agent-budget-actions.tsx:23,49-54`).
   - `draft-state-v2.ts` (nuevo) usa el `useBudgetEditor` real, el
     `createFormControl` de react-hook-form 7.70 y el mismo resolver:
     1. En una propuesta, pasar a 2 empleadas y cerrar deja el borrador.
     2. "Confirmar" guarda 1 empleada.
     3. "Ver detalle" abre con 1 empleada y $ 8.873,62, igual a lo guardado.
     4. El borrador se descarta.
     5. Una EXECUTING abre con los valores de la propuesta.
3. **El modelo leía el resumen de antes de editar (bloqueante): resuelto.**
   - `withLiveProposals` parcha también `summary` y `grounding` con la fila
     viva (`lib/agent/proposal-context.ts:93-100`).
   - La línea del bloque de una confirmada lleva los finales guardados
     (`describeSaved`, `:22-26,57`).
   - `prepareAgentTurn` suma a la evidencia los importes de `summary.after`
     de las confirmadas (`getConfirmedAmounts`, `:65-68`, y
     `lib/agent/turn.ts:81`). Eso cubre el cálculo guardado desde el editor,
     que no tiene salida `propose*`.
   - Corrí `model-view.ts`, de la primera revisión, sin cambios:
     - La tool que ve el modelo dice CONFIRMED, 2 empleadas y $ 17.413,16,
       sin `values`.
     - El bloque dice "Quedó en …, con $ 17.413,16 sin productos y
       $ 18.633,16 con productos (finales con IVA)."
     - $ 8.906,00, el precio de antes de editar, ya no se puede citar, y
       $ 17.413,16 sí.
4. **Deshacer una edición (menor): resuelto.**
   - El borrador se anota en cada cambio y se borra si vuelve a los valores
     de la tarjeta (`isSameBudgetDraft`). La comparación ignora el precio y
     el orden de las categorías, y trata "4" y 4 como iguales.
   - En `draft-state-v2.ts`, escribir y borrar un nombre, una categoría o
     una descripción no deja borrador, y tampoco pasar las horas de 4 a 3 y
     volver a 4.
   - Una edición real queda y reabrir la recupera. Volver al valor de la
     tarjeta después de reabrir la borra: es el caso en que `isDirty` se
     mediría contra el borrador.
5. **Guardar mientras responde: resuelto.** `waiting={view.busy}`
   (`agent-chat.tsx:106`) deshabilita Guardar y explica por qué
   (`agent-budget-footer.tsx:100-105`).
6. **Resultado desconocido: resuelto.** La tarjeta del cálculo y el editor
   lo muestran (`editorStatus`, `agent-budget-sheet.tsx:35-39`), y el pie no
   tiene botón.
7. **Mensajes en inglés: resuelto.**
   - `agentBudgetEditorErrors` va como `schemaOptions` del resolver.
     Verifiqué en `@hookform/resolvers` 5.2.2 que lo pasa a
     `parseAsync(schema, values, options)` de `zod/v4/core`.
   - Los mensajes propios del schema ganan: el check lo fija con empleadas
     en 0.
   - Todos los `too_small` que quedan en `BudgetSchema` son `.min(0)`, así
     que "No puede ser negativo." siempre es correcto.
8. **CRLF: resuelto.** Pasé una copia del árbol de trabajo a CRLF y los
   nueve checks pasan. Sin la normalización de `read()`,
   `check:agent-budget-editor` falla sobre esa copia.
9. **Guard del lector: resuelto en parte.** `findSavableBudgetCall` llama a
   `requireAdminSession()` (`data/agent/tool-calls.ts:17`). La lectura de
   todas las partes sigue sin límite, anotada en el `impl`.
10. **Detalles: resueltos.**
    - `values` sale de la fila (`readCreateValues`,
      `lib/agent/tools/proposals.ts:52`).
    - `docs/agent.md` lista el check.
    - El hook está en `components/agent/hooks/`.

### Nuevo (no bloquea)

- **A. Texto del resultado desconocido.** La tarjeta del cálculo y el pie
  del editor dicen "antes de volver a guardarlo"
  (`agent-budget-actions.tsx:42`, `agent-budget-footer.tsx:61-62`). Pero una
  EXECUTING no se puede revisar (`REVISABLE_PROPOSAL_STATUSES`,
  `lib/agent/budget-draft.ts:20`) y el pie no tiene Guardar: desde ese
  editor no se puede volver a guardar. La tarjeta de propuesta de la 41 dice
  "antes de pedirla de nuevo". Conviene alinear el texto ("antes de
  pedírselo de nuevo al agente").
- **B. Dos `requireAdminSession()` por guardado**, en la acción y en el
  lector. Es una lectura de sesión de más, aceptable para seguir el patrón
  de los demás lectores de `data/agent/`.

### NOT RUN

- **Smoke en el navegador.** No hay un `pnpm dev` de Bambú: el puerto 3000
  lo ocupa otra app (InnovaStore). Además, el navegador integrado no tiene
  sesión de Bambú, y entrar la contraseña le toca al usuario.
- **Siguen pendientes los tres smokes de la primera revisión:**
  - un aporte vacío guardado;
  - "Confirmar" con un borrador y después "Ver detalle";
  - el turno siguiente a guardar una propuesta editada, con OpenAI.
- Los scripts puros cubren esa lógica. El smoke escribe en la base y gasta
  OpenAI, así que necesita el visto bueno del usuario. Hay que hacerlo antes
  de pasar la 43 a `done`.
- **Actualización (2026-09-22): PASS.** El usuario inició sesión y levantó
  `next dev` en el 3001, y corrí los tres smokes en el navegador integrado,
  con OpenAI en Bajo por US$ 0,005. El detalle está en la sección 43 de
  `progress/current.md`.
  - Aporte vacío: lo guardado es lo del editor, $ 57.148,79 y $ 63.858,79.
  - "Confirmar" con un borrador: la tarjeta avisa, y "Ver detalle" abre lo
    guardado, $ 6.832,00, y no el borrador de $ 13.262,06.
  - Turno siguiente a guardar una propuesta editada: el agente cita
    $ 97.810,00 y $ 104.520,00, no los $ 66.002,00 de antes.

### Checkpoints (re-revisión)

- **C1: [x]** `.\init.ps1` sale con 0.
- **C2: [x]** Hay una sola `in_progress` (la 35) y la 43 sigue `pending` a
  propósito. `progress/current.md` y `feature_list.json` los maneja el líder.
- **C3: [x]** La acción sigue en `actions/`, la lectura en `data/` y el mapa
  de errores en `schemas/`. Los helpers puros están en `lib/` y el hook en
  `components/agent/hooks/`. Todos los archivos tienen 200 líneas o menos;
  el más largo es `agent-budget-sheet.tsx`, con 198.
- **C4: [x]** Pasan el harness, lint, `prisma validate`, `tsc`, los checks y
  `next build`. Falta el smoke de UI de las correcciones (NOT RUN, arriba).
- **C5: [x]** El diff no agrega `console.log`, `debugger` ni TODO, y mis
  scripts están fuera del repo.

### Evidencia (árbol de trabajo sobre `16ff4ae`)

- `.\init.ps1`: **pass**, exit 0. Harness con 44 features y una
  `in_progress`, `prisma validate` y ESLint.
- `pnpm exec tsc --noEmit --incremental false`: **pass**, exit 0.
- **pass** en los nueve: `check:ai-gateway`, `check:agent-tools`,
  `check:agent-proposals`, `check:agent-sheet`, `check:agent-page`,
  `check:agent-budget-editor`, `check:agent-pricing`,
  `check:official-budgets` y `check:mail-agent`.
- Los mismos nueve sobre una copia CRLF del árbol, con los `node_modules`
  del repo enlazados: **pass**.
- `pnpm exec next build`: **pass**, exit 0. Cubre de la 41 a la 44.
- Mutaciones sobre la copia CRLF, sin tocar el repo: **16 de 16
  detectadas**.
  - Bloqueante 1 (dos): sacar la salida por `edited` y volver a los aportes
    por defecto dentro de `asEdited`.
  - Bloqueante 2 (tres): borrador sobre una bloqueada, sin reset al
    guardarse y borrador anotado con la propuesta bloqueada.
  - Bloqueante 3 (cinco): resumen viejo, evidencia vieja, bloque sin los
    finales, importes confirmados fuera de la evidencia y pendientes
    contados como confirmados.
  - Menores (seis): deshacer, Guardar mientras responde, sin mapa de
    errores, mensaje equivocado, sin normalizar CRLF y lector sin guard.
- Scripts del revisor en `scratchpad/rereview-43/`, sin base ni modelo:
  - `contrib-zero.ts`: **pass**, SAME en los siete casos.
  - `model-view.ts`: **pass**. El modelo ve lo guardado y solo puede citar
    ese precio.
  - `draft-state-v2.ts`: **pass**, 11 de 11.
