export const URUGUAY_EMPLOYER_BPS_RATES = {
  fonasa: 5,
  frl: 0.1,
  laborCreditGuaranteeFund: 0.025,
  retirement: 7.5,
} as const;

export const URUGUAY_EMPLOYER_BPS_PERCENT = Object.values(
  URUGUAY_EMPLOYER_BPS_RATES
).reduce((total, rate) => total + rate, 0);

export const URUGUAY_PERSONAL_BPS_BASE_RATES = {
  fonasaBasic: 3,
  frl: 0.1,
  retirement: 15,
} as const;

export const URUGUAY_PERSONAL_BPS_BASE_PERCENT = Object.values(
  URUGUAY_PERSONAL_BPS_BASE_RATES
).reduce((total, rate) => total + rate, 0);

export const URUGUAY_TOTAL_BPS_BASE_PERCENT =
  URUGUAY_EMPLOYER_BPS_PERCENT + URUGUAY_PERSONAL_BPS_BASE_PERCENT;

export const AGUINALDO_ACCRUAL_DIVISOR = 12;

export const getPayrollAccruals = (laborAmount: number | null) => {
  if (laborAmount === null) {
    return {
      aguinaldoGenerated: null,
      bpsGenerated: null,
      employerBpsGenerated: null,
      personalBpsGenerated: null,
    };
  }

  const employerBpsGenerated =
    laborAmount * (URUGUAY_EMPLOYER_BPS_PERCENT / 100);
  const personalBpsGenerated =
    laborAmount * (URUGUAY_PERSONAL_BPS_BASE_PERCENT / 100);

  return {
    aguinaldoGenerated: laborAmount / AGUINALDO_ACCRUAL_DIVISOR,
    bpsGenerated: employerBpsGenerated + personalBpsGenerated,
    employerBpsGenerated,
    personalBpsGenerated,
  };
};
