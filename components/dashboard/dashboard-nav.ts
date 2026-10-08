import {
  BadgeDollarSign,
  Calculator,
  CalendarDays,
  LayoutDashboard,
  List,
  Mail,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { isOpsNavItemActive, opsNavItems } from "@/components/ops/nav-items";
import { AGENT_PAGE_PATH } from "@/lib/agent/page-url";

export type DashboardNavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
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

export const dashboardNavGroups: { label: string; items: DashboardNavItem[] }[] = [
  {
    label: "Precios",
    items: budgetNavItems,
  },
  {
    label: "Operaciones",
    items: opsNavItems.map((item) => ({
      ...item,
      match: (pathname: string) => isOpsNavItemActive(pathname, item.url),
    })),
  },
  {
    label: "Comunicaciones",
    items: [
      {
        title: "Correo",
        url: "/dashboard/email",
        icon: Mail,
        match: (pathname: string) => pathname.startsWith("/dashboard/email"),
      },
    ],
  },
  {
    label: "Asistente",
    items: [
      {
        title: "Agente",
        url: AGENT_PAGE_PATH,
        icon: Sparkles,
        match: (pathname: string) => pathname.startsWith(AGENT_PAGE_PATH),
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
  {
    title: "Agente",
    url: AGENT_PAGE_PATH,
    icon: Sparkles,
    match: (pathname: string) => pathname.startsWith(AGENT_PAGE_PATH),
  },
];

export const moreNavGroups = dashboardNavGroups
  .map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !bottomTabItems.some((tab) => tab.url === item.url)
    ),
  }))
  .filter((group) => group.items.length > 0);
