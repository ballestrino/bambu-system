# Review - ai_model_gateway (feature 38)

**Verdict:** APPROVED

Es el veredicto de la re-revisión sobre `b6becae` (última sección). Hasta
esa sección, el texto es la primera revisión, sobre `9d3fb00`, que pidió
cambios.

Alcance: `eb28ae1..9d3fb00` (`55e2fc6` feat y `9d3fb00` docs), revisado sobre
`feature/40-agent-proposals` (HEAD `a63a8b0`). `lib/ai/**`,
`scripts/check-ai-gateway.ts` y `.env.template` no cambian después de la 38
(`git diff 9d3fb00..HEAD` vacío en esas rutas). En `package.json` la 39 y la
40 solo suman dos scripts. Las 39 y 40 usan la capa sin crear proveedores ni
escribir ids de modelo fuera de `lib/ai`.

Hay un solo bloqueante, chico y local: el parser de `AI_PRICE_<MODELO>`
inventa precios en vez de fallar. El resto está bien resuelto y verificado.

## Findings

### Bloqueante

1. `lib/ai/pricing.ts:47-50`: `parsePriceOverride` convierte cada parte con
   `Number(part.trim())`, y `Number("")` es `0`. Un campo vacío pasa como
   precio 0. También acepta hexadecimal (`0x10` → 16). Lo reproduje contra el
   módulo real con Terra y el mismo uso (10.000 de entrada, 2.000 cacheados,
   1.000 de escritura y 1.000 de salida):
   - `AI_PRICE_GPT_5_6_TERRA=",,"` → `{ costUsd: 0, priced: true }`.
   - `"1,,6"` → 0,014, con la entrada cacheada a 0.
   - `"1,0.1,6,"` (coma final) → 0,0132: la escritura de caché queda en 0. Sin
     la coma da 0,0142, porque aplica el default "como entrada" de `:45`/`:56`.
   - `"0x10,0,1"` → 0,129, con la entrada leída como 16.

   Por qué importa:
   - `docs/agent.md:165-166` promete que un valor inválido lanza un error que
     nombra la variable, y `:205` que nunca se inventa un precio.
   - La 39 depende de ese error. `lib/agent/usage-collector.ts:31-38` lo
     captura y deja el uso con `priced: false` ("precio no configurado"), como
     pedía `progress/current.md:28-31`. Con este parser, un typo termina en un
     US$ 0 silencioso que se persiste y queda fijo (`docs/agent.md:210-211`).
   - El override es el camino documentado para ponerle precio a otro
     proveedor y para actualizar Sol cuando termine su promoción (menor 2).
   - El check prueba formatos inválidos (`scripts/check-ai-gateway.ts:155-160`),
     pero ninguno con campos vacíos.

   Arreglo: validar cada parte antes de convertirla (por ejemplo con
   `/^\d+(\.\d+)?$/` después del `trim`) y sumar al check `",,"`, `"1,,6"`,
   `"1,0.1,6,"` y `"0x10,0,1"`. El arreglo no toca la 39 ni la 40: el único
   llamador ya captura el error.

### Menores (no bloquean; conviene resolverlos en la misma pasada)

2. `lib/ai/pricing.ts:12-16,30-35` y `docs/agent.md:188-196`: la página de
   precios de OpenAI (leída hoy) aclara que el precio de Sol es promocional
   "at least through November 21, 2026". La tabla es correcta hoy, pero nada
   avisa que es promocional. Cuando termine la promoción, el costo de Alto
   quedará subestimado y congelado. Anotar la promoción y su fecha en el
   comentario y en la doc.
3. `lib/ai/pricing.ts:45,56`: sin el cuarto valor, la escritura de caché se
   cobra como entrada. `docs/agent.md:163` no lo dice, y en gpt-5.6 la
   escritura cuesta 1,25 veces la entrada. Con el mismo uso del punto 1, un
   override de tres valores con los precios reales de Terra (`2,0.2,12`) da
   0,0284, y la tabla da 0,0289: la escritura queda un 20 % abajo. El check
   nunca prueba ese default, porque el uso de
   `scripts/check-ai-gateway.ts:121-123` tiene `cacheWriteTokens: 0`.
   Documentarlo en la doc y sumar una aserción.
