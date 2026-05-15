type BudgetOptionSource = Record<string, unknown>;

type JobBudgetPricingSource = {
  budgetIncludesIva: boolean;
  budgetSnapshot?: unknown;
  sourceBudgetOption?: unknown | null;
};

const toRecord = (value: unknown) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const toMoneyNumber = (value: unknown) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

const roundMoney = (amount: number) => Number(amount.toFixed(2));

const removeIva = (grossPrice: number, ivaRate: number) => {
  if (grossPrice <= 0 || ivaRate <= 0) {
    return grossPrice;
  }

  return grossPrice / (1 + ivaRate / 100);
};

const getOptionPricing = (option: BudgetOptionSource | null) => {
  if (!option) {
    return null;
  }

  const grossPrice = toMoneyNumber(option.price);
  if (grossPrice <= 0) {
    return null;
  }

  return {
    grossPrice,
    ivaRate: toMoneyNumber(option.iva),
  };
};

export const getJobBudgetTaxModeLabel = (budgetIncludesIva: boolean) =>
  budgetIncludesIva ? "Con IVA" : "Sin IVA";

export const formatJobBudgetPrice = (amount: number | null) =>
  amount === null ? "Sin opcion" : `$${amount.toFixed(2)}`;

export const getJobBudgetPrice = ({
  budgetIncludesIva,
  budgetSnapshot,
  sourceBudgetOption,
}: JobBudgetPricingSource) => {
  const snapshot = toRecord(budgetSnapshot);
  const snapshotOption = toRecord(snapshot?.option);
  const fallbackOption = toRecord(sourceBudgetOption);
  const pricing = getOptionPricing(snapshotOption ?? fallbackOption);

  if (!pricing) {
    return null;
  }

  return roundMoney(
    budgetIncludesIva
      ? pricing.grossPrice
      : removeIva(pricing.grossPrice, pricing.ivaRate)
  );
};
