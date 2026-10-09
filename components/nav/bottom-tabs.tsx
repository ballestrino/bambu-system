"use client";

import Link from "next/link";
import { Ellipsis, type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";

import { bottomTabItems } from "@/components/dashboard/dashboard-nav";
import { MoreSheet } from "@/components/nav/more-sheet";
import { cn } from "@/lib/utils";
import type { ExtendedUser } from "@/next-auth";

const tabClass =
  "my-1 flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-px rounded-full text-[10px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none";

function TabContent({ active, icon: Icon, title }: { active: boolean; icon: LucideIcon; title: string }) {
  return (
    <>
      <Icon className="size-[22px]" strokeWidth={active ? 2.4 : 2} aria-hidden />
      <span className="max-w-full truncate px-0.5">{title}</span>
    </>
  );
}

// Visible solo con la variante app-tabs (app instalada, celular); en el
// navegador queda oculta y la navegación sigue en las hamburguesas. Flota sobre
// el contenido como una píldora translúcida, como los tabs de iOS 26: el
// contenido pasa por debajo, desenfocado. El lugar que ocupa (con su margen y
// el indicador de inicio) es --bottom-tabs-space, la misma medida que usan el
// body y la página del agente para no quedar debajo.
export function BottomTabs({ user }: { user?: ExtendedUser }) {
  const pathname = usePathname();
  const activeTab = bottomTabItems.find((item) => item.match(pathname));
  const stateClass = (active: boolean) =>
    active ? "bg-ops-bamboo-strong/10 font-semibold text-ops-bamboo-strong" : "text-ops-text";

  return (
    <nav
      data-bottom-tabs
      aria-label="Secciones"
      className="fixed inset-x-3.5 bottom-(--bottom-tabs-offset) z-50 hidden h-16 rounded-full border border-white/85 bg-white/72 px-1 shadow-[0_10px_30px_rgb(24_37_29/0.16),0_1px_3px_rgb(24_37_29/0.08),inset_0_1px_0_rgb(255_255_255/0.9)] backdrop-blur-xl backdrop-saturate-[1.8] app-tabs:block dark:border-white/10 dark:bg-ops-surface/75 dark:shadow-[0_10px_30px_rgb(0_0_0/0.4)]"
    >
      <div className="flex h-full items-stretch">
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
