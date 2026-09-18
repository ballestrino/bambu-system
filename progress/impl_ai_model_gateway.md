# Implementación - Feature 38 Gateway de modelos

Rama `feature/38-ai-model-gateway`, desde `main` (`eb28ae1`). Plan en
`docs/agent-plan.md`, contrato en `docs/agent.md`.

## Alcance

- Dependencias: `ai@7.0.105`, `@ai-sdk/openai@4.0.69`, `@ai-sdk/react@4.0.108`.
  Node 24.14.1 local cumple `>=22`; zod 4.3.5 cumple el peer
  `^3.25.76 || ^4.1.8`; React 19.2.3 cumple `^19.2.1`.
- `lib/ai/modes.ts`: modos Bajo, Medio y Alto, etiquetas, defaults y spec del
  título.
- `lib/ai/model-spec.ts`: `resolveModelSpec`, `resolveTitleModelSpec`,
  `resolveDefaultMode` y `resolveAiProvider`, con el entorno como parámetro.
- `lib/ai/providers.ts`: factories perezosas de OpenAI (Responses API) y del
  Vercel AI Gateway, y `resolveLanguageModel(spec)`.
- `lib/ai/safety-identifier.ts`: `getAiSafetyIdentifier('agent' | 'mail', id)`.
- `lib/ai/call-settings.ts`: `buildAgentCallSettings(spec, { actorId })` con
  `store: false`, identificador seudónimo y `parallelToolCalls: false`.
- `lib/ai/pricing.ts` y `lib/ai/usage.ts`: precios, costo estimado, formato
  en USD, uso normalizado, suma y costo informado por el gateway.
- `scripts/check-ai-gateway.ts` (`pnpm check:ai-gateway`), `docs/agent.md`,
  fila nueva en `AGENTS.md` y variables opcionales en `.env.template`.

## Diferencias con el plan, verificadas al instalar

- El título usa razonamiento `none`, no `minimal`: la familia gpt-5.6 acepta
  `none | low | medium | high | xhigh | max` (fichas de cada modelo en
  developers.openai.com).
- gpt-5.6 cobra la escritura de caché a 1,25 veces la entrada y el SDK la
  informa en `inputTokenDetails.cacheWriteTokens`. El uso normalizado, la
  tabla de precios y `AI_PRICE_<MODELO>` (cuarto valor opcional) la incluyen.
  `AgentUsageEvent` de la feature 39 tiene que guardar `cacheWriteTokens`.
- `MODEL_PRICES` es `Record<string, ModelPrice>` sin `null`: un id ausente es
  un modelo sin precio. La búsqueda usa `Object.hasOwn`.
- Sin `AI_GATEWAY_API_KEY`, el gateway usa el OIDC de Vercel si hay `VERCEL`
  o `VERCEL_OIDC_TOKEN` (el `.env.local` del repo ya lo trae). Si no hay
  ninguno, falla con "Falta configurar AI_GATEWAY_API_KEY".
- OpenRouter no entra por `AI_PROVIDER=gateway`, que es el Vercel AI Gateway.
- Con `AI_PROVIDER=openai`, un `AI_MODEL_<MODO>` con `/` lanza un error que
  pide el gateway, en vez de fallar en la llamada.
- `formatUsd` muestra "< US$ 0,0001" para montos menores: un turno de 20
  tokens en Luna cuesta US$ 0,00001.
- No se agregó `engines` en `package.json`, para no cambiar el deploy sin
  aviso: hay que confirmar en Vercel que el proyecto usa Node 22.x o 24.x.

## Precios cargados

Tier Standard, contexto corto, USD por millón, de
<https://developers.openai.com/api/docs/pricing> el 2026-09-18 (confirmados
en la ficha de cada modelo):

| Modelo | Entrada | Cacheada | Escritura | Salida |
| --- | --- | --- | --- | --- |
| `gpt-5.6-luna` | 0.20 | 0.02 | 0.25 | 1.20 |
| `gpt-5.6-terra` | 2.00 | 0.20 | 2.50 | 12.00 |
| `gpt-5.6-sol` | 4.00 | 0.40 | 5.00 | 20.00 |

No se modela el contexto largo (más de 272K de entrada) ni los tiers Batch,
Flex o Priority.

## Verificación

- PASS: `pnpm check:ai-gateway`. Cubre los defaults por modo, los overrides y
  los valores vacíos, el prefijo `openai/` con el gateway, los errores de
  entorno, que el identificador de `mail` coincide con
  `getMailSafetyIdentifier`, los settings con `store: false`, el costo con y
  sin precio, con cacheados y con escritura de caché, los overrides de precio,
  `normalizeUsage` con un fixture tipado como `LanguageModelUsage`,
  `readGatewayCost`, `formatUsd` y, por texto fuente, que los proveedores no se
  crean a nivel de módulo y que los módulos puros solo importan tipos del SDK.
- PASS: prueba de mutación. Cambiar Bajo a `high` y crear el gateway a nivel
  de módulo hacen fallar el check.
- PASS: `pnpm exec tsc --noEmit`, `.\init.ps1` (harness, `prisma validate` y
  ESLint completo) y `pnpm exec next build` (37 rutas).
- PASS: smoke real contra OpenAI con la clave del `.env`, un turno por modo.
  Luna `xhigh`, Terra `high`, Sol `medium` y el título con Luna `none`
  respondieron sin advertencias; `streamText` en Medio devolvió "listo". El
  uso llegó anidado como lo normaliza `normalizeUsage`. Costo total menor a
  US$ 0,001. El script temporal se borró.
- NOT RUN: turno real por el Vercel AI Gateway. El cambio de proveedor se
  verificó con el check (ids, proveedor y creación del modelo), sin llamada.
- `pnpm build` completo no se corrió: había un proceso escuchando en el puerto
  3000. Se usó `pnpm exec next build`, que no ejecuta `prisma generate`; el
  schema no cambió.

## Correcciones de la revisión (2026-09-18)

`progress/review_ai_model_gateway.md` pidió cambios.

- Bloqueante: `AI_PRICE_<MODELO>` valida cada campo con `^\d+(\.\d+)?$`
  antes de convertirlo. `",,"`, `"1,,6"`, `"1,0.1,6,"`, `"0x10,0,1"` y
  `"1e3,0,1"` lanzan el error con el nombre de la variable, en vez de un
  precio inventado.
- Con tres valores, la escritura de caché se cobra 1,25 veces la entrada,
  como en gpt-5.6: `"2,0.2,12"` da lo mismo que la tabla de Terra.
- Anotado el precio promocional de Sol ("at least through November 21,
  2026", confirmado en la página de precios) en `pricing.ts` y la doc.
- `hasGatewayCredentials(env)` separa la precondición del gateway y prueba la
  rama OIDC. La doc aclara que el token local vence a las 12 horas (doc de
  Vercel).
- No se hizo: el override del modelo del título (opcional) y `engines` en
  `package.json`, que cambia el deploy y queda para decidir.
- PASS: `check:ai-gateway`, prueba de mutación de los tres arreglos (3 de 3),
  `tsc`, `.\init.ps1` y `next build`.
- Re-revisión sobre `b6becae`: APPROVED. Quedan abiertos, sin bloquear, el
  override del título, `engines`/Node del deploy y, del smoke real, los datos
  crudos, una llamada con caché contra el panel de OpenAI y un turno por el
  gateway antes de usarlo en producción.