4. `lib/ai/providers.ts:21-27`: la rama OIDC (sin clave, con `VERCEL` o
   `VERCEL_OIDC_TOKEN`) no tiene prueba. El check borra esas variables
   (`scripts/check-ai-gateway.ts:17-19`) y solo prueba la falta de clave y la
   clave explícita (`:76-83`). Es el camino sin clave que documenta
   `docs/agent.md:159`. Esa línea tampoco avisa que el token local de
   `vercel env pull` vence: con el token vencido pasa la precondición y falla
   recién en la llamada.
5. `lib/ai/model-spec.ts:91-98` y `lib/ai/modes.ts:50-55`: el título no tiene
   override. Siempre usa Luna (`openai/…` con el gateway). El criterio no lo
   exige (el título no es un modo) y la 39 tiene un fallback determinista,
   pero retirar Luna o dejar OpenAI del todo requeriría tocar código.
   Opcional.
6. `package.json` no tiene `engines` y `.vercel/project.json` no tiene
   `nodeVersion`. La versión de Node del deploy sigue sin confirmar, y
   `ai@7` exige `node >=22`. Ya figura como pendiente en
   `progress/current.md:32`. Confirmarlo antes del deploy o fijar
   `"engines": { "node": ">=22" }`.

## Criterios de aceptación

| # | Criterio | Estado |
| --- | --- | --- |
| 1 | `ai`, `@ai-sdk/openai`, `@ai-sdk/react` con Node 22+ y zod 4 | Cumplido en local. Instalados `ai@7.0.105`, `@ai-sdk/openai@4.0.69` y `@ai-sdk/react@4.0.108`, iguales al lockfile. Una sola copia de `ai` (`@ai-sdk/react` depende de `7.0.105` exacto). `engines >=22` contra Node local v24.14.1; peer zod `^4.1.8` contra 4.3.5; peer React contra 19.2.3. El Node del deploy queda pendiente (menor 6) |
| 2 | `resolveModelSpec` Bajo/Medio/Alto con `AI_PROVIDER`, `AI_MODEL_*`, `AI_REASONING_*`, `AI_DEFAULT_MODE` | Cumplido y probado (`check-ai-gateway.ts:21-58`): defaults, vacíos como no configurados, mayúsculas, valores inválidos, `/` sin gateway y modo desconocido |
| 3 | Proveedores perezosos con error claro sin clave | Cumplido y probado (`:74-83`, y por texto fuente `:176-183`). La rama OIDC no tiene prueba (menor 4) |
| 4 | `store: false` y safety identifier seudónimo equivalente al del mail | Cumplido y probado (`:66-72`, `:85-95`): con `'mail'` el hash es idéntico a `getMailSafetyIdentifier`. En `@ai-sdk/openai` confirmé que `store`, `safety_identifier` y `parallel_tool_calls` llegan al cuerpo de la llamada, y que con `store: false` se agrega `reasoning.encrypted_content` en modelos con razonamiento |
| 5 | Tabla de precios con costo en USD y modelos sin precio explícitos | **No cumplido del todo.** La tabla coincide con la página oficial, la fórmula coincide con cómo el SDK separa los tokens (`noCache = input − cached − cacheWrite`) y un id sin precio da `null`/`false`. Pero un override mal escrito inventa un precio (bloqueante 1) |
| 6 | Pasar un modo al Vercel AI Gateway u otro proveedor solo con entorno | Cumplido, verificado de forma estructural (`:53-58`, `:80-83`): prefijo `openai/`, ids de otros proveedores sin cambios y modelo del gateway creado. No hubo llamada real al gateway, como se pidió. `AI_PROVIDER` es global: mover un modo a otro proveedor también pasa los demás por el gateway (como `openai/…`). Coincide con el plan y está documentado |
| 7 | Checks, TypeScript, lint y build registrados | Cumplido. Ver Evidence. El build de este código está en `progress/impl_ai_model_gateway.md` y el de HEAD en `progress/review_agent_proposals.md` |

## Smoke real contra OpenAI (del implementador)

Alcanza para confiar en que los ids y los niveles de razonamiento funcionan
por OpenAI directo: un turno por modo (Luna xhigh, Terra high, Sol medium,
título con Luna none y `streamText` en Medio) sin advertencias. Además, las
pruebas reales de la 39 y la 40 pasaron por esta capa; la de la 39 incluye
Alto con Sol (`progress/current.md:50-53` y `:79-83`). Faltan tres cosas:

