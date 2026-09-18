# Plan: Agente de Bambú con modos, habilidades y costos

## Contexto

Bambú System tiene dos usos de IA que no se hablan entre sí:

- El chat de presupuestos: `app/api/ai-chat/stream/route.ts` (Chat Completions,
  `gpt-5.2-chat-latest`, stream de texto plano, sin tools, cliente OpenAI en
  scope de módulo) + `components/ai/AIChat.tsx` (Sheet monolítico de 656
  líneas, montado en `BudgetView.tsx:76` y `create-budget/Header.tsx:33`).
  Persiste en `Chat`/`Message` con borrado y recreación total.
- El agente de correo "Luna": `lib/mail-agent/**` (Responses API,
  `gpt-5.6-luna`, `store:false`, tool `searchOfficialBudgets`, validación de
  precios contra presupuestos oficiales, memoria aprobada, auditoría).

No existe ninguna capa que decida qué modelo usar ni ningún registro de
consumo: los ids están inline en tres archivos y no se guardan tokens.

El pedido: un agente al que se le pueda pedir presupuestos, que los ajuste, que
dé consejos, que sepa del negocio y arme mails; con modos de calidad que usan
distintos modelos, informe de costo por chat, habilidades (emails,
presupuestos, consejos) y, por ahora, viviendo dentro de Presupuestos.

## Decisiones tomadas con el usuario

1. **Superficie (por ahora)**: el agente reemplaza al chat actual en el mismo
   Sheet de Presupuestos (detalle y crear). Sin ruta nueva ni entrada en el
   sidebar. La página propia queda como mejora posterior; los componentes se
   hacen independientes del host para que ese paso sea barato.
2. **Escrituras**: proponer y confirmar. Las tools que persisten nunca escriben
   durante el turno; devuelven una propuesta con Confirmar/Rechazar que ejecuta
   las actions existentes.
3. **Emails**: habilidad "Emails" que redacta correos y WhatsApp validados
   contra precios oficiales o calculados, con copiar en formato email o
   WhatsApp. Sin integración con `/dashboard/email` por ahora.
4. **Capa de modelos**: Vercel AI SDK v7. El agente de mail no se toca.
5. **Modos** (modelo + esfuerzo de razonamiento, elegibles en el chat):

   | Modo | Modelo | Reasoning |
   | --- | --- | --- |
   | Bajo | `gpt-5.6-luna` | xhigh |
   | Medio | `gpt-5.6-terra` | high |
   | Alto | `gpt-5.6-sol` | medium |

6. **Costos**: tokens y costo estimado por turno, total por conversación e
   informe mensual de gasto en IA.
7. **Habilidades**: Presupuestos, Emails, Consejos (más "General" sin
   habilidad fija). Cada una define instrucciones, tools permitidas y
   sugerencias.

Supuestos (corregir en la revisión si no aplican): el modo se guarda por
conversación, se puede cambiar en cualquier momento y aplica a los turnos
siguientes; el modo por defecto es **Medio** (`AI_DEFAULT_MODE` lo cambia); la
habilidad se elige por mensaje con chips y sin chip es General; los costos se
muestran en USD porque OpenAI factura en USD.

## Hechos verificados del AI SDK v7 (docs oficiales y npm, 2026-09-18)

- Paquetes: `ai@7.0.x`, `@ai-sdk/openai@4.x`, `@ai-sdk/react@4.x`. Node ≥ 22
  (local: 24.14.1), ESM-only, peer `zod ^3.25.76 || ^4.1.8` (repo: 4.3.5 OK),
  React 19.2 OK. Vercel AI Gateway viene dentro de `ai` (`createGateway`).
- Renombres v7 que el código debe usar: `instructions` (no `system`), `onEnd`
  (no `onFinish`), `isStepCount(n)` (no `stepCountIs`), `result.stream` (no
  `fullStream`). `toUIMessageStream({...})` y `createUIMessageStreamResponse`
  son exports top-level de `ai`. `convertToModelMessages` es async.
- `openai(modelId)` usa la Responses API. `providerOptions.openai` acepta
  `store`, `safetyIdentifier`, `reasoningEffort`, `parallelToolCalls`,
  `promptCacheKey` (tipo `OpenAILanguageModelResponsesOptions`). La opción
  top-level `reasoning: 'minimal'|'low'|'medium'|'high'|'xhigh'` es agnóstica.
- UI: `useChat` de `@ai-sdk/react` + `DefaultChatTransport` de `ai` con
  `prepareSendMessagesRequest` para mandar solo el último mensaje. Partes:
  `text`, `tool-<nombre>` con `state` en
  `input-streaming | input-available | output-available | output-error`.
- Persistencia: `toUIMessageStream({ stream: result.stream, originalMessages,
  generateMessageId: createIdGenerator(...), onEnd: ({ messages }) => ... })`.
- Uso: `result.totalUsage` suma todos los pasos (tokens de entrada, salida,
  cacheados y de razonamiento; forma exacta a confirmar al instalar).

## Arquitectura

