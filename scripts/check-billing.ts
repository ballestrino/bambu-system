// Facturación con Biller (docs/billing.md): configuración y guardas, el GET
// de solo lectura, el formato de Biller, la copia local, el resumen del mes,
// la sincronización idempotente y que el agente nunca emita.
import { billingConfigChecks } from "./billing-config-checks";
import "./billing-source-checks";
import { billingSyncChecks } from "./billing-sync-checks";

Promise.all([billingConfigChecks, billingSyncChecks])
  .then(() => console.log("check:billing OK"))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
