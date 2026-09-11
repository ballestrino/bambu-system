"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  DEFAULT_FINANCE_SECTION,
  isFinanceSection,
  type FinanceSection,
} from "@/components/ops/financial/financial-sections";

const SECTION_PARAM = "seccion";

export const useFinancialSection = () => {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const requested = params.get(SECTION_PARAM);
  const section = isFinanceSection(requested)
    ? requested
    : DEFAULT_FINANCE_SECTION;

  const buildHref = useCallback(
    (next: FinanceSection) => {
      const nextParams = new URLSearchParams(params.toString());
      nextParams.set(SECTION_PARAM, next);
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

  const setSection = useCallback(
    (next: FinanceSection) => {
      router.push(buildHref(next), { scroll: false });
    },
    [buildHref, router]
  );

  return { section, setSection };
};