```text
Sheet en Presupuestos (useChat) ──POST /api/agent/chat {id, message, mode, skill, context}──▶
  route (requireAdminSession, zod)
    │ runAgentTurn: streamText + tools de la habilidad + isStepCount(6)
    │   ├─ lib/ai: resolveModelSpec(mode) → modelo + reasoning (+ gateway si AI_PROVIDER=gateway)
    │   ├─ lib/agent/skills: instrucciones + allowlist de tools + sugerencias
    │   ├─ lib/agent/tools: lecturas · cálculos · propuestas · draftEmail
    │   └─ onEnd → AgentMessage.parts + AgentUsageEvent (tokens, costUsd)
Tarjeta propuesta ──confirmAgentProposal──▶ createBudget / updateBudget / duplicateBudget / publishOfficialBudget
Tarjeta email ──copiar──▶ formatChatCopy(email | whatsapp)
```

Reglas del repo que aplican: archivos ≤ 200 líneas, mutaciones en `actions/`,
lecturas en `data/`, zod en `schemas/`, helpers en `lib/`. La ruta
`/api/agent/chat` es la excepción justificada por `docs/architecture.md`
(streaming que una Server Action no puede representar), igual que la actual.

## Fase 0: prerrequisitos

- Feature 35 ocupa el único `in_progress`; 28, 36 y 37 están implementadas
  pero `pending`. Cada feature nueva va en su rama y se marca `in_progress`
  recién cuando se libere el slot. Recomendación: cerrar la 35 primero.
- `pnpm add ai @ai-sdk/openai @ai-sdk/react`. Fijar Node 22.x o 24.x en Vercel.
- Los módulos puros que usan los `scripts/check-*.ts` (modos, precios,
  cálculos, builders de propuestas, grounding, habilidades) no importan `ai`.
- Precios: tomar de la página de precios de OpenAI los valores por millón de
  tokens (entrada, entrada cacheada, salida) de `gpt-5.6-luna`,
  `gpt-5.6-terra` y `gpt-5.6-sol` al implementar. No inventarlos: si un modelo
  no tiene precio configurado, la UI muestra tokens y "precio no configurado".

## Feature 38: gateway de modelos, modos y costos (`lib/ai/**`)

Rama `feature/38-ai-model-gateway`.

| Archivo | Contenido |
| --- | --- |
| `lib/ai/modes.ts` | Puro. `AgentMode = 'bajo' \| 'medio' \| 'alto'`, `AGENT_MODES` con etiqueta y descripción para la UI, `DEFAULT_MODE_SPECS` (tabla de arriba), `TITLE_MODEL_SPEC` (`gpt-5.6-luna`, reasoning `minimal`) |
| `lib/ai/model-spec.ts` | Puro, sin SDK. `ModelSpec = { mode, provider: 'openai' \| 'gateway', modelId, reasoning, temperature? }` y `resolveModelSpec(mode, env = process.env)`, `resolveDefaultMode(env)` |
| `lib/ai/providers.ts` | Factories perezosas al estilo `lib/mail-agent/openai-client.ts`: `getOpenAIProvider()` ("Falta configurar OPENAI_API_KEY"), `getGatewayProvider()` (`AI_GATEWAY_API_KEY`), `resolveLanguageModel(spec)` → `openai.responses(id)` o `gateway(id)` |
| `lib/ai/safety-identifier.ts` | `getAiSafetyIdentifier(namespace: 'agent' \| 'mail', actorId)`; con `'mail'` da el mismo hash que `getMailSafetyIdentifier` (se asserta, el mail no cambia) |
| `lib/ai/call-settings.ts` | `buildAgentCallSettings(spec, { actorId })` → `{ model, reasoning, temperature, providerOptions: { openai: { store: false, safetyIdentifier, parallelToolCalls: false } } }` |
| `lib/ai/pricing.ts` | Puro. `MODEL_PRICES: Record<modelId, { inputPerMillion, cachedInputPerMillion, outputPerMillion } \| null>`, override `AI_PRICE_<MODELO>=entrada,cacheada,salida`, `estimateUsageCost(modelId, usage) → { costUsd: number \| null, priced: boolean }`, `formatUsd` |
| `lib/ai/usage.ts` | Puro. `normalizeUsage(totalUsage)` → `{ inputTokens, outputTokens, cachedInputTokens, reasoningTokens }` (aísla la forma del SDK); `readGatewayCost(providerMetadata)` para cuando el gateway informa costo |
| `docs/agent.md` | Contrato de producto y entorno, como `docs/email-agent.md` |
| `scripts/check-ai-gateway.ts` | `check:ai-gateway` en `package.json` |

Overrides de entorno: `AI_PROVIDER` (`openai` | `gateway`),
`AI_MODEL_<MODO>`, `AI_REASONING_<MODO>` (valor inválido lanza error),
`AI_DEFAULT_MODE`, `AI_GATEWAY_API_KEY`, `AI_PRICE_<MODELO>`. Con proveedor
`gateway` y modelo sin `/`, se antepone `openai/`.

Cómo se conecta el gateway pendiente, sin tocar código: Vercel AI Gateway u
OpenRouter vía gateway con `AI_PROVIDER=gateway` y, por ejemplo,
`AI_MODEL_ALTO=anthropic/claude-...`. Un proveedor directo nuevo (por ejemplo
`@ai-sdk/anthropic`) es un literal más en la unión `provider` y una factory.

