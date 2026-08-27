const quotedMoneyPattern =
  /(?:(?:UYU|USD|US\$|\$)\s*([\d.,]+)|([\d.,]+)\s*(?:pesos?|UYU|USD))/gi;

const parseLocalizedAmount = (raw: string) => {
  const value = raw.replace(/[.,]+$/, "");
  const comma = value.lastIndexOf(",");
  const dot = value.lastIndexOf(".");
  if (comma > dot) return Number(value.replace(/\./g, "").replace(",", "."));
  if (dot >= 0 && value.length - dot - 1 <= 2) {
    return Number(value.replace(/,/g, ""));
  }
  return Number(value.replace(/[.,]/g, ""));
};

export const extractQuotedMoneyAmounts = (body: string) =>
  [...body.matchAll(quotedMoneyPattern)]
    .map((match) => parseLocalizedAmount(match[1] ?? match[2]))
    .filter(Number.isFinite)
    .map((amount) => Math.round(amount * 100) / 100);

export const hasQuotedMoney = (body: string) =>
  extractQuotedMoneyAmounts(body).length > 0;

export const hasUngroundedQuotedPrice = (
  body: string,
  sourceCount: number
) => hasQuotedMoney(body) && sourceCount === 0;

export const getGroundedPriceMismatch = (
  body: string,
  allowedAmounts: number[]
) => {
  const allowed = allowedAmounts.map((amount) => Math.round(amount * 100) / 100);
  const mismatches = extractQuotedMoneyAmounts(body).filter(
    (quoted) => !allowed.some((amount) => Math.abs(amount - quoted) < 0.01)
  );
  return { mismatch: mismatches.length > 0, mismatches };
};

type OfficialPriceSource = {
  officialBudgetOption: {
    netPrice: unknown;
    ivaAmount: unknown;
    finalPrice: unknown;
    hourlyPrice: unknown;
  };
};

export const getOfficialSourceAmounts = (sources: OfficialPriceSource[]) =>
  sources.flatMap(({ officialBudgetOption: option }) => [
    Number(option.netPrice),
    Number(option.ivaAmount),
    Number(option.finalPrice),
    Number(option.hourlyPrice),
  ]);
