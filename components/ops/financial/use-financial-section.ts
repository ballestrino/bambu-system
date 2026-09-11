"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  DEFAULT_FINANCE_SECTION,
  isFinanceSection,
  type FinanceSection,
  type FinanceSectionSelect,
} from "@/components/ops/financial/financial-sections";

const SECTION_PARAM = "seccion";
const VIEW_PARAM = "vista";

export const useFinancialSection = () => {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const requested = params.get(SECTION_PARAM);
  const section = isFinanceSection(requested)
    ? requested
    : DEFAULT_FINANCE_SECTION;
  const view = params.get(VIEW_PARAM);

  const buildHref = useCallback(
    (next: FinanceSection, nextView?: string) => {
      const nextParams = new URLSearchParams(params.toString());
      nextParams.set(SECTION_PARAM, next);
      // A view belongs to one section: drop it when moving to another, so
      // ?vista=equipo does not linger on Costes.
      if (nextView) nextParams.set(VIEW_PARAM, nextView);
      else nextParams.delete(VIEW_PARAM);
      return `${pathname}?${nextParams.toString()}`;
    },
    [params, pathname]
  );

  // Legacy deep links used a fragment (#cobros). The fragment never reaches the
  // server and useSearchParams cannot see it, so migrate it to the query param
  // once after mount; reading it during render would break hydration. replace(),
  // not push(), so Back does not bounce onto the old URL.
  useEffect(() => {
    if (params.has(SECTION_PARAM)) return;
    const hash = window.location.hash.slice(1);
    if (!isFinanceSection(hash)) return;
    router.replace(buildHref(hash), { scroll: false });
  }, [buildHref, params, router]);

  const setSection = useCallback<FinanceSectionSelect>(
    (next, options) => {
      router.push(buildHref(next, options?.view), { scroll: false });
    },
    [buildHref, router]
  );

  // replace(), not push(): switching between the two tables of a section is
  // not a navigation worth a history entry per click.
  const setView = useCallback(
    (nextView: string) => {
      router.replace(buildHref(section, nextView), { scroll: false });
    },
    [buildHref, router, section]
  );

  return { section, setSection, setView, view };
};
