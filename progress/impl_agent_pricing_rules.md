# Implementación - Feature 44 Reglas de precio del agente

Rama `feature/44-agent-pricing-rules`, encima de la 43 (`a4311e3` y
`40c586d`). Pedido del usuario el 2026-09-21: que el agente no dé precios con
números raros, busque el precio lindo moviendo el presupuesto hasta $ 100
(preferentemente hacia arriba), ponga los productos en múltiplos de $ 500, se
fije si ya hay un presupuesto igual antes de generar uno, y al responder un
mail que pide presupuesto lo busque y, si no existe, lo genere para responder
con el precio. Decidido con el usuario: el precio sube siempre al próximo
múltiplo de $ 100 y los productos van al múltiplo de $ 500 más cercano, con un
mínimo de $ 500. Plan en `docs/agent-plan.md` (sección "Feature 44"),
contrato en `docs/agent.md` (sección "Reglas de precio").

## Alcance

- `lib/agent/price-rounding.ts` (nuevo, puro): `roundUpToPriceStep` y
  `roundProductsPrice`. Cifras en el perfil del negocio (`priceStep`,
  `productsStep`), con dos líneas nuevas en el prompt.
- `lib/agent/agent-pricing.ts` (nuevo, puro): `applyNicePrice`,
  `applyAgentChanges` y `describeRounding`.
- `lib/agent/budget-calculation.ts`: el estimado de productos redondeado,
  `roundPrice` fuera de los campos y el precio por hora en pesos.
- Tools: `calculateBudget` (con `rounding`) y `solveForTargetPrice` usan
  `applyAgentChanges`; `findMatchingBudgets` nuevo (`lib/agent/tools/budgets.ts`
  y `data/agent/budgets.ts`); `proposeCreateBudget` avisa si ya hay guardados
  con el mismo servicio.
- Propuestas: `proposal-builders.ts` usa `applyAgentChanges` y suma el aviso
  del redondeo; la fuente `edited` es la del editor de la 43
  (`actions/agent/save-budget.ts`).
- Schemas: `roundPrice` en los `changes` y `findMatchingBudgetsInputSchema`.
- Prompt y habilidades: `NEW_BUDGET_RULE` con las habilidades que calculan,
  la política de propuestas incluye responder un pedido de presupuesto,
  Presupuestos y Emails suman `findMatchingBudgets`, y Emails suma
  `proposeCreateBudget` y el flujo del correo que pide presupuesto.
- `lib/agent/run.ts`: `MAX_STEPS` de 6 a 8.
- UI: nota del redondeo en la tarjeta de cálculo y la lista "Presupuestos
  iguales" (`matchingBudgets`) en la tarjeta de listas.
- `check:agent-pricing` nuevo; ajustes en `check:agent-tools` (precio por
  hora en pesos), `check:agent-proposals` (crear con las reglas y Emails con
  `proposeCreateBudget`) y `check:agent-budget-editor` (fuente `edited`).

## Decisiones

- El redondeo va en el cálculo y no en el prompt: la regla de precios prohíbe
  redondear a mano y `draftEmail` rechaza importes sin fuente. El precio sin
  redondear no es citable.
- Se sube el margen del servicio con la misma cuenta que el precio objetivo
  (`calculateRevenuePercentForServiceTarget`, 6 decimales): el precio exacto
  sale en centenas hasta costos de alrededor de $ 1.000.000 por mes.
- Se redondea cuando el precio es nuevo o cambia. Un margen pedido se respeta
  (así lo había dicho el plan al usuario) y `roundPrice: true` lo redondea
  igual. Un cambio de IVA solo no mueve el precio sin IVA.
- Un presupuesto nuevo estima transporte y productos: los valores por
  defecto son de 1 visita semanal de 4 horas y en el smoke de la 43 un
  presupuesto de 2 visitas semanales salió con los productos ($ 756) y el
  transporte de 1.
- El precio por hora va en pesos para todo cálculo del agente (también al
  abrir un guardado): es una referencia y así el modelo no redondea a mano.
- Lo editado a mano en el editor de la 43 se guarda tal cual (fuente
  `edited`): sin estimados ni redondeo.
- `findMatchingBudgets` busca en los guardados, que incluyen a los que son
  oficiales (se marcan). La búsqueda oficial sigue aparte, primero, por las
  fuentes que registra `draftEmail`.
- `MAX_STEPS` 8: responder un mail sin presupuesto guardado usa 6 pasos y
  con 6 no quedaba lugar para un reintento.
- Los guardados de antes de la 44 no se tocan: sus precios se citan tal
  cual. "Redondealo y guardalo" propone el cambio con `roundPrice: true`.

## Verificación

- PASS: `check:agent-pricing` con prueba de mutación, 19 de 19 detectadas
  (redondeo al más cercano, productos hacia arriba o sin mínimo, margen
  pedido redondeado, IVA que redondea, nuevo sin estimados, `roundPrice`
  ignorado, productos dados pisados, precio ya redondo que se mueve, hora con
  centavos, estimado sin redondear, `roundPrice` como campo, crear sin aviso,
  guardar cambios como nuevo, editor con reglas, prompt sin pasos, crear sin
  aviso de duplicado, Emails sin proponer y búsqueda sin empleadas).
