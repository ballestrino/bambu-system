// Facturación con Biller (docs/billing.md): configuración y guardas, el GET
// de solo lectura, el formato de Biller, la copia local, el resumen del mes,
// la sincronización idempotente, el borrador que repite el mes anterior y
// que el agente nunca emita (y solo arme borradores), y la emisión de a una
// sin duplicar.
import "./billing-agent-checks";
import { billingConfigChecks } from "./billing-config-checks";
import "./billing-draft-checks";
import { billingIssueChecks } from "./billing-issue-checks";
import "./billing-source-checks";
import { billingSyncChecks } from "./billing-sync-checks";

Promise.all([billingConfigChecks, billingIssueChecks, billingSyncChecks])
  .then(() => console.log("check:billing OK"))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
