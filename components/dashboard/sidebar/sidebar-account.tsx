"use client";

import { Settings } from "lucide-react";
import { useSession } from "next-auth/react";

import { openSettings } from "@/components/settings/dialog/settings-url";
import { SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { userInitials, userRoleLabel } from "@/lib/user-initials";

// Abajo: el círculo con las iniciales, el nombre y el rol (abre Cuenta) y el
// botón de Configuración. Compacta, el engranaje queda arriba del círculo.
export function SidebarAccount() {
  const { data } = useSession();
  const { isMobile, setOpenMobile } = useSidebar();
  const user = data?.user;

  const open = (section: "general" | "cuenta") => {
    if (isMobile) setOpenMobile(false);
    openSettings(section);
  };

  return (
    <SidebarFooter className="flex-row items-center gap-2 border-t border-ops-border p-3 group-data-[collapsible=icon]:flex-col-reverse group-data-[collapsible=icon]:px-0">
      <button
        type="button"
        onClick={() => open("cuenta")}
        aria-label={`Cuenta${user?.name ? ` de ${user.name}` : ""}`}
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[10px] p-1 text-left transition-colors hover:bg-ops-bamboo-soft focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none group-data-[collapsible=icon]:flex-none"
      >
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#244C2D] text-sm font-semibold text-white dark:bg-[#4C653F]"
        >
          {userInitials(user?.name, user?.email)}
        </span>
        <span className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
          <span className="truncate text-sm font-semibold text-ops-text">{user?.name || "Cuenta"}</span>
          <span className="truncate text-xs text-ops-text-muted">{userRoleLabel(user?.role)}</span>
        </span>
      </button>
      <button
        type="button"
        onClick={() => open("general")}
        aria-label="Configuración"
        title="Configuración"
        className="flex size-10 shrink-0 items-center justify-center rounded-[10px] text-ops-text-muted transition-colors hover:bg-ops-bamboo-soft hover:text-ops-bamboo-strong focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <Settings className="size-[19px]" aria-hidden />
      </button>
    </SidebarFooter>
  );
}
