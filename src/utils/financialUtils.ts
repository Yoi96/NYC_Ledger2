import { OTCCardState, GiftCardState, RecurringIncomeConfig } from "../types";

export const getOTCCardState = (): OTCCardState => {
  try {
    const saved = localStorage.getItem("nyc_otc_card_state");
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        totalBalance: parsed.totalBalance ?? 150.0,
        remainingBalance: parsed.remainingBalance ?? 112.5,
        monthlyAllowance: parsed.monthlyAllowance ?? 150.0,
        allowancePeriod: parsed.allowancePeriod ?? "MONTHLY",
        usedAmount: parsed.usedAmount ?? Math.max(0, (parsed.monthlyAllowance || 150.0) - (parsed.remainingBalance || 112.5)),
        nextReloadDate: parsed.nextReloadDate || "2026-09-01",
        cardNumberLast4: parsed.cardNumberLast4 || "8899",
        cardName: parsed.cardName || "NYC OTC Benefit Allowance Card",
        notes: parsed.notes || "NYC Senior & Health Plan OTC Benefit Card",
      };
    }
  } catch (e) {
    console.error("Failed to parse OTC card state", e);
  }
  return {
    totalBalance: 150.00,
    remainingBalance: 112.50,
    monthlyAllowance: 150.00,
    allowancePeriod: "MONTHLY",
    usedAmount: 37.50,
    nextReloadDate: "2026-09-01",
    cardNumberLast4: "8899",
    cardName: "NYC OTC Benefit Allowance Card",
    notes: "NYC Senior & Health Plan OTC Benefit Card",
  };
};

export const saveOTCCardState = (state: OTCCardState) => {
  try {
    localStorage.setItem("nyc_otc_card_state", JSON.stringify(state));
    window.dispatchEvent(new Event("nyc_otc_state_updated"));
  } catch (e) {
    console.error("Failed to save OTC card state", e);
  }
};

export const getGiftCardState = (): GiftCardState => {
  try {
    const saved = localStorage.getItem("nyc_gift_card_state");
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Failed to parse Gift Card state", e);
  }
  return {
    totalBalance: 100.00,
    remainingBalance: 100.00,
  };
};

export const saveGiftCardState = (state: GiftCardState) => {
  try {
    localStorage.setItem("nyc_gift_card_state", JSON.stringify(state));
    window.dispatchEvent(new Event("nyc_gift_card_updated"));
  } catch (e) {
    console.error("Failed to save Gift Card state", e);
  }
};

export const getRecurringIncomes = (): RecurringIncomeConfig[] => {
  try {
    const saved = localStorage.getItem("nyc_recurring_incomes");
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Failed to parse Recurring Incomes", e);
  }
  return [
    {
      id: "rec-1",
      sourceName: "NYC Bank Salary / Direct Deposit",
      amount: 3200.00,
      frequency: "MONTHLY",
      dayOfMonth: 1,
      isEnabled: true,
      paymentMethod: "Bank Checking ACH",
    },
    {
      id: "rec-2",
      sourceName: "OTC Monthly Benefit Allowance",
      amount: 150.00,
      frequency: "MONTHLY",
      dayOfMonth: 1,
      isEnabled: true,
      paymentMethod: "OTC Card",
    },
  ];
};

export const saveRecurringIncomes = (incomes: RecurringIncomeConfig[]) => {
  try {
    localStorage.setItem("nyc_recurring_incomes", JSON.stringify(incomes));
    window.dispatchEvent(new Event("nyc_recurring_incomes_updated"));
  } catch (e) {
    console.error("Failed to save Recurring Incomes", e);
  }
};

export const getOMNYBalance = (): number => {
  try {
    const saved = localStorage.getItem("nyc_omny_card_balance");
    if (saved !== null) return parseFloat(saved);
  } catch (e) {
    console.error("Failed to parse OMNY balance", e);
  }
  return 25.00;
};

export const saveOMNYBalance = (bal: number) => {
  try {
    localStorage.setItem("nyc_omny_card_balance", bal.toString());
    window.dispatchEvent(new Event("nyc_omny_balance_updated"));
  } catch (e) {
    console.error("Failed to save OMNY balance", e);
  }
};
