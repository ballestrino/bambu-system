# Facturación

Plan del 2026-10-30 para emitir los comprobantes fiscales electrónicos (CFE)
de Bambú desde la app, con la API de Biller. Son las features 39 a 44 de
`feature_list.json`. La 39 (leer de Biller, la copia local y el resumen del
mes), la 40 (la página con el resumen, lo emitido y el borrador) y la 41
(emitir el borrador) y la 42 (el agente arma borradores) están hechas; lo
demás es plan. Este documento pasa a ser el contrato de la
página a medida que se implementa.

## Objetivo

- Hoy cada factura se carga a mano en el panel de Biller, aunque el cliente ya
  esté guardado. Eso es lo que lleva tiempo.
- La página Facturación muestra el resumen del mes (lo facturado y cuántas
  facturas se emitieron) y arma el mes nuevo repitiendo el anterior como
  borrador: se marcan las que van, se cambia el precio si varió y se emiten
  todas juntas.
- El agente arma y cambia borradores. **El agente no emite ni anula.** Emitir
  lo hace siempre una persona, desde la página, con confirmación.
- El diseño de la página sale de claude-design (ver "Diseño").

## Reglas fijas

1. El agente no emite. Ninguna tool llama a `emitir` ni a `anular`. La
   escritura en Biller vive en `lib/billing/biller-issue.ts` y la acción
   `actions/billing/issue-batch.ts`. `check:billing` falla si algo de
   `lib/agent/**` o `app/api/agent/**` los importa. El prompt lo dice, pero la
   garantía es el código.
2. Se emite lo que se vio. El diálogo de emitir manda `batchId`, `updatedAt`,
   la cantidad y el total. Si el borrador cambió (el agente, otra pestaña), se
   rechaza y la página muestra el borrador nuevo.
3. No se emite dos veces. Cada factura recibe su `numeroInterno`
   (`BAMBU-<id>`) al crearse el borrador. Además hay un único por (receptor,
   mes, factura de origen). Ante un timeout o un 5xx se busca por
   `numero_interno` antes de reintentar; si no se puede saber qué pasó, queda
   `UNKNOWN`, como las propuestas `EXECUTING` viejas del agente.
4. Primero test. Hasta la 44 se usa `https://test.biller.uy`. En desarrollo
   local, una URL de producción se rechaza salvo
   `BILLER_ALLOW_LOCAL_PRODUCTION=1`. La página muestra "Test" o "Producción".
5. Una factura emitida no se edita. DGI solo admite corregirla con una nota de
   crédito (o de débito).

## Biller

