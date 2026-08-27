import type { OfficialBudgetSearchResult } from "@/lib/official-budgets/search";
import {
  getGroundedPriceMismatch,
  hasQuotedMoney,
} from "@/lib/mail-agent/price-grounding";
import type { MailSuggestionOutput } from "@/schemas/mail";

type SearchMatch = OfficialBudgetSearchResult["matches"][number];

export const validateGroundedDraft = (
  draft: MailSuggestionOutput,
  evidence: Map<string, SearchMatch>
) => {
  const sourceIds = [...new Set(draft.officialBudgetSourceOptionIds)];
  const sources = sourceIds.map((id) => {
    const source = evidence.get(id);
    if (!source) {
      throw new Error("Luna intentó usar una fuente oficial no devuelta por la búsqueda");
    }
    return source;
  });
  const allowedAmounts = sources.flatMap(({ prices }) => [
    prices.net,
    prices.ivaAmount,
    prices.final,
    prices.hourlyNet,
  ]);
  if (hasQuotedMoney(draft.body) && !sources.length) {
    throw new Error("Luna intentó cotizar sin una coincidencia oficial exacta");
  }
  const mismatch = getGroundedPriceMismatch(draft.body, allowedAmounts);
  if (mismatch.mismatch) {
    throw new Error("Luna modificó un importe de la fuente oficial");
  }
  return { sources, allowedAmounts };
};