- Datos crudos. El script se borró y no quedaron registrados el uso por modo,
  los ids que devolvió la API ni el arreglo de advertencias.
- Una llamada con tokens cacheados y de escritura mayores a 0 para comparar la
  fórmula contra el panel de uso de OpenAI. Hoy la fórmula solo está
  contrastada con la semántica del SDK.
- Un turno real por el gateway (NOT RUN). Hacerlo antes de usar
  `AI_PROVIDER=gateway` en producción.

Ninguna de estas tres cosas bloquea.

## Checkpoints

- C1: [x] Los archivos del harness existen y `.\init.ps1` terminó con exit 0.
- C2: [x] Hay una sola feature `in_progress` (la 35) y todos los estados son
  válidos. La 38 sigue `pending` por el slot ocupado
  (`progress/current.md:8-10`) y espera esta revisión (`:16-18`).
- C3: [x] `lib/ai` es infraestructura en `lib/`, sin mutaciones, rutas ni
  datos. Los módulos puros solo importan tipos del SDK (lo asserta el check),
  y ni la 39 ni la 40 crean proveedores ni escriben ids fuera de `lib/ai`.
- C4: [x] Pasan harness, lint, `prisma validate`, `tsc`, `check:ai-gateway` y
  la regresión del mail. El build está delegado (ver Evidence) y no hay UI.
- C5: [x] Sin archivos temporales ni TODO. El único `console.log` es el
  mensaje final del check, igual que en `check-mail-agent` y
  `check-finance`. El cambio de estado queda para el líder después de esta
  revisión.

## Evidence

- `.\init.ps1` (PowerShell): pass, exit 0 en 28,6 s. Harness con 41 features
  y 1 `in_progress`, `prisma validate` OK, ESLint completo OK; el build se
  omite por diseño.
- `pnpm exec tsc --noEmit --incremental false`: pass (exit 0). Con
  `--listFilesOnly` confirmé que incluye `lib/ai/**` y
  `scripts/check-ai-gateway.ts`, así que la aserción de tipos de
  `check-ai-gateway.ts:96-98` también se compila.
- `pnpm check:ai-gateway`: pass ("AI gateway checks passed").
- `pnpm check:mail-agent`: pass ("Mail agent checks passed").
- `pnpm ls ai @ai-sdk/openai @ai-sdk/react --depth 0`: 7.0.105, 4.0.69 y
  4.0.108, iguales al lockfile.
- Lectura del SDK instalado:
  - `convertOpenAIResponsesUsage` calcula `noCache` igual que
    `estimateUsageCost`.
  - `addLanguageModelUsage` suma `cacheWriteTokens` entre pasos.
  - `step.model.modelId` es el id configurado, no un snapshot con fecha, así
    que coincide con las claves de la tabla.
  - gpt-5.6 no filtra niveles de razonamiento y es modelo con razonamiento.
- Probe de casos borde: script temporal en el scratchpad de la sesión, fuera
  del repo, contra los módulos reales. Reproduce los hallazgos 1 y 3, y
  confirma que los vacíos cuentan como no configurados, que `AI_PROVIDER`
  acepta mayúsculas, que el prefijo `openai/` y los overrides con y sin
  prefijo funcionan, y que `constructor`, `__proto__` y los ids con fecha
  quedan sin precio.
- Página de precios oficial (<https://developers.openai.com/api/docs/pricing>,
  leída hoy, sin llamar a la API): los precios Standard de contexto corto de
  Luna, Terra y Sol (entrada, cacheada, escritura y salida) coinciden con la
  tabla. El contexto largo cuesta el doble de entrada y 1,5 veces la salida,
  como dice la doc. Sol tiene precio promocional (menor 2).
- Prueba de mutación: no la repetí. Por lectura, el check detecta los dos
  casos que reporta el implementador: Bajo con otro razonamiento falla en
  `:23-25`, y un `const x = createGateway(` a nivel de módulo falla en `:180`.
