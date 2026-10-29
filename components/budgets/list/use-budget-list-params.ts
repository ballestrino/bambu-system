"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { BudgetFilters } from "@/components/budgets/interfaces/budget-filters";
import { getCookie } from "@/lib/utils";

const numberParam = (params: URLSearchParams, key: string) => {
  const value = params.get(key);
  return value ? Number(value) : undefined;
};

// Los filtros que no son de paginación: cambiar cualquiera vuelve a la página 1.
const PAGING_KEYS = new Set(["page"]);

export const hasActiveListFilters = (params: URLSearchParams) =>
  [...params.keys()].some((key) => !PAGING_KEYS.has(key) && key !== "limit" && key !== "status");

// La lista vive en la URL: búsqueda, estado, chips y filtros. La página queda
// en estado local y vuelve a 1 cuando cambia cualquier filtro.
export const useBudgetListParams = () => {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const filterKey = params.toString();
  const [previousKey, setPreviousKey] = useState(filterKey);
  if (filterKey !== previousKey) {
    setPreviousKey(filterKey);
    setPage(1);
  }
  // router.replace llega en una transición: hasta que la URL cambia, el
  // próximo toque parte de la URL pendiente y no de la vieja.
  const pendingSearch = useRef<string | null>(null);
  useEffect(() => {
    pendingSearch.current = null;
  }, [filterKey]);

  const status = params.get("status");
  const cookieLimit = getCookie("budget_limit");
  const limit = numberParam(params, "limit") ?? (cookieLimit ? Number(cookieLimit) : 10);
  const hasProducts = params.get("hasProducts");

  const filters: BudgetFilters = {
    catIds: params.get("categories")?.split(",").filter(Boolean),
    query: params.get("query") || "",
    page,
    limit,
    status: status === "official" || status === "draft" ? status : undefined,
    startDate: params.get("startDate") || undefined,
    endDate: params.get("endDate") || undefined,
    hasProducts: hasProducts === "true" ? true : hasProducts === "false" ? false : undefined,
    minPrice: numberParam(params, "minPrice"),
    maxPrice: numberParam(params, "maxPrice"),
    minProfit: numberParam(params, "minProfit"),
    maxProfit: numberParam(params, "maxProfit"),
    minNominalHour: numberParam(params, "minNominalHour"),
    maxNominalHour: numberParam(params, "maxNominalHour"),
    minVisits: numberParam(params, "minVisits"),
    maxVisits: numberParam(params, "maxVisits"),
    minHoursPerVisit: numberParam(params, "minHoursPerVisit"),
    maxHoursPerVisit: numberParam(params, "maxHoursPerVisit"),
    visitTypes: params.get("visitTypes") ? [params.get("visitTypes")!] : undefined,
  };

  const updateParams = useCallback(
    (change: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(pendingSearch.current ?? window.location.search);
      change(next);
      next.delete("page");
      const query = next.toString();
      pendingSearch.current = query;
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router]
  );

  const clearFilters = useCallback(
    () =>
      updateParams((next) => {
        [...next.keys()].forEach((key) => {
          if (key !== "limit" && key !== "status") next.delete(key);
        });
      }),
    [updateParams]
  );

  return {
    clearFilters,
    filters,
    hasFilters: hasActiveListFilters(params),
    page,
    params,
    setPage,
    updateParams,
  };
};
