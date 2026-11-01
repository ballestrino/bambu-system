// Facturación con Biller (docs/billing.md): configuración y guardas, el GET
// de solo lectura, el formato de Biller, la copia local, el resumen del mes,
// la sincronización idempotente, el borrador que repite el mes anterior y
// que el agente nunca emita (y solo arme borradores), y la emisión de a una
// sin duplicar, las notas de crédito y el vínculo receptor → trabajo (43) y
// la factura nueva (45), el agente que la completa sin emitir (46), borrar
// del borrador y archivar lo emitido (47), las vistas con filtros (48) y el
// editor lateral del borrador (49).
import "./billing-agent-checks";
import { billingConfigChecks } from "./billing-config-checks";
import { billingCorrectionChecks } from "./billing-correction-checks";
import "./billing-editor-checks";
import "./billing-filter-checks";
import "./billing-draft-checks";
import "./billing-invoice-form-checks";
import { billingIssueChecks } from "./billing-issue-checks";
import { billingNewInvoiceChecks } from "./billing-new-invoice-checks";
import { billingRemoveChecks } from "./billing-remove-checks";
import "./billing-source-checks";
import { billingSyncChecks } from "./billing-sync-checks";

Promise.all([billingConfigChecks, billingCorrectionChecks, billingIssueChecks, billingNewInvoiceChecks, billingRemoveChecks, billingSyncChecks])
  .then(() => console.log("check:billing OK"))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
