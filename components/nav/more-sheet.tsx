"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { moreNavGroups } from "@/components/dashboard/dashboard-nav";
import { dashboardTools } from "@/components/dashboard/dashboard-tools";
import { openSettings, settingsPath } from "@/components/settings/dialog/settings-url";
import { SignOutButton } from "@/components/settings/sign-out-button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { ExtendedUser } from "@/next-auth";

const itemClass =
  "flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-accent";
const activeItemClass =
  "border-transparent bg-[#244C2D] text-white hover:bg-[#244C2D] dark:bg-[#4C653F]";
const sectionTitleClass =
  "mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";

type MoreSheetProps = {
  children: ReactNode;
  user?: ExtendedUser;
};

export function MoreSheet({ children, user }: MoreSheetProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const close = () => setOpen(false);
  // Configuración es el diálogo del dashboard (tema, cuenta, memoria e
  // instrucciones); fuera del dashboard se entra a él con el diálogo abierto.
  const openConfig = () => {
    close();
    if (pathname.startsWith("/dashboard")) openSettings("general");
    else router.push(settingsPath("/dashboard"));
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] gap-0 rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
      >
        <SheetHeader className="pb-2">
          <SheetTitle>Más</SheetTitle>
          <SheetDescription className="sr-only">
            Otras secciones, herramientas y cuenta
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 pb-4">
          {moreNavGroups.map((group) => (
            <section key={group.label}>
              <h3 className={sectionTitleClass}>{group.label}</h3>
              <div className="grid grid-cols-2 gap-2">
                {group.items.map((item) => (
                  <Link
                    key={item.url}
                    href={item.url}
                    onClick={close}
                    className={cn(itemClass, item.match(pathname) && activeItemClass)}
                  >
                    <item.icon className="size-4 shrink-0" />
                    {item.title}
                  </Link>
                ))}
              </div>
            </section>
          ))}

          <section>
            <h3 className={sectionTitleClass}>Herramientas</h3>
            <div className="grid grid-cols-2 gap-2">
              {dashboardTools.map((tool) => (
                <Dialog key={tool.title}>
                  <DialogTrigger asChild>
                    <button type="button" className={itemClass}>
                      <tool.icon className="size-4 shrink-0" />
                      {tool.title}
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">{tool.content}</DialogContent>
                </Dialog>
              ))}
            </div>
          </section>

          <section className="space-y-3 border-t pt-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user?.name || "Usuario"}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={openConfig} className={itemClass}>
                <Settings className="size-4 shrink-0" />
                Configuración
              </button>
              <SignOutButton />
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
