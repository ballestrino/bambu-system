"use client";

import Link from "next/link";
import { Ellipsis, type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";

import { bottomTabItems } from "@/components/dashboard/dashboard-nav";
import { MoreSheet } from "@/components/nav/more-sheet";
import { cn } from "@/lib/utils";
import type { ExtendedUser } from "@/next-auth";

const tabClass =
  "flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors";

function TabContent({ active, icon: Icon, title }: { active: boolean; icon: LucideIcon; title: string }) {
  return (
    <>
      <span
        className={cn(
          "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
          active && "bg-[#EAF5EC] dark:bg-[#2B3A28]"
        )}
      >
        <Icon className="size-5" strokeWidth={active ? 2.4 : 2} />
      </span>
      {title}
    </>
  );
}

// Visible solo con la variante app-tabs (app instalada, celular); en el
// navegador queda oculta y la navegación sigue en las hamburguesas. El alto
// sale de --bottom-tabs-space (borde e inset incluidos), la misma medida que
// usan el body y la página del agente para no quedar debajo.
export function BottomTabs({ user }: { user?: ExtendedUser }) {
  const pathname = usePathname();
  const activeTab = bottomTabItems.find((item) => item.match(pathname));
  const stateClass = (active: boolean) =>
    active ? "text-[#244C2D] dark:text-[#D4E3B8]" : "text-muted-foreground";

  return (
    <nav
      data-bottom-tabs
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-40 hidden h-(--bottom-tabs-space) border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-backdrop-filter:bg-background/80 app-tabs:block"
    >
      <div className="flex h-full items-stretch px-1">
        {bottomTabItems.map((item) => {
          const active = item === activeTab;

          return (
            <Link
              key={item.url}
              href={item.url}
              aria-current={active ? "page" : undefined}
              className={cn(tabClass, stateClass(active))}
            >
              <TabContent active={active} icon={item.icon} title={item.title} />
            </Link>
          );
        })}
        <MoreSheet user={user}>
          <button type="button" className={cn(tabClass, stateClass(!activeTab))}>
            <TabContent active={!activeTab} icon={Ellipsis} title="Más" />
          </button>
        </MoreSheet>
      </div>
    </nav>
  );
}
