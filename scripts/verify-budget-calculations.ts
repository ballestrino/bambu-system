import assert from "node:assert/strict";

import {
    calculateBudgetTotals,
    calculateRevenuePercentForHourlyTarget,
    calculateRevenuePercentForServiceTarget,
} from "../lib/budget-calculations";
import { defaultBudgetValues } from "../schemas/BudgetSchema";

const noProductMargin = calculateBudgetTotals(defaultBudgetValues);
assert.equal(noProductMargin.productRevenuePct, 0);
assert.equal(noProductMargin.revenueAmountProducts, 0);
assert.equal(
    noProductMargin.totalPreTaxWithProducts -
        noProductMargin.priceNoTaxService,
    defaultBudgetValues.products_price
);

const withProductMargin = calculateBudgetTotals({
    ...defaultBudgetValues,
    products_revenue_percent: 15,
});
assert.equal(
    withProductMargin.revenueAmountProducts,
    defaultBudgetValues.products_price * 0.15
);

// Los extras suman al costo del servicio y llevan su ganancia; un JSON roto no rompe nada.
const withExtras = calculateBudgetTotals({
    ...defaultBudgetValues,
    extras: [{ name: "Camión cisterna", amount: 2_500 }, { name: "Permiso", amount: 500 }],
});
assert.equal(withExtras.extrasCost, 3_000);
assert.equal(
    withExtras.costBasisNoProducts - noProductMargin.costBasisNoProducts,
    3_000
);
assert.ok(
    Math.abs(
        withExtras.revenueAmountService -
            noProductMargin.revenueAmountService -
            3_000 * (defaultBudgetValues.revenue_percent / 100)
    ) < 1e-6
);
const storedExtras = calculateBudgetTotals({
    ...defaultBudgetValues,
    extras: [{ name: "Ok", amount: 100 }, { name: "", amount: 50 }, "roto", null],
});
assert.equal(storedExtras.extrasCost, 150);
assert.equal(calculateBudgetTotals({ ...defaultBudgetValues, extras: null }).extrasCost, 0);

const target = calculateRevenuePercentForHourlyTarget(100, 10, 500);
assert.equal(target.revenuePercent, 100);
assert.equal(target.normalizedHourlyPrice, 100);
assert.equal(target.wasClamped, false);

const clampedTarget = calculateRevenuePercentForHourlyTarget(30, 10, 500);
assert.equal(clampedTarget.revenuePercent, 0);
assert.equal(clampedTarget.normalizedHourlyPrice, 50);
assert.equal(clampedTarget.wasClamped, true);

const invalidTarget = calculateRevenuePercentForHourlyTarget(100, 0, 500);
assert.equal(invalidTarget.canCalculate, false);

const serviceTarget = calculateRevenuePercentForServiceTarget(
    10_700,
    10,
    500
);
assert.equal(serviceTarget.normalizedServicePrice, 10_700);
assert.equal(serviceTarget.normalizedHourlyPrice, 1_070);
assert.equal(serviceTarget.revenuePercent, 2_040);

const clampedServiceTarget = calculateRevenuePercentForServiceTarget(
    300,
    10,
    500
);
assert.equal(clampedServiceTarget.normalizedServicePrice, 500);
assert.equal(clampedServiceTarget.normalizedHourlyPrice, 50);
assert.equal(clampedServiceTarget.revenuePercent, 0);

const selectedTarget = 500;
const budgetTarget = calculateRevenuePercentForHourlyTarget(
    selectedTarget,
    noProductMargin.totalHours,
    noProductMargin.costBasisNoProducts
);
const repricedBudget = calculateBudgetTotals({
    ...defaultBudgetValues,
    revenue_percent: budgetTarget.revenuePercent,
});
assert.ok(
    Math.abs(
        repricedBudget.hourlyPriceNoTaxService - selectedTarget
    ) < 0.0001
);

const selectedServiceTarget = 10_700;
const serviceBudgetTarget = calculateRevenuePercentForServiceTarget(
    selectedServiceTarget,
    noProductMargin.totalHours,
    noProductMargin.costBasisNoProducts
);
const serviceRepricedBudget = calculateBudgetTotals({
    ...defaultBudgetValues,
    revenue_percent: serviceBudgetTarget.revenuePercent,
});
assert.ok(
    Math.abs(
        serviceRepricedBudget.priceNoTaxService -
            selectedServiceTarget
    ) < 0.0001
);

process.stdout.write("budget calculation checks passed\n");
