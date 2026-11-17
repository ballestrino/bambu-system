"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// El dashboard navega con su barra lateral: la barra de arriba solo queda en
// el resto de la app (inicio, login, /settings).
export function HideOnDashboard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return pathname.startsWith("/dashboard") ? null : children;
}
