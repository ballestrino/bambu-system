"use client";

import { LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import type { ReactNode } from "react";

import { TwoFactorToggle } from "@/components/auth/TwoFactorToggle";
import ChangeEmail from "@/components/settings/account/change-email";
import ChangeName from "@/components/settings/account/change-name";
import ChangePasswordDialog from "@/components/settings/security/change-password-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { userInitials, userRoleLabel } from "@/lib/user-initials";

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-ops-border py-4">
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-[13px] text-ops-text-muted">{hint}</p>}
      </div>
      <div className="text-sm text-ops-text-muted">{children}</div>
    </div>
  );
}

// Lo que antes estaba en /settings: nombre, correo, contraseña, 2FA y salir.
export function SettingsAccount() {
  const { data, status } = useSession();
  const user = data?.user;

  if (status === "loading") {
    return <Skeleton className="h-64 w-full rounded-xl" aria-label="Cargando la cuenta" />;
  }
  if (!user) {
    return <p className="text-sm text-ops-text-muted">No hay una sesión abierta.</p>;
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3.5 border-b border-ops-border pt-1.5 pb-5">
        <span
          aria-hidden
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#244C2D] text-xl font-semibold text-white dark:bg-[#4C653F]"
        >
          {userInitials(user.name, user.email)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{user.name || "Sin nombre"}</p>
          <p className="text-[13px] text-ops-text-muted">{userRoleLabel(user.role)}</p>
        </div>
      </div>

      <Row label="Nombre">
        <ChangeName user={user} />
      </Row>
      <Row label="Correo electrónico">
        <ChangeEmail user={user} />
      </Row>
      <Row label="Contraseña" hint="Al cambiarla se cierran las sesiones abiertas.">
        <ChangePasswordDialog user={user} />
      </Row>
      <TwoFactorToggle
        initialEnabled={user.isTwoFactorEnabled ?? false}
        className="rounded-none border-0 border-b border-ops-border bg-transparent px-0 py-4"
      />

      <div className="pt-5">
        <button
          type="button"
          onClick={() => signOut()}
          className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-red-200 px-3.5 text-[13px] font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none dark:border-red-400/35 dark:text-red-300 dark:hover:bg-red-500/10"
        >
          <LogOut className="size-4" aria-hidden />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