Check: defaults por modo (Luna xhigh, Terra high, Sol medium); overrides;
prefijo `openai/` con gateway; reasoning inválido lanza; `getAiSafetyIdentifier('mail', x)`
igual al del mail; settings con `store: false`; `estimateUsageCost` con precio,
sin precio y con cacheados; `normalizeUsage` con fixture; por texto fuente,
`providers.ts` no crea el proveedor a nivel de módulo.

## Feature 39: núcleo, habilidades, persistencia y ruta de streaming

Rama `feature/39-agent-core`.

### Prisma (migración aditiva `prisma/migrations/2026MMDD120000_agent_workspace/`, estilo del repo)

- `AgentConversation { id, title, userId (Cascade), budgetId? (SetNull),
  contextKind?, mode enum BAJO|MEDIO|ALTO, lastMessageAt?, createdAt,
  updatedAt }` + índices `[userId, updatedAt]`, `[budgetId]`.
- `AgentMessage { id (lo genera el SDK), conversationId (Cascade), role enum
  USER|ASSISTANT|SYSTEM, parts Json, text @db.Text, metadata Json?, skill?,
  createdAt }` + índice `[conversationId, createdAt]`.
- `AgentUsageEvent { id, conversationId (Cascade), messageId?, kind enum
  TURN|SKILL|TITLE, mode, modelId, inputTokens, outputTokens,
  cachedInputTokens, reasoningTokens, costUsd Decimal(12,6)?, priced Boolean,
  createdAt }` + índices `[conversationId, createdAt]`, `[createdAt]`,
  `[modelId, createdAt]`. El costo se calcula al persistir, así el histórico
  no cambia cuando cambian los precios.
- `AgentProposal` (feature 40) y `AgentAuditEvent { actorId? (SetNull),
  action, entityType, entityId?, metadata Json?, createdAt }`.
- Relaciones inversas en `User` y `Budget`.
- No se reutilizan `Chat`/`Message`: `Message.content` es string obligatorio
  sin partes ni estado de tools, `Chat.budgetId` cascadea (necesitamos SetNull)
  y `saveChat` es borrar-y-recrear desde el cliente. Se dejan las tablas; se
  borran en una migración posterior cuando se retire el chat viejo.

### Conocimiento del negocio

- `lib/agent/business-profile.ts` (puro, única fuente): nombre, teléfono, web,
  UYU, IVA 22, régimen Literal E y su frase exacta, TZ, multiplicador semanal
  4.32, transporte 52 por visita, margen de productos 15, aportes BPS
  (`URUGUAY_EMPLOYER_BPS_PERCENT`, `URUGUAY_PERSONAL_BPS_BASE_PERCENT` de
  `lib/ops/finance/payroll-accruals.ts`), sueldos a mes vencido
  (`getPayrollWorkMonth`), firma. Importa las constantes existentes; el check
  asserta que coinciden con `defaultBudgetValues` y `TRANSPORTATION_PAY_PER_VISIT`.
- `lib/agent/knowledge.ts`: lee `MailMemory` con `status: APPROVED`, scope
  `ORGANIZATION | POLICY | STYLE`, `contactEmail: null`, `take: 30`, y lo
  inyecta como "Conocimiento aprobado". Reutiliza la memoria curada del mail.