- `git status --short`: limpio antes de escribir este reporte.
- `pnpm build` / `next build`: no los corrí, por indicación del líder. El
  `pnpm exec next build` del implementador (37 rutas) está en
  `progress/impl_ai_model_gateway.md`. El build de HEAD, que incluye este
  código, queda en `progress/review_agent_proposals.md`.
- No se hicieron llamadas a OpenAI ni al gateway, ni escrituras en la base.

## Para aprobar

- Corregir el bloqueante 1 y sumar sus aserciones al check.
- Recomendado en la misma pasada: los menores 2 y 3 (comentario, doc y una
  aserción).
- Volver a correr `pnpm check:ai-gateway`,
  `pnpm exec tsc --noEmit --incremental false` y `.\init.ps1`.

## Re-revisión (b6becae)

**Verdict:** APPROVED

`b6becae` va encima de `a63a8b0`, en la misma rama, y trae juntos los
arreglos de las 38, 39 y 40. Acá revisé solo lo de la 38: `lib/ai/pricing.ts`,
`lib/ai/providers.ts`, `scripts/check-ai-gateway.ts` y las partes de
`docs/agent.md` y `docs/agent-plan.md` que la tocan. También la sección
"Correcciones de la revisión" de `progress/impl_ai_model_gateway.md:87-105`.
Los cambios de la 39 y la 40 los revisan sus revisores. De ellos solo
comprobé que no rompen el contrato de `lib/ai` (ver Evidence).

### Resuelto

1. **Bloqueante (override de precio que inventaba precios): resuelto.**
   - `lib/ai/pricing.ts:51` define `PRICE_PART = /^\d+(\.\d+)?$/`, y
     `:55-65` valida cada parte después del `trim` y antes de `Number`.
   - Probé contra el módulo real. Lanzan el error con el nombre de la
     variable: `",,"`, `"1,,6"`, `"1, ,6"`, `"1,0.1,6,"`, `"0x10,0,1"`,
     `"1e3,0,1"`, `"Infinity,0,1"`, `"-0,0,1"`, `"+1,0,1"`, `"1.5.2,0,1"`,
     `"1_000,0,1"` y un dígito de ancho completo.
   - Siguen valiendo `" 1 , 0.1 , 6 "`, `"0,0,0"` (cero explícito) y
     `"007,0,1"`. Un override en blanco sigue contando como no configurado y
     cae a la tabla.
   - La aserción está en `scripts/check-ai-gateway.ts:165-171`.
   - `lib/agent/usage-collector.ts:31-39` sigue capturando el error y deja el
     uso en `priced: false`. Ahora un typo termina en "precio no configurado"
     y no en US$ 0.
2. **Precio promocional de Sol: resuelto.** Está anotado en
   `lib/ai/pricing.ts:17-18` y `docs/agent.md:222-225`, con la cita que leí
   hoy en la página de precios de OpenAI.
3. **Escritura de caché con tres valores: resuelto.**
   - El default pasa a 1,25 veces la entrada
     (`lib/ai/pricing.ts:46-47,64-65`) y está documentado en
     `docs/agent.md:187`.
   - Con tres valores, los precios reales dan lo mismo que la tabla en los
     tres modelos: Luna 0,00289, Terra 0,0289 y Sol 0,0538, con escritura de
     caché mayor a 0.
   - La aserción está en `scripts/check-ai-gateway.ts:158-164`.
4. **Rama OIDC sin prueba: resuelto.**
   - `hasGatewayCredentials(env)` (`lib/ai/providers.ts:22-23`) separa la
     precondición y `getGatewayProvider` la usa (`:27`), con la misma lógica
     que antes.
   - Se prueba en `scripts/check-ai-gateway.ts:78-80`: OIDC, `VERCEL`, clave,
     y clave en blanco que no cuenta.
   - `docs/agent.md:183` avisa que el token local vence a las 12 horas. La
     doc de OIDC del AI Gateway de Vercel lo confirma: "only valid for 12
     hours".

### Sin resolver (no bloquean)

5. **Override del modelo del título:** no se hizo. Era opcional y queda en
   el seguimiento (`docs/agent-plan.md:445`).
6. **`engines` y el Node del deploy:** no se hizo. Queda como decisión del
   usuario (`docs/agent-plan.md:445`, `progress/current.md:39`). Hay que
   confirmar Node 22.x o 24.x en Vercel antes de desplegar: `ai@7` exige
   `node >=22`.
