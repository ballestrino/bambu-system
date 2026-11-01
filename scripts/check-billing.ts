// Facturación con Biller (docs/billing.md): configuración y guardas, el GET
// de solo lectura, el formato de Biller, la copia local, el resumen del mes,
// la sincronización idempotente, el borrador que repite el mes anterior y
// que el agente nunca emita (y solo arme borradores), y la emisión de a una
// sin duplicar, las notas de crédito y el vínculo receptor → trabajo (43) y
// la factura nueva (45) y el agente que la completa sin emitir (46).
import "./billing-agent-checks";
import { billingConfigChecks } from "./billing-config-checks";
import { billingCorrectionChecks } from "./billing-correction-checks";
import "./billing-draft-checks";
import "./billing-invoice-form-checks";
import { billingIssueChecks } from "./billing-issue-checks";
import { billingNewInvoiceChecks } from "./billing-new-invoice-checks";
import "./billing-source-checks";
import { billingSyncChecks } from "./billing-sync-checks";

Promise.all([billingConfigChecks, billingCorrectionChecks, billingIssueChecks, billingNewInvoiceChecks, billingSyncChecks])
  .then(() => console.log("check:billing OK"))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
