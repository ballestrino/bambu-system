# Facturación

Plan del 2026-10-30 para emitir los comprobantes fiscales electrónicos (CFE)
de Bambú desde la app, con la API de Biller. Son las features 39 a 44 de
`feature_list.json`. La 39 (leer de Biller, la copia local y el resumen del
mes) está hecha; lo demás es plan. Este documento pasa a ser el contrato de la
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
- El diseño de la página sale de claude-design (ver "Brief para
  claude-design").

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

## Agente

- Una habilidad nueva, Facturación (`lib/agent/skills/facturacion.ts`), en
  la página Facturación, con su propio historial de conversaciones.
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

## Brief para claude-design

"Facturación Bambu", escritorio y teléfono, en el estilo de Operaciones.

- **Cabecera:** el mes con flechas y el distintivo Test o Producción.
- **Resumen:** facturado neto, facturas emitidas (e-Factura y e-Ticket),
  notas de crédito y un aviso de pendientes o rechazadas ante DGI, cada uno
  con la diferencia con el mes anterior.
- **Borrador:**
  - vacío: "Repetir octubre";
  - con filas: casilla, receptor, tipo, detalle, monto anterior, monto nuevo
    editable y un chip ("Precio cambiado", "Ya facturado", "Anulada");
  - barra con "N marcadas · $ total" y "Emitir N";
  - el diálogo de emitir y el progreso fila por fila.
- **Facturas del mes:** filas con estado ante DGI y PDF.
- **Agente:** una columna en el escritorio y una hoja en el teléfono; la
  tarjeta de borrador del chat.
- **Teléfono:** tarjetas con casilla y monto, y la barra de emitir fija
  abajo.

## Entorno

| Variable | Efecto |
| --- | --- |
| `BILLER_BASE_URL` | `https://test.biller.uy` o `https://biller.uy` |
| `BILLER_TOKEN` | Token de la empresa. Sin él, la página dice que no está configurada |
| `BILLER_SUCURSAL` | ID de la sucursal emisora (panel › Ajustes › Sucursales) |
| `BILLER_ISSUE_ENABLED` | `false` apaga la emisión sin tocar la lectura |
| `BILLER_ALLOW_LOCAL_PRODUCTION` | `1` permite la URL de producción en local |
| `CRON_SECRET` | Protege `/api/cron/billing-sync` |

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
- El diseño en claude-design antes de la 40.
- Permiso para leer el historial real en la 44: no escribe en Biller, pero
  guarda copias en la base de producción.
