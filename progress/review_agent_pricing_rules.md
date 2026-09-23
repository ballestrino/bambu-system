# Review - agent_pricing_rules

**Verdict:** APPROVED

Rama `feature/44-agent-pricing-rules`, HEAD `16ff4ae`. Revisé `40c586d..16ff4ae`
(`bfca3b0` feat y `16ff4ae` docs) con el diff completo, contra
`docs/architecture.md`, `docs/conventions.md`, `docs/verification.md`,
`CHECKPOINTS.md`, `AGENTS.md`, `docs/agent-plan.md` (feature 44 y "Ajustes al
implementar la 44"), `docs/agent.md` ("Reglas de precio" y lo que toca la 44),
la sección 44 de `progress/current.md`, `progress/impl_agent_pricing_rules.md`
y la entrada 44 de `feature_list.json`. Leí enteros `lib/budget-calculations.ts`,
`lib/agent/budget-calculation.ts`, `lib/agent/agent-pricing.ts`,
`lib/agent/price-rounding.ts`, `lib/agent/grounding.ts`,
`lib/mail-agent/price-grounding.ts`, `lib/agent/tools/{budgets,calculations,proposals,context,email}.ts`,
`lib/agent/proposal-builders.ts`, `lib/agent/proposal-summary.ts`,
`data/agent/budgets.ts`, el prompt, las habilidades y
`app/api/agent/chat/route.ts`.

Todos los checks pedidos pasan y no hay bloqueantes ni violaciones de
arquitectura. En el rango realista, hasta $ 1.000.000 de costo mensual (el
presupuesto guardado más grande anda por $ 300.000):

- el precio redondeado es múltiplo de $ 100, sube menos de $ 100 y nunca baja;
- lo que se propone y se guarda es lo que calculó `calculateBudget`, al
  centavo;
- la matriz de cuándo se redondea coincide con el contrato, salvo dos bordes
  (hallazgos 1 y 7);
- los importes citables son los de la tarjeta.

Lo probé con más de 1.300.000 cálculos de fuzz y 33 mutaciones, todo en el
scratchpad (ver Evidence). Quedan ocho menores. Conviene arreglar en la misma
pasada los de checks (4) y el borde del editor (7).

## Findings

### Bloqueante

Ninguno.

### Menores (no bloqueantes)

1. **Un cambio solo de productos también redondea el precio del servicio.**
   - **Qué pasa.** `shouldRoundPrice` redondea si `changedFields` trae
     cualquier campo que no sea el IVA (`lib/agent/agent-pricing.ts:62`).
     `products_price` y `products_revenue_percent` no mueven el total del
     servicio sin IVA, pero igual suben el margen. El contrato dice que se
     redondea con "un cambio que mueve el precio sin IVA"
     (`docs/agent.md:309`), y por eso excluye el IVA.
   - **Cómo lo reproduje** (`scenarios.ts`, A, con el fixture de
     `check:agent-proposals`, servicio en $ 7.273,46). "Sacale los
     productos" (`products_price: 0`), "poné margen de productos" (15) y
     "productos $ 1.000" dan los tres `rounding` $ 7.273,46 → $ 7.300,00 y
     margen 45 → 45,529165. La propuesta de guardar lista "Margen del
     servicio" además de lo pedido. Con un oficial ACTIVE, confirmarla
     publica la versión 4 con otro precio de lista para el servicio.
   - **Por qué importa.** Sube hasta $ 99,99 un precio que no se pidió tocar,
     y el código no hace lo que dice el documento. No bloquea: la tarjeta lo
     muestra (aviso y cambio de margen) y el usuario pidió redondear
     "siempre".
   - **Arreglo mínimo.** Tratar los dos campos de productos como el IVA en
     `shouldRoundPrice` (o comparar el neto del servicio antes y después),
     con su aserción. Si se prefiere redondear también ahí, decirlo en
     `docs/agent.md:309`.

2. **En los casos más comunes siguen saliendo precios con centavos (a decidir con el usuario).**
   - **(a) Guardados de antes de la 44.** `NEW_BUDGET_RULE` manda usar el
     precio de uno guardado igual (`lib/agent/system-prompt.ts:31`), y se
     cita tal cual (`docs/agent.md:323-325`). En la base, 171 de los 203
     presupuestos tienen el neto sin productos fuera de centenas, y sus 71
     servicios distintos los cubren a todos. Para un servicio que ya existe,
     lo normal va a ser citar un precio con centavos (el implementador lo
     anotó: $ 14.000,15).
   - **(b) La opción con productos de un guardado que cambia.** El servicio
     se redondea, pero los productos guardados quedan como estaban: 84 de las
     134 opciones con productos no son múltiplo de $ 500 (por ejemplo $ 756)
     y 99 tienen margen de productos. Con el fixture, pasar a 5 horas deja el
     servicio en $ 9.100,00 y la opción con productos en $ 9.856,00, o en
     $ 9.969,40 con margen del 15 % (`fuzz-stored.ts`). `docs/agent.md:326-328`
     documenta solo el caso del margen.
   - **Por qué importa.** Es el primer pedido del usuario ("que no dé precios
     con números raros") y la regla cubre solo los cálculos nuevos. Los
     criterios de aceptación se cumplen, y citar tal cual fue una decisión
     del implementador, no del usuario.
   - **Sugerencia.** Confirmarlo con el usuario. Por ejemplo, que al citar un
     guardado con centavos el agente ofrezca "redondealo"
     (`roundPrice: true`), y que al redondear un guardado los productos
     también vayan al múltiplo de $ 500, o que la tarjeta avise que la opción
     con productos no queda redonda.

3. **`MAX_STEPS` 8 con `maxDuration` 60: el flujo largo de Emails no se midió en Bajo ni en Alto.**
   - **Conteo.** Responder un pedido sin un igual guardado son 6 pasos del
     modelo: buscar el oficial, buscar un igual, calcular, redactar, proponer
     y contestar. Son 5 si las dos búsquedas van en paralelo. Además,
     `draftEmail` hace su propia llamada al modelo
     (`lib/agent/tools/email.ts:32-45`), y otra por cada reintento. Con 8
     pasos (`lib/agent/run.ts:20`) entran dos reintentos, por ejemplo dos
     borradores rechazados. Con un tercero, el último paso es una tool y el
     turno termina sin respuesta.
   - **Tiempos.** Solo hay medidas en Medio: 26 s ese flujo y 32 s el turno
     más largo.
   - **Por qué importa.** La ruta corta a los 60 s
     (`app/api/agent/chat/route.ts:18`). Si Vercel la corta, no corre
     `onEnd`: se pierden la respuesta y el consumo, y puede quedar una
     propuesta PENDING creada en ese turno (`docs/agent.md:81-84`). El plan
     todavía da `isStepCount(6)` como mitigación de este riesgo
     (`docs/agent-plan.md:821-825`), y ya no es así.
   - **Sugerencia.** Antes de desplegar, medir el flujo en Bajo y en Alto o
     cerrar la decisión pendiente de `maxDuration` (Fluid compute, 300 s).
     Actualizar la mitigación en el plan.

4. **Los checks no cubren por comportamiento `findMatchingBudgets`, el aviso de duplicado ni el guard de la búsqueda.**
   - **Qué pasa.** `check:agent-pricing` prueba `sameServiceWarning` y la
     entrada de la tool. El resto lo busca por texto
     (`scripts/agent-pricing-source-checks.ts:30-46`): la consulta de
     `data/`, la cuenta del grounding y la llamada a `withSameServiceWarning`.
   - **Cómo lo reproduje.** Corrí 33 mutaciones sobre una copia del código en
     el scratchpad, sin tocar el repo, con `check:agent-pricing`,
     `agent-tools`, `agent-proposals` y `agent-budget-editor`. Hubo 24
     detectadas, 1 equivalente y 8 sin detectar, todas en estas piezas:
     - borrar `addToolGrounding(ctx.grounding, grounding)` de
       `findMatchingBudgets` (`lib/agent/tools/budgets.ts:91`);
     - `employees: input.employees ?? 2` (`:84`);
     - invertir el filtro de productos (`:85`);
     - sacar el `slice` del límite (`:87`) o fijar `truncated: false`
       (`:96`);
     - vaciar el aviso dentro de `withSameServiceWarning`
       (`lib/agent/tools/proposals.ts:68`) o ignorar los productos (`:67`);
     - borrar `await requireAdminSession()` de `findAgentBudgetsByService`
       (`data/agent/budgets.ts:39`). No lo detecta ninguno de los seis checks
       del agente: el texto se busca desde esa función hasta el final del
       archivo, y `getAgentBudgetState` (`:68`) tiene la misma línea.
   - **Por qué importa.** Hoy el código está bien, pero el criterio 5
     ("citable stored prices") no tiene prueba. Sin el grounding, el precio
     de un igual no se puede citar en el mismo turno y el correo del flujo de
     Emails falla con `price_mismatch`. Además, el guard es una invariante de
     seguridad, aunque la ruta ya exige admin.
   - **Arreglo mínimo.** Pasar a `lib/agent/` las piezas puras y probarlas:
     el criterio que sale de la entrada, las filas con su grounding y la
     decisión del aviso. Como mínimo, sumar esas líneas a las aserciones de
     texto y acotar `finder` al final de la función.

5. **El aviso de mismo servicio cuenta de menos.**
   - **Qué pasa.** `withSameServiceWarning` pasa lo que devuelve
     `findAgentBudgetsByService` (`lib/agent/tools/proposals.ts:67-68`). Esa
     búsqueda trae como mucho 11 (`data/agent/budgets.ts:53`), y
     `sameServiceWarning` cuenta sobre eso
     (`lib/agent/proposal-summary.ts:119-124`).
   - **Cómo lo reproduje** (`scenarios.ts`, C). Con 17 iguales, la tarjeta
     diría "“Oficina 1”, “Oficina 2”, “Oficina 3” y 8 más", cuando son 14
     más. En la base, el servicio más repetido tiene 17 presupuestos y hay 3
     con más de 10.
   - **Arreglo.** Si `matches.length > MATCHING_BUDGETS_LIMIT`, decir "y más"
     sin número, o contarlos aparte.

6. **La regla de precios no nombra `findMatchingBudgets` como fuente.**
   - **Qué pasa.** `PRICE_RULE` (`lib/agent/system-prompt.ts:9`), la regla
     obligatoria, lista las fuentes citables sin `findMatchingBudgets`. En
     cambio, `NEW_BUDGET_RULE` (`:31`) dice "usá su precio" y Emails lo da
     como fuente de `draftEmail` (`lib/agent/skills/emails.ts:12`).
   - **Por qué importa.** En Presupuestos y en General la regla obligatoria
     contradice a las otras dos. Eso puede llevar al modelo a no citar el
     igual o a abrirlo con `getBudget` antes, un paso más con `MAX_STEPS` y
     `maxDuration` justos (hallazgo 3). `draftEmail` lo acepta igual, porque
     el grounding está.
   - **Arreglo.** Sumar "un presupuesto guardado igual (findMatchingBudgets)"
     a la línea 9.

7. **Borde del editor: lo tipeado a mano se redondea si un aporte quedó habilitado en 0 %.**
   - **Qué pasa.** Con la fuente `edited`, `applyBudgetChanges` cambia un
     aporte habilitado en 0 por el porcentaje por defecto
     (`lib/agent/budget-calculation.ts:163-167`). Ese cambio entra en
     `changedFields`, y `shouldRoundPrice` redondea
     (`lib/agent/agent-pricing.ts:62`). El formulario del generador deja
     escribir 0 en un aporte habilitado
     (`components/budgets/create-budget/CreateBudgetForm.tsx:369-374`).
   - **Cómo lo reproduje** (`scenarios.ts`, B, y `edited-preview.ts`). Con el
     fixture y la incidencia habilitada en 0:
     - el editor muestra $ 6.533,98 sin IVA;
     - antes de la 44 se guardaba $ 7.273,46, porque el cambio del 0 ya
       existía;
     - ahora se guardaría $ 7.300,00, con margen 45,529165 en vez del 45
       tipeado y con el aviso del redondeo.
   - **Por qué importa.** En ese borde no se cumple el criterio 2 ("values
     edited by hand … are not rounded") ni `docs/agent.md` ("lo tipeado a
     mano no pasa por las reglas"). Lo dejo como menor porque la raíz, que el
     cambio del 0 toque lo editado, es de la 40 y la 43 (ver "Fuera de
     alcance"), y la 44 solo le suma el redondeo.
   - **Arreglo mínimo.** Que `edited` no redondee salvo con `roundPrice`,
     por ejemplo con un corte en `applyAgentChanges` para
     `base.source === "edited"`, y sumar este caso al check.

8. **Con más de $ 1.000.000 de costo mensual, el precio deja de salir en centenas.**
   - **Qué pasa.** El margen se redondea a 6 decimales
     (`lib/budget-calculations.ts:4-9`), y `applyNicePrice` toma el precio
     que sale con ese margen (`lib/agent/agent-pricing.ts:34-40`).
   - **Cómo lo reproduje** (`big-costs.ts`, 194.580 combinaciones con los
     valores por defecto, y el fuzz).
     - El primer caso que falla tiene un costo de $ 1.014.670: 12 días de
       7,25 h con 41 empleadas, de $ 1.471.271,93 a $ 1.471.299,99.
     - Con más de $ 3 M, la nota puede decir "de X a X" sin cambio.
     - Con $ 8 M y un margen de más de 6 decimales, el precio baja 2
       centavos.
   - **Por qué importa.** Poco. El precio guardado más alto es $ 358.962 con
     IVA, y el implementador lo anotó ("hasta alrededor de $ 1.000.000").
     Pero `docs/agent.md:309` dice "nunca baja" sin tope.
   - **Arreglo (opcional).** Si `serviceNet(next)` no queda en centenas, no
     redondear (o resolver con más precisión) y anotar el tope en
     `docs/agent.md`.

9. **Detalles.**
   - `lib/agent/business-profile.ts:61` dice "hasta $ 99 más", pero son
     hasta $ 99,99.
   - El margen se muestra con 2 decimales (45,53 %). Si piden "dejalo en
     45,53 %", es un margen pedido y el precio queda en $ 14.600,08 en vez de
     $ 14.600,00 (`half-cent.ts`).
   - `shouldRoundPrice` mira si vino `revenue_percent`
     (`lib/agent/agent-pricing.ts:61`), no si el margen cambió. Si el modelo
     reenvía el margen actual, algo que el prompt le pide no hacer, no se
     redondea y `changedFields` no lo muestra.
   - `employees: null` es 1 en `findMatchingBudgets`
     (`lib/agent/tools/budgets.ts:84`) y deja la búsqueda "incompleta" en
     `searchOfficialBudgets`. La descripción lo dice, pero pedir "los mismos
     datos" en las dos puede llevar a citar el precio de una empleada. El
     prompt pide preguntarlo, y en el smoke lo preguntó.
   - La hora de los oficiales sigue con centavos
     (`lib/official-budgets/snapshot.ts:91`), aunque el perfil dice "el
     precio por hora se da redondeado a pesos". Se cita tal cual y
     `draftEmail` la acepta.

### Verificado sin hallazgos

- **Redondeo** (`fuzz-rounding.ts`, semillas 44, 45 y 46, con 200.000 casos
  de `applyAgentChanges` cada una).
  - Cubre las cinco fuentes, cambios al azar, IVA de 0,5 a 100, aportes
    prendidos y apagados, márgenes de 0 a 300 % con hasta 6 decimales y
    horas de 0 a 12 con decimales.
  - Hubo unos 120.000 redondeos por semilla, y el precio del formulario
    siempre quedó al día.
  - Fallaron 0 veces:
    - redondear cuando no corresponde, o no redondear cuando corresponde;
    - `to` distinto del neto del cálculo, o `from` distinto del precio
      exacto;
    - margen que baja;
    - `changedFields` distinto de lo pedido;
    - un estimado de productos fuera de múltiplos de $ 500;
    - `roundPrice` copiado como campo;
    - una hora con centavos.
  - Todos los precios que no quedan en centenas, y el único que no sube
    (con $ 12,4 M de costo), tienen costos de más de $ 1.000.000
    (hallazgo 8).
  - Sin horas o sin costo no se redondea, porque no hay margen que resolver.
  - `roundUpToPriceStep` y `roundProductsPrice` pasaron 2.000.000 de valores
    por semilla sin fallas. Casos borde:
    - $ 23.400,00 no sube;
    - 0, negativo y NaN dan 0;
    - de $ 0,01 a $ 250 dan $ 500;
    - $ 750 da $ 1.000, porque el empate sube.
- **Lo que se guarda.**
  - En 150.000 propuestas de crear y unas 130.000 de guardar, `summary.after`
    es idéntico a `calculateBudget` con la misma base y los mismos changes.
  - En los casos redondeados, lo que escribiría `createBudget` coincide con
    la tarjeta al centavo con cualquier IVA.
  - Guardado y releído como lo citan `findMatchingBudgets` y `getBudget`
    (`getStoredOptionAmounts`), da el mismo neto, IVA y final que la tarjeta
    en los 251.981 casos redondeados con IVA 22 (`fuzz-stored.ts`).
  - El margen de 6 decimales va entero en el JSON del payload y en la
    columna `Float`.
- **Matriz de cuándo se redondea** (fuzz y `scenarios.ts`, D y E).

  | Caso | ¿Redondea? |
  | --- | --- |
  | Presupuesto nuevo | Sí |
  | Cambio en un guardado o en el formulario | Sí |
  | Margen pedido | No |
  | `roundPrice: true` | Sí, también con margen pedido, con IVA solo o sin otros cambios ("redondealo y guardalo") |
  | `roundPrice: false` | No |
  | `solveForTargetPrice` | No, aunque estima si es nuevo; también con `changes` null |
  | Abrir un guardado o calcular sin cambios | No |
  | IVA solo | No |
  | Formulario sin cambios | No |
  | `edited` | No, salvo el borde del hallazgo 7 |

  Los dos desvíos son los hallazgos 1 y 7.
- **Hora en pesos y citables** (`grounding-check.ts`, 108 servicios).
  - Todos los importes de la tabla de la tarjeta, con el formato con que se
    muestran, pasan `validateEmailDraft`.
  - La hora pasa con o sin decimales ("$ 422").
  - La hora sin redondear y el `from` del redondeo se rechazan.
  - La propuesta deja citar los mismos importes que el cálculo.
  - Los precios guardados y releídos son citables y redondos.
  - Los importes de turnos anteriores a la 44 siguen citables, porque el
    grounding se rearma desde las salidas guardadas.
- **`findMatchingBudgets`.**
  - El guard admin va primero (`data/agent/budgets.ts:39`), y la ruta
    también lo exige.
  - Ordena por `updatedAt desc, id asc`, trae 10 más 1 para `truncated` y
    filtra los productos dentro del mismo `some`.
  - Las horas se comparan por igualdad exacta: en la base todas son
    múltiplos de 0,25.
  - Busca en todos los presupuestos, igual que `searchBudgets`.
  - Opciones mezcladas: con `some` se citaría también el precio de una
    opción de otro servicio. Pero en la base no hay ningún presupuesto así
    (solo lectura: 0 de 203, sin opciones repetidas y sin presupuestos a los
    que les falte la opción sin productos). Además, crear, guardar y
    duplicar hacen las dos opciones con el mismo servicio.
  - La tarjeta muestra el neto guardado sin productos, el de la opción con
    productos y "Precio oficial vigente".
- **Prompt y habilidades.**
  - `NEW_BUDGET_RULE` va en General, Presupuestos y Emails, y no en
    Consejos.
  - Emails suma `findMatchingBudgets` y `proposeCreateBudget`.
  - `TOOL_POLICY` permite proponer al responder un pedido que hubo que
    calcular.
  - `proposeCreateBudget` parte de la misma base que `calculateBudget`, y la
    regla pide `fromDefaults` true.
- **Arquitectura.**
  - La búsqueda está en `data/`, como lectura con guard.
  - Las tools no importan `actions/` ni `lib/db`.
  - Los redondeos son funciones puras de `lib/agent/`, sin ciclo:
    `price-rounding.ts` no importa el cálculo.
  - `save-budget.ts` cambia una sola palabra.
  - Ningún archivo de código pasa de 200 líneas. El más largo es
    `lib/agent/budget-calculation.ts`, con 199.
  - No hay `console.log`, `debugger` ni TODO nuevos, salvo el mensaje de
    éxito del check.

### Fuera de alcance

- **Raíz del hallazgo 7, para la 43.** `saveAgentBudget` pasa lo editado por
  `applyBudgetChanges`, que cambia un aporte habilitado en 0 por el valor por
  defecto. Por eso, ya antes de la 44, lo guardado ($ 7.273,46) difería de lo
  que mostraba el editor ($ 6.533,98).
- **Un centavo sin redondeo.** Sin redondeo y con insumos de muchos
  decimales, el `price` del formulario (`toFixed(2)`) y la tarjeta
  (`roundMoney`) pueden diferir en un centavo, a veces también con IVA 22 (de
  5 a 12 casos por semilla en el fuzz). Es anterior a la 44. Con el redondeo
  de la 44 no apareció ninguno.
- **Slug.** `lib/budget-slug.ts` borra las letras con acento. Ya lo anotó el
  implementador.

## Checkpoints

- **C1: [x]** Existen los archivos del harness y `.\init.ps1` sale con 0.
- **C2: [x]** Hay una sola `in_progress` (la 35). La 44 sigue `pending` a
  propósito, como de la 38 a la 43, y `progress/current.md` la describe.
- **C3: [x]**
  - La lectura nueva está en `data/agent/budgets.ts`, con
    `requireAdminSession()` primero.
  - Las tools usan `data/`, y los helpers puros están en `lib/agent/`.
  - La UI usa `AgentCard` y `CardNote`.
  - No hay escrituras nuevas: `save-budget.ts` solo cambia la fuente.
  - Los archivos de código tienen 200 líneas o menos.
- **C4: [x]**
  - Pasan harness, ESLint, `prisma validate`, `tsc` y los once checks.
  - El `next build` es el del líder, sobre este HEAD.
  - La UI tiene el smoke del implementador en el navegador, en escritorio.
    Faltan 390x844 y el modo oscuro (ver abajo).
- **C5: [x]**
  - El árbol está limpio. Solo aparece sin trackear
    `review_agent_budget_sheet.md`, de otro revisor.
  - No quedan archivos temporales ni debug.
  - Los datos de prueba están anotados: dos conversaciones y dos propuestas
    PENDING que vencen solas.

## Evidence

- `.\init.ps1` (PowerShell): **pass**, exit 0 (26 s). Harness OK (44
  features, una `in_progress`), `prisma validate` OK y ESLint OK.
- `pnpm exec tsc --noEmit --incremental false`: **pass**, exit 0 (14 s).
- `pnpm check:agent-pricing`: **pass** ("Agent pricing checks passed").
- Regresiones, todas **pass**:
  - `check:agent-tools`, `check:agent-proposals`, `check:agent-sheet`,
    `check:agent-page` y `check:agent-budget-editor`;
  - `check:ai-gateway` y `check:official-budgets`;
  - `check:mail-agent`, `check:mail-official-budgets` y
    `check:mail-conversational-drafts`.
- `pnpm exec next build` del líder sobre HEAD `16ff4ae`, que cubre de la 41
  a la 44: **pass**.
  - Salió con exit 0 en 39 s, compiló en 11,1 s y pasó TypeScript.
  - Generó 29 páginas estáticas y listó 38 rutas, entre ellas
    `ƒ /api/agent/chat` y `ƒ /dashboard/agent`.
  - En `scratchpad/next-build-16ff4ae.log` confirmé la compilación, el
    29/29 y las 38 rutas.
- Scripts del revisor en `scratchpad/review-44/`. Son puros, salvo el último,
  que es de solo lectura:
  - `fuzz-rounding.ts` (y sus variantes `-iva` y `-cost`): 3 semillas, cada
    una con 200.000 cálculos, 50.000 crear, 50.000 guardar y 2.000.000 de
    redondeos sueltos. Los resultados están arriba.
  - `big-costs.ts`: el primer costo que falla es $ 1.014.670.
  - `fuzz-stored.ts`: 251.981 casos redondeados con IVA 22. Lo releído es
    igual a la tarjeta, con un costo máximo de $ 404.253.
  - `half-cent.ts`: 300.000 casos con IVA 22 a partir de los valores por
    defecto, sin diferencias de centavo.
  - `grounding-check.ts`: 108 servicios, 0 fallas.
  - `scenarios.ts` y `edited-preview.ts`: los hallazgos 1, 5 y 7 y los casos
    D y E de la matriz.
  - `mutate.mjs` y `mutate-guard.mjs`: 33 mutaciones sobre una copia del
    código en el scratchpad, con `node_modules` como junction y sin `.env`.
    Hubo 24 detectadas, 1 equivalente (`to: target`) y 8 sin detectar
    (hallazgo 4).
  - `db-read.ts`: solo `findMany`, sin imprimir nombres ni secretos.
    - 203 presupuestos y 337 opciones.
    - Ningún presupuesto con opciones de distinto servicio, ninguno sin la
      opción sin productos y ninguno con más de dos opciones.
    - Horas en múltiplos de 0,25, solo IVA 22 y de 1 a 5 empleadas.
    - El precio máximo es $ 358.962, y ninguno pasa de $ 500.000.
    - De las 134 opciones con productos, 84 no son múltiplo de $ 500 y 99
      tienen margen de productos.
    - 32 de los 203 netos sin productos están en centenas.
    - Hay 71 servicios distintos: el mayor tiene 17 presupuestos, y 3 tienen
      más de 10.
    - Hay 16 oficiales vigentes.

## Criterios de aceptación

1. **`calculateBudget` y las propuestas comparten `applyAgentChanges`; el
   precio nuevo o cambiado sube al próximo múltiplo de $ 100, nunca baja y
   sube menos de $ 100, y la salida y la tarjeta dicen de cuánto a cuánto:
   cumplido, con salvedades.**
   - Usos: `lib/agent/tools/calculations.ts:45` y
     `lib/agent/proposal-builders.ts:71` y `:104`.
   - `rounding` va en la salida (`calculations.ts:54`) y en el aviso de la
     tarjeta (`describeRounding`).
   - Salvedades: con más de $ 1 M de costo (hallazgo 8), y un cambio solo de
     productos también redondea (hallazgo 1).
2. **No redondean el margen pedido, el precio objetivo, `roundPrice: false`,
   abrir un guardado, el IVA solo ni lo editado en la 43, y `roundPrice: true`
   redondea un margen pedido: cumplido,** salvo el borde del aporte
   habilitado en 0 % en el editor (hallazgo 7).
3. **Un presupuesto nuevo estima transporte y productos con sus horas salvo
   que vengan los montos, y todo estimado de productos va al múltiplo de
   $ 500 más cercano, con mínimo de $ 500: cumplido.**
   - Código: `lib/agent/agent-pricing.ts:50-54` y
     `lib/agent/budget-calculation.ts:170`.
   - En el fuzz hubo 0 fallas.
4. **La hora va en pesos, y los totales redondeados y la hora son citables
   pero el precio sin redondear no: cumplido** (`budget-calculation.ts:69` y
   `grounding-check.ts`).
5. **`findMatchingBudgets` devuelve los guardados con la misma frecuencia,
   visitas, horas, empleadas y opción con productos, con sus precios
   guardados citables, y la propuesta de crear avisa: cumplido.**
   - Lo verifiqué leyendo el código y contra la base.
   - No tiene prueba de comportamiento (hallazgo 4).
   - El aviso cuenta de menos cuando hay más de 11 iguales (hallazgo 5).
6. **Las habilidades que calculan buscan el oficial y un igual antes de
   calcular, y Emails responde con ese precio y propone guardar el que
   calculó: cumplido,** en el prompt y en el smoke, con los dos correos.
   `PRICE_RULE` no nombra la fuente nueva (hallazgo 6).
7. **Checks, regresiones, TypeScript, lint, build y smoke autenticado con
   OpenAI: cumplido.**
   - Volví a correr todo, salvo el build, que es el del líder.
   - El smoke es el del implementador, en Medio.

## Evidencia del smoke del implementador

- **Alcanza para** lo que pide el plan:
  - un servicio que ya existía: buscó el oficial y los 6 iguales y citó el
    guardado;
  - un presupuesto nuevo con la nota del redondeo ($ 54.062,33 →
    $ 54.100,00), productos de $ 5.500 (estimado $ 5.670), transporte de
    $ 1.347,84 y hora de $ 417 y $ 460. Recalculé esos números y cierran;
  - margen de 40 % sin redondeo;
  - un correo para un servicio nuevo: calculó, redactó con $ 64.500,00 y
    $ 78.690,00 y propuso guardarlo, en 6 pasos y 26 s;
  - un correo para un servicio que ya existía: precio guardado, sin
    propuesta;
  - consola limpia.
- **Falta, sin bloquear:**
  - "redondealo" en vivo (`roundPrice: true`; lo cubre el check);
  - rechazar la propuesta;
  - ver el aviso de duplicado en una tarjeta real (al crear no había
    iguales);
  - una búsqueda con `hasProducts: true`;
  - 390x844 y el modo oscuro de la nota y de la lista;
  - los tiempos del flujo de Emails en Bajo y en Alto (hallazgo 3).

## Seguimiento recomendado (no bloquea la aprobación)

- **En la misma pasada, porque son chicos:** 4 (aserciones del grounding,
  del guard y del aviso), 7, 1, 6 y 5.
- **Antes de desplegar:** 3 (medir en Bajo o subir `maxDuration`).
- **Con el usuario:** 2.
- **Opcional:** 8 y los detalles del 9.