- También siguen abiertos los tres faltantes del smoke real: datos crudos,
  una llamada con caché para comparar la fórmula con el panel de OpenAI, y
  un turno por el gateway antes de usarlo en producción. Ninguno bloquea.

### Criterios de aceptación

El 5 pasa a **cumplido**: un override mal escrito ya no inventa un precio y
un modelo sin precio sigue dando `{ costUsd: null, priced: false }`. Los
demás siguen cumplidos, con las mismas salvedades de la primera revisión:
Node del deploy (1) y ningún turno real por el gateway (6).

### Checkpoints

- C1: [x] `.\init.ps1` terminó con exit 0.
- C2: [x] Hay una sola feature `in_progress` y 41 features válidas. La 38
  sigue `pending` hasta que el líder la cierre.
- C3: [x] Los cambios quedan en `lib/ai`, y `pricing.ts` sigue puro. Fuera de
  `lib/ai`, nadie crea proveedores, escribe ids de modelo ni lee
  `AI_*`/`OPENAI_*`/`VERCEL*`.
- C4: [x] Pasan harness, lint, `prisma validate`, `tsc`, `check:ai-gateway`
  y `check:mail-agent`.
- C5: [x] No hay restos de depuración. `scripts/check-ai-gateway.ts` tiene
  199 líneas: la próxima aserción tiene que ir en otro archivo, como
  `scripts/agent-input-checks.ts` en la 39.

### Evidence

Todo sobre HEAD `b6becae`. Después de correr los comandos confirmé que HEAD
no cambió y que `lib/ai`, el check, `docs/agent.md`, `package.json` y
`.env.template` no tienen cambios contra `b6becae`.

- `.\init.ps1` (PowerShell): pass, exit 0 en 31,0 s. Harness con 41
  features y 1 `in_progress`, `prisma validate` OK, ESLint completo OK.
- `pnpm exec tsc --noEmit --incremental false`: pass, exit 0 en 19 s.
- `pnpm check:ai-gateway`: pass ("AI gateway checks passed").
- `pnpm check:mail-agent`: pass ("Mail agent checks passed").
- Prueba de mutación propia, sin tocar el repo. Copié los módulos puros al
  scratchpad de la sesión y corrí las aserciones del check copiadas tal cual
  (`:78-80` y `:122-171`). La línea base pasa, y las cuatro mutaciones fallan:
  - la validación vuelta a `Number()`: "Missing expected exception";
  - la escritura de caché a 1 vez la entrada: falla el deep-equal;
  - `hasGatewayCredentials` sin `VERCEL_OIDC_TOKEN`;
  - `hasGatewayCredentials` sin el `trim` de la clave.

  Confirma el "3 de 3" del implementador.
- Probe de casos borde contra el módulo real (scratchpad): los resultados
  están en los puntos 1 y 3 de "Resuelto".
- Documentación externa leída hoy, sin llamar a ninguna API: la página de
  precios de OpenAI (promoción de Sol) y la de OIDC del AI Gateway de Vercel
  (12 horas).
- Contrato de `lib/ai` después de `b6becae`: la búsqueda de ids `gpt-5.6`,
  `createOpenAI`, `createGateway`, `@ai-sdk/openai` y
  `process.env.(AI_|OPENAI|VERCEL)` en `lib/agent`, `app/api/agent`,
  `actions/agent`, `data/agent`, `schemas` y `components` no encontró nada.
  `hasGatewayCredentials` solo se usa en `providers.ts` y el check.
- Build: no lo corrí, por indicación del líder.
  - El de `a63a8b0` pasa (`progress/review_agent_proposals.md:269`).
  - El implementador reporta `next build` PASS después de los arreglos
    (`progress/impl_ai_model_gateway.md:104-105`).
  - El build de HEAD queda en `progress/review_agent_proposals.md`, a cargo
    del revisor de la 40.
  - Los cambios de la 38 en `b6becae` son una expresión regular, una
    constante y una función pura exportada, y `tsc` pasa sobre todo el
    proyecto.
- Sin llamadas a OpenAI ni al gateway, sin escrituras en la base, sin
  commits. El único archivo que edité es este reporte.
