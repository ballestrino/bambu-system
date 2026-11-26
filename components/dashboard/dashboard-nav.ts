import {
  BadgeDollarSign,
  Calculator,
  CalendarDays,
  Inbox,
  LayoutDashboard,
  List,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { isOpsNavItemActive, opsNavItems } from "@/components/ops/nav-items";
import { AGENT_NAME } from "@/lib/agent/agent-name";
import { AGENT_PAGE_PATH } from "@/lib/agent/page-url";

export type DashboardNavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
  // Número a la derecha (los formularios web nuevos).
  badge?: "webForms";
};

const budgetNavItems = [
  {
    title: "Generador",
    url: "/dashboard/budgets",
    icon: Calculator,
    match: (pathname: string) =>
      pathname === "/dashboard/budgets" ||
      pathname.startsWith("/dashboard/budgets/create") ||
      pathname.startsWith("/dashboard/budgets/edit") ||
      pathname.startsWith("/dashboard/budgets/budget"),
  },
  {
    title: "Presupuestos oficiales",
    url: "/dashboard/official-budgets",
    icon: BadgeDollarSign,
    match: (pathname: string) =>
      pathname.startsWith("/dashboard/official-budgets"),
  },
  {
    title: "Categorías",
    url: "/dashboard/budgets/categories",
    icon: List,
    match: (pathname: string) =>
      pathname.startsWith("/dashboard/budgets/categories"),
  },
] satisfies DashboardNavItem[];

// El agente va aparte, destacado arriba de los grupos (barra lateral).
export const agentNavItem: DashboardNavItem = {
  title: AGENT_NAME,
  url: AGENT_PAGE_PATH,
  icon: Sparkles,
  match: (pathname: string) => pathname.startsWith(AGENT_PAGE_PATH),
};

// Memoria e Instrucciones salieron de acá: viven en Configuración (Agente).
export const dashboardNavGroups: { label: string; items: DashboardNavItem[] }[] = [
  {
    label: "Operaciones",
    items: opsNavItems.map((item) => ({
      ...item,
      match: (pathname: string) => isOpsNavItemActive(pathname, item.url),
    })),
  },
  {
    label: "Precios",
    items: budgetNavItems,
  },
  {
    label: "Web",
    items: [
      {
        title: "Formularios",
        url: "/dashboard/web-forms",
        icon: Inbox,
        badge: "webForms",
        match: (pathname: string) => pathname.startsWith("/dashboard/web-forms"),
      },
    ],
  },
];

// Tabs de la app instalada en iOS; el resto de las secciones va en "Más".
export const bottomTabItems: DashboardNavItem[] = [
  {
    title: "Inicio",
    url: "/dashboard",
    icon: LayoutDashboard,
    match: (pathname: string) => pathname === "/dashboard",
  },
  {
    title: "Visitas",
    url: "/dashboard/calendar",
    icon: CalendarDays,
    match: (pathname: string) => pathname.startsWith("/dashboard/calendar"),
  },
  {
    title: "Presupuestos",
    url: "/dashboard/budgets",
    icon: Calculator,
    match: (pathname: string) =>
      pathname.startsWith("/dashboard/budgets") ||
      pathname.startsWith("/dashboard/official-budgets"),
  },
  agentNavItem,
];

export const moreNavGroups = dashboardNavGroups
  .map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !bottomTabItems.some((tab) => tab.url === item.url)
    ),
  }))
  .filter((group) => group.items.length > 0);
