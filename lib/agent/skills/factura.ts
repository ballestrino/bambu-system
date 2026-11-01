import { BILLING_URL } from "@/lib/agent/billing-rule";
import type { AgentSkill } from "@/lib/agent/skills/types";

// La habilidad de Nueva factura (feature 46, docs/billing.md): completa el
// formulario que el usuario tiene abierto. No emite ni guarda: fillInvoiceForm
// solo cambia los campos de la página y los botones los toca una persona
// (check:billing garantiza que el agente no llega al código que emite).
export const facturaSkill: AgentSkill = {
  id: "factura",
  label: "Nueva factura",
  description: "Completa el formulario de Nueva factura: cliente, ítems, forma de pago y adenda.",
  instructions: [
    "Habilidad activa: Nueva factura. Trabajás dentro del formulario de Nueva factura que el usuario tiene abierto; el contexto trae lo que ya tiene cargado y lo que falta para emitir.",
    "- Completás el formulario con fillInvoiceForm. Cada campo null no cambia; items reemplaza todas las líneas, así que mandá también las que quedan.",
    "- No emitís ni guardás. Emitir lo hace el usuario con Emitir ahora (y su confirmación) o Guardar en el borrador, en la misma página. Nunca digas que la factura se emitió, se guardó o llegó al cliente.",
    "- Cliente: si nombra uno conocido, buscalo con findBillingClient y pasá su documento en clientDocument (carga los datos de su última factura). Un RUT nuevo también va en clientDocument: los datos salen de DGI. Si hay más de un cliente parecido, preguntá cuál.",
    "- \"Lo mismo que la última vez\": findBillingClient da lastInvoiceId; leé la factura con getInvoice y copiá sus líneas, con el mes del detalle pasado al actual si el detalle nombra un mes.",
    "- e-Factura solo con RUT de 12 dígitos; a una persona sin RUT, e-Ticket (con CI o consumidor final).",
    "- Importes: los precios van SIN IVA y salen de una tool (una factura anterior, un presupuesto) o del usuario. No inventes ni estimes un precio: si falta, preguntalo. Si el usuario da un importe con IVA, decilo y preguntá antes de usarlo.",
    "- El indicador de IVA de cada línea: dejalo en null (usa el del formulario, el de la última factura emitida) salvo que el usuario pida otro.",
    "- Fechas: se factura del 1 al 10. El formulario ya trae la emisión (hoy, o el 1 del mes si se factura un mes que no empezó) y el vencimiento: el 10 del mes de emisión, o a 5 días si se emite después del 10. Cambialas solo si el usuario lo pide.",
    "- Crédito: payment credito con creditDays (los días que pida el usuario; null deja el vencimiento de la regla). Las facturas van a crédito por defecto; contado solo si el usuario lo pide.",
    `- Al terminar, decí en una o dos líneas qué completaste y, si la tarjeta muestra lo que falta, qué falta. Después el usuario la emite desde esta página (o desde Facturación, ${BILLING_URL}, si la guarda en el borrador). No repitas lo que muestra la tarjeta.`,
  ].join("\n"),
  tools: [
    "fillInvoiceForm",
    "findBillingClient",
    "getInvoice",
    "lookupRut",
    "listInvoices",
    "getBillingSummary",
    "searchBudgets",
    "getBudget",
    "searchMemory",
    "proposeMemory",
    "proposeInstructionChange",
  ],
  suggestions: [
    "Facturale a Los Pinos lo mismo que la última vez",
    "e-Ticket a consumidor final por $ 2.000 sin IVA de limpieza",
    "Pasala a crédito a 30 días",
  ],
};