- `lib/agent/system-prompt.ts`: `buildAgentInstructions({ today, actorName,
  skill, budgetContextText?, approvedKnowledge, proposalStates })`. Secciones:
  identidad y tono (español, voseo profesional, Markdown sin fences), perfil
  del negocio, política de tools (lecturas y cálculos libres; toda escritura es
  propuesta), **regla de precios** ("nunca cites un importe que no venga de
  `searchOfficialBudgets` con status exact o de un cálculo de esta
  conversación; si no hay fuente, decilo y ofrecé calcular"), **Literal E
  obligatorio** debajo de cualquier precio a cliente, la sección de la
  habilidad activa, bloque de contexto de presupuesto y bloque "Propuestas de
  esta conversación".
- `lib/agent/context.ts`: `resolveBudgetContextText(ctx)` con
  `{ kind: 'saved', budgetId }` (lectura fresca) o `{ kind: 'form', values }`,
  ambos vía `formatBudgetForAI` de `lib/format-budget.ts`.

### Habilidades (`lib/agent/skills/**`, puras)

`AgentSkill = { id, label, description, instructions, tools: AgentToolName[],
suggestions: string[] }`. Registro `AGENT_SKILLS` en `skills/index.ts`,
`resolveSkillTools(skill, allTools)` filtra la allowlist (siempre incluye
`getBusinessProfile`). Agregar una habilidad es un archivo nuevo.

| Habilidad | Instrucciones | Tools | Sugerencias |
| --- | --- | --- | --- |
| `presupuestos` | Armar desde una descripción, ajustar, comparar escenarios, proponer guardar; mostrar siempre sin/con productos y hora sin IVA | `searchBudgets`, `getBudget`, `calculateBudget`, `solveForTargetPrice`, `searchOfficialBudgets`, `listOfficialBudgets`, `getOfficialBudget`, `propose*` | "Armá un presupuesto de…", "Ajustá el margen a…", "¿Qué precio hora sale con…?" |
| `emails` | Esquema de correo migrado de `data/ai-system-message.ts`; solo importes con fuente; Literal E; versión WhatsApp más corta si se pide | `getBudget`, `searchOfficialBudgets`, `getOfficialBudget`, `calculateBudget`, `draftEmail` | "Redactá el correo con este presupuesto", "Versión WhatsApp", "Respondé pidiendo…" |
| `consejos` | Analizar números reales y recomendar; citar solo lo que devuelven las tools; explicar `missingData` | `getFinancialSnapshot`, `getFinancialTrend`, `getJobProfitability`, `getPayrollSummary`, `queryOperations`, `searchBudgets`, `getBudget` | "¿Cómo viene el mes?", "¿Qué trabajo pierde plata?", "¿Cuánto debemos de sueldos?" |
| `general` (sin chip) | Base | Todas | Mezcla de las anteriores |

### Tools (`lib/agent/tools/*.ts`, zod en `schemas/agent-tools.ts`)

`createAgentTools(ctx)` con `ctx = { actorId, conversationId, mode,
budgetContext?, evidence: Map<sourceOptionId, SearchMatch>, amounts:
Set<number>, usage: AgentUsageCollector }`. Toda `execute` devuelve
`{ ok: true, data } | { ok: false, error: { code, message } }`
(`lib/agent/tool-result.ts`, con `toPlainJson` para Decimal/Date) y cada
salida lleva un discriminador `card` que la UI usa para elegir tarjeta.

| Tool | Tipo | Función existente | Notas |
| --- | --- | --- | --- |
| `getBusinessProfile` | lectura | `BUSINESS_PROFILE` | + fecha y mes actual en Montevideo |
| `searchOfficialBudgets` | lectura | `searchOfficialBudgets` (`lib/official-budgets/search.ts`) | Los matches `exact` alimentan `ctx.evidence` y `ctx.amounts` |
| `listOfficialBudgets` / `getOfficialBudget` | lectura | `getOfficialBudgetsAction` / `getOfficialBudgetAction` (ya serializan Decimal) | |
| `searchBudgets` | lectura | `getBudgets(query, page, limit, filters)` (`data/budgets.ts`) | Filas compactas; `limit ≤ 20` |
| `getBudget` | lectura | `getBudgetBySlug` / `getBudgetById` (`data/budget.ts`) | Opciones, `formValues` y totales; siembra `ctx.amounts` |
| `calculateBudget` | cálculo | `calculateBudgetTotals`, `calculateEstimates` vía `lib/agent/budget-calculation.ts` | "¿Y si…?" puro: margen, horas, visitas, con/sin productos. Nunca persiste |
| `solveForTargetPrice` | cálculo | `calculateRevenuePercentForHourlyTarget` / `...ServiceTarget` | Devuelve `revenue_percent` y `wasClamped` |
| `getFinancialSnapshot` | lectura | `getJobClientPayments`, `getEmployeePayments`, `getOperationalCosts`, `getOpsCostSettings`, `getJobs` → `getDashboardFinancials` (`components/ops/dashboard/dashboard-financials.ts`) | Mes `YYYY-MM`, default mes actual |
| `getFinancialTrend` | lectura | `getFinanceTrend({ month, months })` | |
| `getJobProfitability` | lectura | `getJobProfitability({ jobId?, mode, month })` | Expone `missingData` |
| `getPayrollSummary` | lectura | `getEmployees`, `getEmployeePayments`, `buildPayrollRows` + `getPayrollSummary` (`components/ops/payroll/payroll-utils.ts`) | Mes trabajado = `getPayrollWorkMonth`. Visitas con `data/agent/occurrences.ts`, lector solo lectura (`getJobOccurrences` y `getVisitWeek` escriben filas) |
| `queryOperations` | lectura | `z.discriminatedUnion('kind', ...)` sobre `getJobs`, `getEmployees`, ocurrencias solo lectura, `getJobClientPayments`, `getOperationalCosts`, `getEmployeePayments` | Tope 50 filas + `truncated` |
| `draftEmail` | borrador | `generateText` con el modelo del modo actual; `validateEmailDraft` (`lib/agent/grounding.ts`) sobre `extractQuotedMoneyAmounts`, `hasUngroundedQuotedPrice`, `getGroundedPriceMismatch` de `lib/mail-agent/price-grounding.ts` | Entrada `{ brief, to?, subject?, channel: 'email' \| 'whatsapp' }`; recibe como únicos importes permitidos los de `ctx.evidence`/`ctx.amounts` y la frase Literal E; falla con `ungrounded_price \| price_mismatch \| missing_literal_e`; su uso se suma vía `ctx.usage` como `SKILL`; devuelve `{ card: 'email', channel, to, subject, body, sources, groundedAmounts }`. No persiste ni importa `lib/mail-agent/smtp` |
| `propose*` (4) | propuesta | Feature 40 | |

Cuándo NO usar cada tool va en su descripción (en español). `stopWhen:
isStepCount(6)`, `toolChoice: 'auto'`, `maxOutputTokens: 4000`.

### Ejecución, ruta y costos

- `lib/agent/grounding.ts` (puro): `collectGroundingFromMessages(uiMessages)`
  reconstruye `evidence` y `amounts` desde las partes `tool-*` persistidas,
  así el grounding sobrevive entre turnos y recargas.
- `lib/agent/run.ts`: `runAgentTurn({ uiMessages, actor, conversation, mode,
  skill, budgetContext, abortSignal })` → `streamText({
  ...buildAgentCallSettings(resolveModelSpec(mode)), instructions, messages:
  await convertToModelMessages(últimos 24), tools: resolveSkillTools(skill,
  createAgentTools(ctx)), stopWhen: isStepCount(6), abortSignal })`.
- `lib/agent/usage-collector.ts`: acumula el uso del turno y de las llamadas
  anidadas (`draftEmail`, título); `persistTurnUsage` crea los
  `AgentUsageEvent` con `estimateUsageCost` (o `readGatewayCost` si el
  gateway informa costo) y guarda en `AgentMessage.metadata` el resumen
  `{ mode, modelId, tokens, costUsd, priced }` para la UI.
- `app/api/agent/chat/route.ts` (`runtime = 'nodejs'`, `maxDuration` según el
  límite del plan de Vercel: 60, o 300 si Fluid compute está activo):
  `requireAdminSession` (403 JSON), body zod (`schemas/agent.ts`: `{ id,
  message, mode, skill, context?, trigger?, messageId? }`), upsert de
  conversación (id generado en el cliente con `generateId()` para que
  `useChat({ id })` sea estable desde el primer envío; guarda `mode`),
  persistir el mensaje de usuario con su `skill`, luego
  `createUIMessageStreamResponse({ stream: toUIMessageStream({ stream:
  result.stream, originalMessages, generateMessageId, messageMetadata, onEnd →
  persistir mensaje del asistente + `persistTurnUsage`, onError → mensaje en
  español }) })`. Título con `after()` de `next/server` en el primer turno
  (`lib/agent/conversation-title.ts`, `TITLE_MODEL_SPEC`, uso registrado como
  `TITLE`, fallback determinista).
- `data/agent/conversations.ts` (lecturas, admin, filtradas por `budgetId` o
  sin presupuesto), `data/agent/usage.ts` (`getConversationCost(id)`,
  `getMonthlyAgentCost(month)` con `groupBy` por modelo y modo, top de
  conversaciones del mes), `actions/agent/conversations.ts` (`list`, `rename`,
  `delete`, `setMode`), `lib/agent/messages.ts` (fila ↔ `UIMessage`),
  `lib/agent/audit.ts` (`recordAgentAudit`, calcado de `lib/mail-agent/audit.ts`).
- Agregar una línea a `docs/architecture.md` (Route Boundaries) nombrando
  `/api/agent/chat`.

### Check

`scripts/check-agent-tools.ts` (`check:agent-tools`): round trip
`budgetOptionToFormValues`; `runBudgetCalculation(defaults)` =
`calculateBudgetTotals(defaultBudgetValues)`; clamp de `solveTargetPrice`;
igualdades del perfil; el prompt contiene Literal E, teléfono y regla de
precios; cada habilidad solo lista tools existentes y `general` las cubre
todas; `collectGroundingFromMessages` con fixture; los cuatro casos de
`validateEmailDraft`; `queryOperations` rechaza `kind` desconocido;
`toPlainJson` convierte Decimal; el colector de uso suma `TURN` + `SKILL`; por
texto fuente: `tools/operations.ts` y `tools/finance.ts` no importan
`getJobOccurrences` ni `visit-feed`, `tools/email.ts` no importa `smtp`,
`route.ts` no importa `"openai"`.

## Feature 40: propuestas (proponer y confirmar)

Rama `feature/40-agent-proposals`.

- Prisma: `enum AgentProposalKind { CREATE_BUDGET UPDATE_BUDGET DUPLICATE_BUDGET
  PUBLISH_OFFICIAL_BUDGET }`, `enum AgentProposalStatus { PENDING EXECUTING
  CONFIRMED REJECTED EXPIRED FAILED }`, `AgentProposal { kind, status, payload
  Json, summary Json, toolCallId @unique, conversationId (Cascade), actorId
  (Restrict), resolvedAt?, result Json?, error?, expiresAt, timestamps }`.
- `lib/agent/proposals.ts` (puro): schemas de payload por tipo
  (`CREATE_BUDGET: { values: BudgetSchema }`, `UPDATE_BUDGET: { budgetId,
  newSlug, values }`, `DUPLICATE_BUDGET: { budgetId }`,
  `PUBLISH_OFFICIAL_BUDGET: { sourceBudgetId }`), `buildCreateBudgetProposal`,
  `buildUpdateBudgetProposal(existing, patch, { linkedOfficialActive })` →
  `summary { name, slug, changedFields, before, after, warnings }`,
  `PROPOSAL_TTL_MS = 24h`, `isProposalExpired`.
- `lib/agent/tools/proposals.ts`: `proposeCreateBudget` (precheck de slug con
  `getBudgetBySlug`), `proposeUpdateBudget` (carga + `budgetOptionToFormValues`
  + merge del patch; avisos: "recrea las opciones con ids nuevos" y, si hay
  oficial ACTIVE, "publica la versión oficial N+1 automáticamente"; slug solo
  cambia si cambia el nombre), `proposeDuplicateBudget` (precheck
  `userId === actorId`, porque `duplicateBudget` lo exige),
  `proposePublishOfficialBudget` (precheck de no vinculado). Devuelven
  `{ card: 'proposal', proposalId, kind, summary, warnings, totals?, expiresAt }`.
  El check asserta que este archivo no contiene `createBudget(`, `updateBudget(`,
  `duplicateBudget(`, `publishOfficialBudget(` ni `db.budget.`.
- `actions/agent/confirm-proposal.ts`: `requireAdminSession` → pertenencia →
  claim atómico `updateMany({ where: { id, status: 'PENDING', expiresAt: { gt:
  now } }, data: { status: 'EXECUTING' } })` (idempotente: `count === 0`
  devuelve el estado guardado) → re-validar payload y precondiciones →
  ejecutar `createBudget` / `updateBudget(id, newSlug, values)` /
  `duplicateBudget` / `publishOfficialBudget` → `CONFIRMED` con `result { slug,
  url }` o `FAILED` con el error → `recordAgentAudit`.
  `actions/agent/reject-proposal.ts`, `data/agent/proposals.ts`.
- Flujo ejemplo: "ajustá el margen de Limpieza Norte a 40 %" → `getBudget` →
  `calculateBudget` (tarjeta de totales) → "guardalo" → `proposeUpdateBudget`
  (tarjeta antes/después + avisos) → Confirmar → link al presupuesto.
- `scripts/check-agent-proposals.ts` (`check:agent-proposals`): builders,
  schemas, expiración, y por texto fuente que `confirm-proposal.ts` contiene
  `requireAdminSession`, `updateMany`, `status: "PENDING"` y las cuatro llamadas.

## Feature 41: el agente en el Sheet de Presupuestos

Rama `feature/41-agent-budget-sheet`. Todo bajo `components/agent/**`, ≤ 200
líneas por archivo, patrón TanStack de `components/official-budgets/**`.

- `agent-sheet-host.tsx`: Sheet `w-full sm:w-[600px]` (como el actual) con
  trigger `AIButton`; props `{ budgetId? , budgetName?, formValues? }`. Cabecera:
  título de la conversación, selector de modo (Bajo/Medio/Alto, con tooltip
  del modelo), badge de costo de la conversación (`useConversationCost`),
  botones historial / nueva conversación / cerrar. Cuerpo `<AgentChat>`.
- `agent-chat.tsx`: `{ conversationId, initialMessages, mode, skill, context,
  onSkillChange }`; empty state con las sugerencias de la habilidad activa;
  banner de error con Reintentar (`regenerate`).
- `hooks/use-agent-chat.ts`: `useChat<AgentUIMessage>({ id, messages,
  transport })`; el transport se crea una vez (`useMemo`) y lee
  `contextRef.current`, `modeRef.current` y `skillRef.current` dentro de
  `prepareSendMessagesRequest` (los valores del formulario cambian en cada
  tecla). `AgentUIMessage` se tipa con `InferUITools<ReturnType<typeof
  createAgentTools>>` solo con `import type`.
- `agent-skill-chips.tsx`: chips Presupuestos / Emails / Consejos (toggle; sin
  selección = General) sobre el composer; la habilidad viaja con el mensaje y
  se muestra como etiqueta en el mensaje del usuario.
- `agent-message-list.tsx`, `agent-message-parts.tsx` (`text` → markdown con
  `react-markdown` + `remark-gfm` y `cleanChatContent`; `tool-*` →
  `agent-tool-part.tsx`: chip con etiqueta en español y tipo
  Lectura/Cálculo/Propuesta/Borrador mientras corre, chip de error, luego la
  tarjeta según `output.card`). Cada mensaje del asistente cierra con una
  línea discreta de uso: "Terra · Medio · 3,2k tokens · US$ 0,03" (o "precio
  no configurado").
- `cards/`: `agent-budget-totals-card.tsx` (sin/con productos: horas, laboral,
  aportes, transporte, productos, sin IVA, IVA, final, hora),
  `agent-proposal-card.tsx` (resumen/diff, avisos, Confirmar/Rechazar con
  `useAgentProposalMutations`; estados Pendiente/Ejecutando/Confirmada con
  link/Rechazada/Expirada/Falló; el estado vivo sale de `useAgentProposals`),
  `agent-email-card.tsx` (para/asunto/cuerpo, fuentes, importes fundados,
  menú Copiar como email / WhatsApp / Markdown vía `getChatCopyPayload` de
  `lib/ai-chat-copy.ts`, generalizando `AssistantMessageCopyMenu.tsx`),
  `agent-finance-card.tsx`, `agent-profitability-card.tsx`, `agent-list-card.tsx`.
- `agent-composer.tsx`: `Textarea` autoajustable, Enter envía, Shift+Enter
  salto (ignorar `isComposing`), Stop mientras `submitted | streaming`,
  targets de 44 px, `pb-[env(safe-area-inset-bottom)]`.
- `agent-history-dialog.tsx` + `agent-conversation-menu.tsx`: lista de
  conversaciones del presupuesto (o sin presupuesto en crear), búsqueda,
  renombrar/borrar (lógica de `AIChat.tsx` 530-653, dividida), costo por
  conversación en cada fila.
- `agent-cost-dialog.tsx`: "Costos de IA" desde el historial: total de esta
  conversación por modelo y tipo (turno, habilidad, título), total del mes con
  desglose por modelo y modo, top 10 conversaciones del mes, aviso cuando hay
  tokens sin precio. Datos de `data/agent/usage.ts` vía `useAgentUsage`.
- `query-keys.ts`, `hooks/use-agent-conversations.ts`, `hooks/use-agent-proposals.ts`,
  `hooks/use-agent-proposal-mutations.ts`, `hooks/use-agent-usage.ts`,
  `actions/*.action.ts` (wrappers que lanzan `ValidationError`). Al confirmar:
  toast, invalidar `["budgets"]`, `["budget", slug]`, `officialBudgetKeys.all`,
  `agentKeys.proposals(id)`. Al terminar un turno: invalidar
  `agentKeys.conversations()` y `agentKeys.usage(id)`.
- Puntos de entrada: `BudgetView.tsx:76` → `<AgentSheetHost budgetId={budget.id}
  budgetName={budget.name} />` (contexto `saved`); `create-budget/Header.tsx:33`
  → `<AgentSheetHost formValues={form.watch()} />` (contexto `form`). Si en
  crear el usuario confirma `proposeCreateBudget`, se crea un presupuesto nuevo
  independiente del formulario; la tarjeta linkea al creado.
- Retiro del chat viejo en el mismo feature: borrar `components/ai/AIChat.tsx`,
  `components/ai/AssistantMessageCopyMenu.tsx`, `app/api/ai-chat/stream/route.ts`,
  `data/ai-system-message.ts` (contenido ya migrado), `actions/save-chat.ts`,
  `actions/upload-chat-image.ts`. Quedan `lib/format-budget.ts`,
  `lib/ai-chat-copy.ts`, `lib/cloudinary.ts`. Feature 7 pasa a `done` con la
  descripción "superseded by feature 41"; feature 5 se acota a Resend y
  Cloudinary y sigue `pending`.
- Mejora posterior (fuera de este plan, ya preparada por el diseño): página
  propia `/dashboard/agente` con entrada en el sidebar, reutilizando
  `AgentChat`; hand-off a `/dashboard/email`; almacén de conocimiento editable;
  adjuntar imágenes.

## Verificación

Por feature: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm harness`, `pnpm exec
next build` (no `pnpm build` con `pnpm dev` levantado, ya anotado en
`progress/current.md`), `pnpm exec prisma validate` cuando cambie el schema, y
el `check:*` propio. Registrar en `progress/impl_<feature>.md` y
`review_<feature>.md`; al cerrar, `progress/history.md` y `feature_list.json`.

Smoke autenticado (launch `bambu-dev`, puerto 3000; escritorio y 390x844 con
el iframe del mismo origen usado en la feature 36, porque `resize_window` no
cambia el viewport):

1. En un presupuesto guardado, abrir el Sheet → chip Presupuestos → "Ajustá el
   margen a 40 %" → chips de tools → tarjeta de totales; "guardalo" → tarjeta
   de propuesta con avisos → Confirmar → link al presupuesto; Rechazar en otra.
2. Cambiar el modo a Alto y enviar: la línea de uso muestra Sol y el costo; el
   badge de la conversación sube; el diálogo de costos lista el turno.
3. Chip Emails → "Redactá el correo para el cliente" → tarjeta con fuentes e
   importes fundados → Copiar como WhatsApp pega texto sin Markdown.
4. Chip Consejos → "¿Cómo viene el mes?" → tarjeta financiera con los mismos
   números que Finanzas del mes.
5. En `/dashboard/budgets/create`, el Sheet ve los valores sin guardar y un
   cambio en el formulario se refleja en el turno siguiente.
6. Recargar: historial, modo, propuestas y costos se conservan. Stop a mitad
   de stream. Error claro sin `OPENAI_API_KEY` (sin crash). Modelo sin precio
   configurado muestra tokens y el aviso.
7. Consola sin errores ni advertencias de hidratación, claro y oscuro.

## Riesgos y decisiones pendientes

- **Tiempo por turno**: Bajo usa Luna con xhigh y puede ser el modo más lento
  en un loop con tools. Mitigación: `isStepCount(6)`, salidas compactas,
  historial a 24 mensajes, título en `after()`, `maxDuration` al máximo del
  plan (verificar en Vercel; con Fluid compute Hobby permite hasta 300 s) y
  `AI_REASONING_BAJO` para bajar el esfuerzo si hace falta.
- **Ids `gpt-5.6-terra` y `gpt-5.6-sol` por `@ai-sdk/openai`**: se pasan
  como string; confirmar con un turno real por modo al instalar. Fallback:
  `AI_MODEL_<MODO>`.
- **Precios**: se cargan a mano desde la página de precios de OpenAI; un
  modelo sin precio muestra tokens y "precio no configurado". El costo es una
  estimación salvo que el gateway informe el costo real.
- **Forma de `totalUsage`**: `normalizeUsage` aísla la forma del SDK; se
  ajusta al instalar.
- **`updateBudget`** borra y recrea opciones y publica versión oficial nueva:
  se avisa en la tarjeta y en el texto de confirmación.
- **`duplicateBudget`** exige ser dueño del presupuesto: la propuesta lo
  precheckea; relajarlo a admin es tema de la feature 3.
- **Imágenes**: el chat viejo permitía adjuntar imágenes; el agente v1 no. El
  SDK soporta partes `file`, así que se puede agregar después. Si hace falta
  en v1, avisar antes de la feature 41.
- **Grounding entre turnos** depende de las partes persistidas: si se recorta
  historial la tool falla en seguro (`ungrounded_price`) y el modelo vuelve a
  buscar.
- **`createBudget`** conserva `console.log` de depuración (feature 3): no
  afecta la confirmación.
- **Exposición**: la ruta exige admin (403 JSON); `proxy.ts` ya redirige a
  login en `/api/*` no público.

## Entradas para `feature_list.json` (estilo del repo, en inglés)

- **38 `ai_model_gateway`** — "Add a provider-agnostic model gateway with
  quality modes and cost estimation". Acceptance: `ai`, `@ai-sdk/openai`, and
  `@ai-sdk/react` are added with Node 22+ and zod 4 compatibility verified ·
  `resolveModelSpec` maps Bajo to gpt-5.6-luna xhigh, Medio to gpt-5.6-terra
  high, and Alto to gpt-5.6-sol medium, with AI_PROVIDER, AI_MODEL_<MODE>,
  AI_REASONING_<MODE>, and AI_DEFAULT_MODE overrides · OpenAI and gateway
  providers initialize lazily and fail with clear errors when keys are missing
  · Shared call settings send store false and a namespaced pseudonymous safety
  identifier equivalent to the mail one · A pricing table estimates USD cost
  from normalized token usage and reports unpriced models explicitly ·
  Switching a mode to the Vercel AI Gateway or another vendor is an environment
  change only · Focused gateway checks, TypeScript, lint, and build when
  available are recorded.
- **39 `agent_core_skills_and_stream`** — "Add the agent core, skills, tools,
  usage tracking, and streaming route". Acceptance: AgentConversation,
  AgentMessage, AgentUsageEvent, and AgentAuditEvent arrive through an additive
  migration and Chat/Message stay untouched · The business profile consolidates
  company facts, IVA 22, Literal E, BPS rates, 4.32, and transport constants in
  one lib module and approved mail memories feed the prompt as read-only
  knowledge · Presupuestos, Emails, and Consejos skills define instructions,
  tool allowlists, and suggestions, and General exposes every tool · The system
  prompt is Spanish, includes the mandatory Literal E note, and forbids quoting
  prices without official or computed evidence · Read and calculation tools map
  to existing data and lib functions, return a stable ok or error shape with
  Decimal-free JSON, and never write operational rows · draftEmail writes with
  the active mode, refuses ungrounded or mismatched amounts and missing Literal
  E notes, and records official sources · /api/agent/chat requires an admin
  session, validates mode, skill, and body, persists UIMessages with parts and
  per-turn usage events with estimated cost in onEnd, and stays thin · Focused
  tool, skill, and prompt checks, Prisma validate, migration verification,
  TypeScript, lint, and build are recorded.
- **40 `agent_proposals`** — "Propose-and-confirm writes for budgets and
  official budgets". Acceptance: proposeCreateBudget, proposeUpdateBudget,
  proposeDuplicateBudget, and proposePublishOfficialBudget persist PENDING
  proposals and never write budgets during the model turn · Update proposals
  show before and after totals and warn about option recreation and automatic
  official versions · confirmAgentProposal re-validates, claims atomically,
  executes the existing actions, records result or failure, and is idempotent ·
  Rejection, expiry after 24 hours, and audit events are recorded · Focused
  proposal checks, TypeScript, lint, and build are recorded.
- **41 `agent_budget_sheet`** — "Replace the budget chat sheet with the agent,
  modes, skills, and cost reporting". Acceptance: The budget detail and create
  pages open the agent in the existing sheet with saved or unsaved form
  context · The sheet exposes the Bajo, Medio, and Alto mode selector, skill
  chips, conversation history with rename and delete, and a conversation cost
  badge · Messages render text, tool chips, budget totals, proposal, email, and
  finance cards from message parts, and each assistant turn shows model, mode,
  tokens, and estimated cost · The email card copies as email or WhatsApp
  through the existing copy formatter · The composer sends on Enter, inserts
  newlines on Shift+Enter, and can stop a stream · Proposal cards confirm or
  reject through the server actions and invalidate budget and official-budget
  queries · The AI cost dialog reports this conversation, the current month by
  model and mode, and unpriced usage · AIChat.tsx, the ai-chat stream route,
  save-chat, upload-chat-image, and ai-system-message are removed and feature 7
  is marked superseded · Loading, empty, error, desktop, and 390x844 states pass
  authenticated browser smoke with lint and build.
