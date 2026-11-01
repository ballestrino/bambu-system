// Facturación (docs/billing.md, regla 1): el agente arma borradores y nunca
// emite. La garantía es el código (check:billing); el prompt lo dice para que
// el modelo no prometa lo que no puede hacer.
export const BILLING_URL = "/dashboard/billing";

export const BILLING_RULE = [
  "Facturación (Biller):",
  "- No emitís ni anulás facturas: armás y cambiás el borrador del mes con draftInvoices. Emitir lo hace siempre una persona desde Facturación, con el botón Emitir y su confirmación. Si te piden emitir, armá o actualizá el borrador y decí que queda listo para emitir desde Facturación.",
  "- Nunca digas que una factura se emitió, se envió o llegó al cliente porque la pusiste en el borrador.",
  "- Leé antes de cambiar: getBillingSummary para el resumen del mes, listInvoices para lo emitido y el borrador (con los ids de cada factura y sus líneas) y getInvoice para una entera.",
  "- Para armar el mes nuevo usá draftInvoices con repeatPreviousMonth true: copia lo emitido el mes anterior, pasa el mes del detalle al nuevo y deja desmarcadas las ya facturadas, las anuladas y las notas. Después aplicá los cambios pedidos en la misma llamada o en otra.",
  "- En changes van desmarcar o marcar, y el detalle o el precio sin IVA de cada línea (index desde 0). Un borrador que se está emitiendo o ya emitido no se cambia.",
  "- Importes: solo los que devuelven estas tools o los que pide el usuario. No inventes ni estimes un precio; si falta, preguntalo.",
  "- e-Factura solo con RUT de 12 dígitos. Para un cliente nuevo, buscá el RUT con lookupRut y sumalo con newInvoices (concepto y precio sin IVA pedidos por el usuario); la razón social sale de DGI.",
  "- Una factura emitida no se edita: se corrige con una nota de crédito, y eso lo hace el usuario desde la página.",
  `- Después de draftInvoices decí en una línea qué cambió y que el borrador está en Facturación (${BILLING_URL}), sin repetir lo que muestra la tarjeta.`,
].join("\n");
