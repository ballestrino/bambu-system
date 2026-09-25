import { BUSINESS_PROFILE } from "@/lib/agent/business-profile";

// Los redondeos de las reglas de precio del agente. Puro y sin el cálculo:
// lo usan el estimado de productos de applyBudgetChanges y el precio lindo de
// agent-pricing.ts. Se cuenta en centavos para que $ 23.400,00 no suba por un
// error de coma flotante.
const toCents = (amount: number) => Math.round(amount * 100);

// El total mensual sin IVA sube al próximo múltiplo de $ 100; si ya lo es,
// queda igual.
export const roundUpToPriceStep = (amount: number) => {
  const step = BUSINESS_PROFILE.priceStep * 100;
  return (Math.ceil(toCents(amount) / step) * step) / 100;
};

// Los productos van al múltiplo de $ 500 más cercano, nunca menos de $ 500.
// Cero es "sin productos" y queda en cero.
export const roundProductsPrice = (amount: number) => {
  if (!(amount > 0)) return 0;
  const step = BUSINESS_PROFILE.productsStep;
  return Math.max(step, Math.round(amount / step) * step);
};