Documentación: <https://biller-labs.github.io/api-docs/> y la guía para
integradores (<https://l.biller.uy/assets/guia-tecnica-integradores.pdf>).
Hay un token por empresa (`Authorization: Bearer`) y cada pedido de emisión
lleva el ID de la sucursal.

| Uso | Llamado | Notas |
| --- | --- | --- |
| Facturas de un mes | `GET /v2/comprobantes/obtener?desde=&hasta=` | Filtra por fecha de creación, `aaaa-mm-dd hh:mm:ss`. Sin ítems |
| Una factura entera | `GET /v3/comprobantes/detalle?id=` | Ítems, cliente, CAE, `estado`, adenda y `referenciado_por` (la NC que la anuló) |
| Emitir | `POST /v3/comprobantes/emitir` | Responde `{ id, serie, numero, hash }`. El estado ante DGI llega después |
| PDF | `GET /v2/comprobantes/pdf?id=` | Base64 como texto |
| Anular | `POST /v2/comprobantes/anular` | Emite una NC por el total |
| Datos de un RUT | `GET /v2/dgi/empresas/datos-entidad?rut=` | Razón social y domicilio fiscal |

- Límite: 1 llamado por segundo por token para emitir y para consultar a
  DGI; 30 por segundo para el resto. Un 429 se reintenta con espera.
- No hay webhooks. El estado ante DGI se consulta con `detalle` hasta que sea
  definitivo: al abrir la página, mientras haya pendientes, y con un cron
  diario de Vercel (`/api/cron/billing-sync`).
- Literal E: el indicador de cada ítem se copia de la factura de origen (el
  de IVA mínimo es 16). Una factura nueva toma el de la última emitida.

### Probado en test (2026-10-30)

En la empresa de prueba PEPITO 12, con emisiones por la API:

- **`numero_interno` repetido:** Biller lo rechaza con un 422,
  `Comprobantes[numero_interno]` "Número interno no puede estar repetido".
  Sirve de freno contra duplicados además del único de la base.
- **Fechas:** emitir acepta `dd/mm/aaaa` y también `aaaa-mm-dd`; acepta una
  fecha pasada (se emitió el 30/10 con fecha 15/10). Las respuestas siempre
  traen `aaaa-mm-dd`, y `fecha_creacion` viene en hora de Montevideo.
- **Orden de compra:** v3 usa `numero_compra`; mandar `numero_orden` da 422
  ("campos no soportados en la v3"). `obtener` (v2) lo devuelve como
  `numero_orden`.
- **Estados:**
  - una e-Factura arranca en "Pendiente DGI" y en unos minutos pasa a
    "Aceptado DGI";
  - un e-Ticket queda en "Envío no corresponde", que es definitivo: DGI lo
    recibe en el reporte diario.
  - El texto de un rechazo no se pudo provocar; se toma cualquier estado que
    diga "rechaz".
- **Contado o crédito:** ni `obtener` ni `detalle` lo devuelven. Al repetir
  una copia se deduce del vencimiento (con vencimiento es crédito); lo que
  emite Bambú lo guarda en `paymentForm`.
- **Anular:** emite una NC 102 con fecha de hoy. La NC trae `referencias`
  hacia el e-Ticket y el e-Ticket la trae en `referenciado_por`. `obtener` no
  trae referencias: solo `detalle`.
- **Indicador 16:** la empresa de prueba no es de IVA mínimo y lo rechaza
  ("Indicador Facturación es inválido"). El indicador depende del régimen del
  emisor; en test se usa 3.
- **Vacíos:** llegan como `[]` (por ejemplo `descripcion: []`): se pasan a
  null antes de validar.
- **`datos-entidad`:** en test devuelve siempre la misma entidad de prueba,
  sea cual sea el RUT, con los vacíos como `{}`.
- **Límites:** `obtener` informa `x-rate-limit-limit: 30`; `datos-entidad`,
  1 por segundo.

## Datos

- `InvoiceBatch`, el borrador de un mes:
  - `period`, el primer día del mes;
  - `status`: `DRAFT`, `ISSUING` o `DONE`;
  - `origin`: `REPEAT` o `AGENT`;
  - `conversationId`, si lo armó el agente;
  - quién lo creó y `updatedAt`, que sirve para el compare-and-set.
- `Invoice`, una por comprobante:
  - `origin`: `BILLER` (copiado del historial, emitido desde el panel) o `APP`;
  - `status`: `DRAFT`, `ISSUING`, `ISSUED` (pendiente ante DGI), `ACCEPTED`,
    `REJECTED` o `UNKNOWN`. Una anulada no cambia de estado: tiene una NC que
    la referencia;
  - `cfeType`, `period`, `issueDate`, `dueDate`, `currency` y `total` (lo que
    informa Biller);
  - `receiver` e `items` con la forma que pide emitir (`items` null hasta
    leer el detalle) y `receiverDocument` para buscar por cliente;
  - `references` y `referenceIds`, los ids de Biller a los que apunta (una NC
    apunta a la factura que corrige);
  - `selected`, para las que se desmarcaron en el borrador;
  - `sourceInvoiceId`, la factura del mes pasado que se repitió (único con
    `period`);
  - `internalNumber` único (`numero_interno`) y `paymentForm`;
  - lo que devuelve Biller: `billerId` único, serie, número, CAE, estado y
    fecha de creación.
- Lo que viene de Biller se guarda como copia. La fuente de verdad de lo
  emitido sigue siendo Biller, así que el resumen coincide con su panel.

## Sincronizar y resumir (feature 39)

- `lib/billing/`:
  - `biller-config` resuelve las variables y aplica la guarda de producción;
  - `biller-http` es el GET de solo lectura, con una lista de rutas permitidas
    y hasta 3 intentos ante un 429;
  - `biller-schemas` valida lo que devuelve Biller y `biller-read` arma el
    lector;
  - `invoice-mapping` pasa una fila de Biller a la copia;
  - `invoice-sync-core` y `invoice-store` sincronizan;
  - `billing-summary` arma el resumen;
  - `biller-server` (server-only) los conecta con el entorno y la base.
- `syncBillingMonth(AAAA-MM)` (`actions/billing/sync-month.ts`, solo admin):
  - trae de `obtener` lo creado entre dos meses antes y el mes siguiente,
    porque `obtener` filtra por creación y no por emisión;
  - guarda cada comprobante por su `billerId` (o su `numero_interno`, para
    reconciliar uno de Bambú sin respuesta);
  - pide `detalle` solo de los que todavía no tienen ítems.
  - Correrla dos veces actualiza en vez de duplicar. Un detalle que falla deja
    la fila sin ítems para la próxima vez.
- `getBillingMonthSummary(AAAA-MM)` (`data/billing/summary.ts`): resumen del
  mes contra el anterior, por fecha de emisión:
  - neto (facturas y notas de débito menos notas de crédito);
  - cantidad de facturas, por e-Factura y e-Ticket;
  - notas de crédito;
  - pendientes y rechazadas.
  - Los borradores y los rechazos no suman.
- Smoke: `pnpm exec tsx scripts/smoke-billing-sync.ts 2026-10` sincroniza dos
  veces contra Biller test y la base de `.env` y muestra el resumen. Se niega
  si Biller no es test.
- `check:billing`: guardas, GET, formato, copia, resumen, sincronización y
  que nada del agente importe la emisión.

## Página Facturación

`/dashboard/billing`, con el selector de mes de operaciones.

- **Resumen del mes:**
  - facturado neto (facturas menos notas de crédito);
  - facturas emitidas en el mes, en total y por tipo;
  - notas de crédito;
  - pendientes y rechazadas ante DGI;
  - la comparación con el mes anterior.
  - Se cuenta por fecha de emisión e incluye lo emitido desde el panel de
    Biller.
- **Facturas del mes:** receptor, detalle, total, estado ante DGI y PDF.
- **Borrador del mes.** "Repetir octubre" crea el borrador de noviembre:
  - **Se copia:** tipo, receptor, ítems con su indicador, adenda y forma de
    pago.
  - **Se ajusta:** el mes del detalle ("octubre 2026" pasa a "noviembre
    2026"); la fecha de emisión pasa a ser el día en que se emite; el
    vencimiento mantiene los mismos días.
  - **Arrancan desmarcadas:** las ya facturadas en el mes nuevo, las anuladas
    y las notas de crédito.
  - **Se edita:** las casillas, el precio (una factura de varias líneas se
    abre para editar cada línea) y el detalle.
  - **Emitir N:** un diálogo con la cantidad y el total. Las facturas salen de
    a una y cada fila muestra su serie y número, después su estado y el PDF.
  - Los mails los manda Biller a los que tiene guardados para cada cliente,
    como hoy.
- **Nueva factura** (`/dashboard/billing/new`): el formulario entero. Se
  guarda en el borrador del mes o se emite sola en el momento.
- **Editar una factura del borrador** (`/dashboard/billing/draft/[id]`): el
  mismo formulario, con lo que cambió contra el mes pasado y quién lo cambió
  (el agente o una persona). Guardar, emitir solo esa o quitarla del borrador.
- **Nota de crédito** (`/dashboard/billing/[id]/credit-note`): sale de una
  factura emitida. Por el total o parcial, con la razón; no supera el total
  de la factura. Se emite al confirmar y no queda en borrador. Por el total
  puede usar `anular`; parcial es `emitir` con tipo 102 o 112 y `referencias`.
- Emitir una sola (nueva, del borrador o nota de crédito) sigue la regla 2:
  manda `updatedAt` y el total que se vio.

### Lo hecho en la 40

- Ruta `app/(private)/dashboard/(ops)/billing`, con el selector de mes de
  Operaciones y "Facturación" en la navegación (`components/ops/nav-items.ts`).
  La UI está en `components/billing/`.
- Al abrir un mes la página lo sincroniza con Biller (`syncBillingMonth`, a lo
  sumo cada 2 minutos por mes, y con el botón de actualizar) y relee la copia.
  Todo lo que muestra sale de `getBillingMonthView` (`data/billing/month.ts`).
- `repeatBillingMonth` (`actions/billing/repeat-month.ts`) sincroniza el mes y
  el anterior y llama a `createRepeatDraft` (`lib/billing/draft-store.ts`):
  - un `pg_advisory_xact_lock` por mes antes de buscar el borrador abierto
    (`DRAFT` o `ISSUING`), así que repetir dos veces abre el mismo, sin
    migración;
  - `buildRepeatDraft` (`lib/billing/draft-repeat.ts`, puro) arma las filas;
    `moveMonthInText` pasa "octubre 2026", "octubre de 2026", "octubre" solo y
    "10/2026" al mes nuevo en el concepto, la descripción y la adenda;
  - cada factura recibe `internalNumber` `BAMBU-<id>` en la misma transacción.
- Qué arranca desmarcado se calcula de nuevo al leer (`getRepeatSkip`), así
  que una anulación o una factura emitida desde el panel después de repetir
  mueve la fila a "No van este mes" sin cambiar su casilla.
- `updateDraftInvoice` (`actions/billing/update-draft-invoice.ts`) cambia la
  casilla o el concepto y el precio de una línea con compare-and-set sobre el
  `updatedAt` de la factura y toca el del borrador. La página manda los cambios
  de una fila de a uno (scope de TanStack Query) con el último `updatedAt`.
- Montos: cada fila muestra el subtotal sin IVA (cantidad por precio, con
  descuento y recargo) del mes pasado y del nuevo, que es lo que se edita. El
  total con IVA (`lib/billing/invoice-totals.ts`: indicador 2 al 10 %, 3 al
  22 %, el resto sin IVA, como el 16 de Literal E) va debajo de la forma de
  pago y es lo que suma la barra. Con el indicador 16 los dos coinciden.
- El detalle es el concepto de cada línea: en una factura de una línea se
  edita en la fila; en una de varias, al abrir sus líneas.
- La forma de pago y los días de crédito salen de la factura de origen.
- Quedan para después: el agente y su aviso en la página (42), "Nueva
  factura", "Agregar factura", "Editar todos los campos" y la nota de crédito
  (sus páginas no tienen feature todavía, salvo la NC en la 43).
- Smoke: `pnpm exec tsx scripts/smoke-billing-draft.ts 2026-11` sincroniza,
  repite tres veces a la vez, edita y prueba el `updatedAt` viejo; borra el
  borrador salvo con `--keep`.

### Emitir (feature 41)

- **Diálogo.** "Emitir N" abre un diálogo con las facturas marcadas que
  siguen en borrador, el total, la fecha de emisión (hoy en Montevideo) y si
  es test o producción. Confirmar manda `batchId`, el `updatedAt` del
  borrador, la cantidad y el total (`issueBillingBatch`,
  `actions/billing/issue-batch.ts`, solo admin).
- **Tomar el borrador** (`claimBatchIssue`, `lib/billing/issue-claim.ts`):
  con un `pg_advisory_xact_lock` por borrador compara el `updatedAt`, la
  cantidad y el total; si algo cambió responde "El borrador cambió" y la
  página relee. Si coincide, pasa esas facturas y el borrador a `ISSUING`.
  Un doble clic o una segunda pestaña encuentran `ISSUING` y no emiten. Cada
  cambio de una fila deja su `updatedAt` también en el borrador, y la página
  lo toma, así un cambio propio no hace fallar el diálogo.
- **Emitir de a una** (`runBatchIssue`, `lib/billing/issue-run.ts`): sigue
  después de responder (`after`, la página tiene `maxDuration` 300 s). Una
  cada 1,1 s, con su `numero_interno`:
  - `issue-payload` arma el pedido: fecha de emisión de hoy, vencimiento con
    los mismos días que la factura de origen (crédito), sin nulls y `"-"`
    como cliente de un e-Ticket sin receptor. Antes de llamar a Biller
    frena una e-Factura sin RUT de 12 dígitos, sin ítems o sin montos, y una
    nota de crédito o débito marcada (necesita la factura que corrige: eso es
    la nota de crédito de la 43);
  - `biller-issue.ts` es el único POST (`/v3/comprobantes/emitir`) y
    reintenta solo un 429;
  - un timeout, un 5xx o una respuesta ilegible: espera 1,5 s y busca por
    `numero_interno` (`obtener` con la ventana de creación, porque sin
    `desde` toma solo hoy). Si está, se toma ese; si no, se reenvía una
    sola vez; si sigue sin saberse, queda `UNKNOWN`;
  - un 422 de `numero_interno` repetido también se busca y se toma;
  - un rechazo de datos vuelve la factura al borrador con el error (la fila
    lo muestra) y sigue con las demás; sin token o sin permiso se frena todo.
  - Al terminar, el borrador queda `DONE` si se emitió todo, `DRAFT` si
    quedó algo sin emitir o sin confirmar, o `ISSUING` si algo quedó a medio
    (la función se cortó).
- **Avance.** Mientras el borrador está en `ISSUING` la página lo relee cada
  1,5 s y el diálogo muestra cada factura: "Emitiendo", su serie y número con
  el estado ante DGI, o por qué no salió. Se puede cerrar: sigue emitiendo.
  Cada fila emitida queda bloqueada con su número, su estado y el PDF.
- **Cortada o sin confirmar.** Si el borrador lleva 3 minutos en `ISSUING`
  sin novedades, o hay facturas `UNKNOWN`, la página ofrece "Continuar" o
  "Reintentar" (`resumeBillingIssue`): las vuelve a la cola. Reenviar no
  duplica, porque Biller rechaza el `numero_interno` repetido.
- **Estado ante DGI.** Se lee del `estado` de `obtener` (el mismo de
  `detalle`, en un solo llamado) con la sincronización del mes: cada 20 s
  mientras algo del mes o del borrador está pendiente, al terminar una
  emisión y con el cron diario `/api/cron/billing-sync` (`vercel.json`,
  10:00 UTC, `CRON_SECRET`), que copia el mes actual y el anterior. La
  sincronización encuentra por `numero_interno` lo que quedó `UNKNOWN` y
  ya no cambia el período de una factura copiada (una del borrador queda en
  el mes del borrador).
- **PDF.** `/api/billing/invoices/[id]/pdf` (solo admin) lo pide a Biller
  (`/v2/comprobantes/pdf`, base64) y lo abre en el navegador. Está en las
  filas emitidas del borrador y en "Emitidas".
- **Apagado.** `BILLER_ISSUE_ENABLED=false` (o `0`, `off`) deshabilita el
  botón y la acción; la lectura sigue.
- **Fecha.** Se emite con la fecha del día. Un borrador de noviembre emitido
  el 30 de octubre cuenta en el resumen de octubre, que es por fecha de
  emisión; en el borrador de noviembre se ve emitido igual.
- Smoke: `pnpm exec tsx scripts/smoke-billing-issue.ts 2026-11 101` deja
  marcadas solo las de ese tipo, prueba el `updatedAt` viejo, otra cantidad
  y el doble clic, emite, simula una respuesta perdida (reintento sin
  duplicar), espera el estado final y baja el PDF. Emite en Biller test.

### Formulario de factura

Los campos de `POST /v3/comprobantes/emitir` que usa Bambú, por sección:

- **Comprobante:** tipo (e-Factura 111, e-Ticket 101, nota de crédito
  112/102, nota de débito 113/103), fecha de emisión (hasta dos meses a
  futuro), forma de pago y vencimiento si es crédito, moneda y tasa de cambio
  (vacía: la del cierre anterior), orden de compra (`numero_compra`) y
  `montos_brutos` (precios con IVA).
- **Cliente:** buscar uno guardado o una factura anterior; tipo y número de
  documento, consulta a DGI si es RUT, razón social (o nombre si no es RUT),
  nombre de fantasía, dirección, ciudad, departamento, país, emails (con
  `sustituir_emails`) e información adicional. Un e-Ticket admite consumidor
  final sin datos.
- **Ítems:** concepto, cantidad, unidad, precio e indicador de IVA; en "Más
  campos", descripción, código, descuento, recargo, GTIN-13 e indicador de
  agente responsable.
- **Descuentos y recargos globales:** tipo, glosa, `$` o `%`, valor e
  indicador.
- **Referencias** (notas de crédito y débito): comprobantes puntuales o
  `referencia_global`, con `razon_referencia`.
- **Adenda y envío:** adenda, información adicional (150), lugar de entrega,
  emails solo para esta vez (`emails_notificacion`) y pagos a terceros.
- Quedan afuera los campos de exportación, CAE especial, complemento fiscal y
  retenciones o percepciones.
- La columna de resumen muestra el neto y el IVA por indicador, el total, lo
  que falta para emitir (e-Factura solo con RUT de 12 dígitos, un ítem con
  precio, la razón de una nota), el número interno y la sucursal.

## Agente

### Lo hecho en la 42

- **Habilidad Facturación** (`lib/agent/skills/facturacion.ts`): la usa el
  panel del agente de Facturación (`components/billing/billing-agent.tsx`). Las
  tools de facturación también están en General, con la misma regla.
- **Historial propio:** las conversaciones del panel se crean con
  `contextKind` `billing` (sin migración) y el historial las filtra con el
  scope `billing`; las "sin presupuesto" del Sheet de crear ya no las
  muestran. El panel retoma la última, como el Sheet de un presupuesto. En la
  página del agente se ven todas, con "Facturación" como contexto.
- **Contexto del turno:** `{ kind: "billing", month }`, el mes del selector.
  Las tools toman ese mes cuando el pedido no dice otro.
- **Lecturas** (`lib/agent/tools/billing.ts`): `getBillingSummary` y
  `listInvoices` leen `getBillingMonthView`, lo mismo que la página, después
  de copiar el mes de Biller (a lo sumo cada 2 minutos por mes; si Biller no
  responde, avisan y leen la copia). `listInvoices` trae el id de cada factura
  y sus líneas con `index`. `getInvoice` lee una factura entera de la copia
  (`data/billing/invoice.ts`) y `lookupRut`, `datos-entidad`.
- **`draftInvoices`** (`lib/agent/tools/billing-draft.ts`), sin tarjeta de
  confirmación:
  - `repeatPreviousMonth` usa `createRepeatDraft` (con `origin` AGENT y la
    conversación), así que repetir con un borrador abierto abre ese;
  - `changes` marca o desmarca y cambia detalle o precio sin IVA por línea;
  - `newInvoices` suma una e-Factura al contado con el RUT pedido y la razón
    social y el domicilio de DGI, con el indicador de la última emitida. Un
    RUT que ya está en el borrador se rechaza.
  - `applyAgentDraft` (`lib/billing/agent-draft-store.ts`, con el plan puro en
    `agent-draft-plan.ts`) toma el lock del mes y el del lote (el mismo de
    "Emitir"), rechaza un lote en `ISSUING` o `DONE` y una factura que ya no
    es borrador, y mueve el `updatedAt` del lote. Un diálogo de "Emitir"
    abierto antes del cambio recibe "El borrador cambió" y la página relee.
  - Audita `invoice_draft.create` (lote nuevo) e `invoice_draft.update`
    (cambios) en `AgentAuditEvent`.
- `listInvoices` dice en `state` si una fila del borrador sale al emitir,
  está desmarcada o ya se emitió (con su serie y número), y manda `selected`
  solo en las que siguen en borrador: en la prueba real el modelo leía como
  "marcadas" las ya emitidas.
- **Tarjetas del chat** (`components/agent/cards/agent-billing-card.tsx`):
  "Borrador de noviembre · N facturas · $ X" con lo que cambió y "Abrir en
  Facturación" (elige el mes del borrador en el selector), sin botón de
  emitir; y el resumen del mes. `listInvoices` usa la tarjeta de listas.
- **La página ve el cambio:** al terminar cada turno `refreshAfterTurn`
  relee el mes de Facturación.
- **Panel:** en escritorio, "Agente" en la cabecera abre un panel flotante
  arriba a la derecha (400 px, hasta 640 px de alto) que no tapa la página ni
  se cierra al tocarla; en el teléfono, un botón flotante abre una hoja de
  92 % del alto.
- **`BILLING_RULE`** (`lib/agent/billing-rule.ts`) entra al prompt de toda
  habilidad con `draftInvoices`.
- **La garantía es el código:** `check:billing` recorre los imports (también
  los indirectos) de `lib/agent/**`, `app/api/agent/**`,
  `components/agent/**` y el panel, y falla si alguno llega a
  `biller-issue`, `biller-issue-server`, `issue-run` o
  `actions/billing/issue-*`; una cadena de prueba confirma que el chequeo la
  encuentra.
- Smoke sin modelo: `pnpm exec tsx scripts/smoke-billing-agent.ts 2026-11`
  repite (abre el mismo), cambia precio y casilla, suma un RUT, prueba lo
  emitido, el RUT repetido, un lote en `ISSUING` y "Emitir" con el
  `updatedAt` de antes del cambio, y restaura salvo con `--keep`. No emite.
- Turno real (2026-10-30, Haiku 5.5 Alto, Biller test): pedirle que emita
  termina sin ninguna factura en Biller y con el borrador en Facturación;
  la tarjeta del borrador no tiene botón de emitir y la página muestra el
  cambio al terminar el turno.

### Plan

- Es el agente de siempre, con todas sus tools (visitas, trabajos, finanzas,
  presupuestos), más la habilidad nueva Facturación
  (`lib/agent/skills/facturacion.ts`), elegida por defecto en las páginas de
  Facturación, con su propio historial de conversaciones.
- Tools de lectura: `getBillingSummary` (el resumen de un mes),
  `listInvoices`, `getInvoice` y `lookupRut`.
- `draftInvoices` crea o cambia el borrador del mes. Puede:
  - repetir el mes pasado;
  - desmarcar facturas;
  - cambiar precios o el detalle;
  - sumar una factura para un cliente nuevo (con `lookupRut`).
  - No toca un borrador en `ISSUING` o `DONE`.
- Escribe el borrador sin una tarjeta de confirmación: un borrador no es
  fiscal y la confirmación es emitir. Cada cambio queda auditado
  (`invoice_draft.create` e `invoice_draft.update`).
- La tarjeta del chat dice "Borrador de noviembre · 5 facturas · $ X", lo que
  cambió y "Abrir en Facturación". No tiene botón de emitir.
- `BILLING_RULE`:
  - no emitís ni anulás: armás borradores;
  - importes solo desde una tool o pedidos por el usuario;
  - e-Factura solo con RUT;
  - una factura emitida se corrige con nota de crédito, y eso lo hace el
    usuario en la página.

## Diseño

Lienzo de claude-design "Facturación Bambú"
(<https://claude.ai/artifact/Q8dW34WPdvGgsCoxH1L9m7>, privado). Se eligió
la alternativa B en escritorio y en teléfono (2026-10-30); las A quedan como
referencia. Los colores, radios y la letra son los de Operaciones
(`ops-theme.ts`, Geist).

- **Escritorio, Facturación del mes:** barra lateral de íconos; cabecera con
  el mes, el distintivo Test o Producción, "Nueva factura" y "Agente".
  - Resumen en un panel: el neto grande con la diferencia contra el mes
    anterior y una barra de lo emitido contra lo que está en el borrador; al
    costado, facturas emitidas por tipo, notas de crédito y pendientes ante
    DGI.
  - Pestañas "Borrador N/M" y "Emitidas N".
  - El borrador separa "Para emitir" y "No van este mes" (ya facturadas,
    anuladas). Cada fila: casilla, receptor (abre la edición), tipo, detalle
    editable, monto anterior → monto nuevo editable y un chip. Una factura de
    varias líneas abre sus líneas.
  - Barra flotante oscura con "N marcadas · $ total" y "Emitir N". El diálogo
    lista las facturas y muestra el progreso de cada una adentro.
  - Las emitidas tienen estado ante DGI, "Nota de crédito" y PDF.
- **Teléfono, Facturación del mes:** resumen en una tarjeta verde oscura,
  conmutador Borrador / Emitidas, lista densa con casilla y monto; tocar una
  fila abre una hoja para el monto y el detalle, con "Editar todos los
  campos". Botón "Emitir N · $ total" a todo el ancho, sobre las pestañas.
- **Nueva factura, editar borrador y nota de crédito:** un mismo formulario
  en escritorio (dos columnas, resumen fijo a la derecha) y en teléfono
  (tarjetas, "Dirección y emails" y "Más campos" plegados, total y botón
  fijos abajo). En teléfono las páginas del formulario ocultan las pestañas.
- **Agente:** el mismo componente en todas las páginas, con la cabecera, los
  chips de tools y el composer actuales.
  - En escritorio es un panel flotante arriba a la derecha (400 px, alto
    hasta 640 px), por encima del contenido y sin ocupar todo el alto.
  - En teléfono es un FAB abajo a la derecha que abre una hoja casi a
    pantalla completa.
  - La tarjeta de borrador del chat no tiene botón de emitir.

## Entorno

| Variable | Efecto |
| --- | --- |
| `BILLER_BASE_URL` | `https://test.biller.uy` o `https://biller.uy` |
| `BILLER_TOKEN` | Token de la empresa. Sin él, la página dice que no está configurada |
| `BILLER_SUCURSAL` | ID de la sucursal emisora (panel › Ajustes › Sucursales) |
| `BILLER_ISSUE_ENABLED` | `false` apaga la emisión sin tocar la lectura |
| `BILLER_ALLOW_LOCAL_PRODUCTION` | `1` permite la URL de producción en local |
| `CRON_SECRET` | Protege `/api/cron/billing-sync`; Vercel lo manda como `Bearer` en su cron |

## Pendiente del usuario

- Confirmar que hoy facturan desde el panel de Biller y con qué plan.
- Acceso a la API en producción: el panel de test dice que "fuera del ambiente
  de test, el uso de la API es exclusivo del plan Estándar". En la web el plan
  con API figura como Grande (UYU 1.310 + IVA por mes). Confirmar con Biller
  (contacto@biller.uy) cuál es y su precio.
- Test (2026-10-30): la cuenta de test trae la empresa PEPITO 12 con el RUT de
  prueba de DGI 207949890065, sucursal 928, ya habilitada. Las variables
  `BILLER_*` están en `.env`. Tiene comprobantes de prueba de octubre: una
  e-Factura, un e-Ticket y la NC que lo anula.
- Diseño: hecho el 2026-10-30 (B en escritorio y teléfono, ver "Diseño").
- Permiso para leer el historial real en la 44: no escribe en Biller, pero
  guarda copias en la base de producción.
