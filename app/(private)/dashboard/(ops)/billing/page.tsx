import { BillingPage } from "@/components/billing/billing-page";

// Emitir sigue después de responder (after) en esta función: hasta 5 minutos,
// unas 150 facturas a una por segundo con margen.
export const maxDuration = 300;

// Facturación con Biller (docs/billing.md). Solo admin: el layout privado lo
// exige y cada lectura y acción vuelve a pedir la sesión de admin.
export default function Page() {
  return <BillingPage />;
}
