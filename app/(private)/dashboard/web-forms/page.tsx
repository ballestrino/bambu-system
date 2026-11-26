import { Suspense } from "react";

import { WebFormsPage } from "@/components/web-forms/web-forms-page";

export const metadata = { title: "Formularios web" };

// Formularios de la web pública: leerlos y responderlos por correo.
export default function WebFormsRoute() {
  return (
    <Suspense fallback={null}>
      <WebFormsPage />
    </Suspense>
  );
}