- PASS: regresiones `check:agent-tools`, `check:agent-proposals`,
  `check:agent-sheet`, `check:agent-page`, `check:agent-budget-editor`,
  `check:ai-gateway`, `check:official-budgets`, `check:mail-agent`,
  `check:mail-official-budgets` y `check:mail-conversational-drafts`.
- PASS: `pnpm exec tsc --noEmit`, `.\init.ps1` (harness, `prisma validate` y
  ESLint) y `pnpm exec next build`.
- PASS: smoke autenticado en el navegador integrado contra el `next dev` del
  puerto 3000, con OpenAI real en Medio (unos US$ 0,18):
  - Presupuestos, "Armá un presupuesto de limpieza de oficina, 2 veces por
    semana, 4 horas por visita": preguntó cuántas empleadas; con "1" buscó el
    oficial (ninguno) y los iguales (6), abrió "Oficina 2 veces por semana 4
    horas" y citó sus precios guardados. Hora sin IVA $ 405.
  - "Ahora armá uno nuevo: 3 veces por semana, 5 horas por visita, 2
    empleadas, con productos": sin oficial ni iguales, calculó con "Precio
    redondeado: $ 54.062,33 → $ 54.100,00 sin IVA, con margen 45,1 % (era
    45 %)", productos $ 5.500, transporte $ 1.347,84, con productos
    $ 59.600, horas $ 417 y $ 460. Propuso crearlo con el aviso del redondeo.
  - "Calculá ese mismo con margen 40 %, sin guardar": $ 52.198,11, sin
    redondeo, y lo explicó.
  - Emails, un correo que pide 3 veces por semana, 6 horas, 2 personas, sin
    productos: buscó el oficial y los iguales (ninguno), calculó
    ($ 64.483,92 → $ 64.500,00), redactó con $ 64.500,00 y $ 78.690,00 y la
    nota de Literal E, y propuso guardar "Ferretería Del Puerto — limpieza de
    local". 6 pasos, 26 s.
  - Emails, un correo que pide 2 veces por semana, 4 horas, 1 persona:
    redactó con los precios guardados del igual, sin propuesta.
  - Consola sin errores. Turnos de 8 a 32 s.
- NOT RUN: "redondealo" después de un margen pedido (`roundPrice: true`,
  cubierto por el check), rechazar las propuestas (quedaron pendientes y
  vencen solas), 390x844 y oscuro (la nota y la lista usan los componentes de
  siempre).
- Datos: dos conversaciones de prueba ("Presupuesto de limpieza de oficina" y
  "Cotización de limpieza para ferretería") y dos propuestas de crear
  pendientes. No se guardó ningún presupuesto.

## Hallazgos fuera de alcance

- `lib/budget-slug.ts` borra las letras con acento en vez de sacarles el
  acento: "Ferretería" dio `ferretera`. Quedó como tarea aparte.
- Los presupuestos guardados de antes tienen precios con centavos
  ($ 14.000,15) y alguno con el precio con productos distinto del cálculo
  (deriva de constantes): el agente cita lo guardado.
- `maxDuration` sigue en 60 s: el flujo del mail tardó 26 s en Medio, pero en
  Bajo (Luna con xhigh) puede acercarse. Sigue la decisión pendiente de
  subirlo con Fluid compute.

## Correcciones de la revisión (2026-09-22)

`progress/review_agent_pricing_rules.md` aprobó la feature con ocho menores.
Van en la misma pasada que los bloqueantes de la 43, en el `fix(agent)` de 41-44.

- 1: un cambio solo de productos (o de IVA) no redondea: `shouldRoundPrice`
  compara el precio del servicio sin IVA antes y después, que es lo que dice
  `docs/agent.md`.
- 4: la búsqueda, las filas con sus importes citables y el aviso son puros
  (`lib/agent/matching-budgets.ts`) y tienen prueba
  (`scripts/agent-matching-checks.ts`); el check de fuente acota el guard y el
  grounding a su función.
- 5: el aviso de mismo servicio dice "y más" cuando la lectura trajo el de
  más, en vez de contar sobre 11.
- 6: `PRICE_RULE` nombra a `findMatchingBudgets` entre las fuentes.
- 7: lo editado a mano no se redondea ni con un aporte habilitado en 0 (es el
  bloqueante 1 de la 43).
- 8: si el margen de 6 decimales no da la centena (costos de más de
  $ 1.000.000), `applyNicePrice` no toca el precio.
- 9: "hasta $ 99 más" pasó a "menos de $ 100 más". El resto de los detalles
  queda como estaba.
- 3: la mitigación del plan ya no dice `isStepCount(6)`. Medir el flujo de
  Emails en Bajo y en Alto, o subir `maxDuration`, sigue pendiente de
  decisión.
- 2 (precios con centavos de los guardados de antes y la opción con
  productos de un guardado que cambia) queda para decidir con el usuario.
- PASS: `check:agent-pricing` (productos solos, costo alto, editor con un
  aporte en 0, búsqueda de iguales), regresiones, `tsc`, `.\init.ps1` y
  `pnpm exec next build`. Mutaciones de los arreglos de la 44: 7 de 7.
