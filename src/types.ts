export type NYCExpenseCategory =
  | "Transit (MTA/OMNY)"
  | "Food & Dining"
  | "Food & Beverage"
  | "Groceries"
  | "Housing & Utilities"
  | "Shopping & Fashion"
  | "Culture & Fun"
  | "Services"
  | "Credit Card Payment"
  | "Bottle Deposit"
  | "Pay for OMNY Card Balance"
  | "Income"
  | "Other"
  | (string & {});

export type NYCBorough =
  | "Manhattan"
  | "Brooklyn"
  | "Queens"
  | "Bronx"
  | "Staten Island"
  | "All / Digital";

export interface TransactionItem {
  name: string;
  price: number;
  qty?: number;
}

export interface ExpenseTransaction {
  id: string;
  merchant: string;
  amount: number;
  tax: number;
  tip: number;
  date: string; // YYYY-MM-DD
  category: NYCExpenseCategory;
  subCategory: string;
  borough: NYCBorough;
  neighborhood: string; // e.g. "Flushing", "SoHo", "East Village", "Williamsburg", "Midtown"
  note?: string;
  receiptUrl?: string; // base64 preview
  items?: TransactionItem[];
  type?: "EXPENSE" | "INCOME"; // Expense or Income
  companyAddress?: string; // Company / Workplace Address for Income
  nycTaxExempt?: boolean; // e.g., clothing under $110
  isOMNY?: boolean; // counts towards MTA $35 cap
  customIcon?: string; // Custom icon identifier selected by user
  paymentMethod: string;
  createdAt: number;
}

export interface BudgetGoal {
  category: NYCExpenseCategory;
  monthlyLimit: number;
}

export interface OMNYState {
  weeklyTaps: number;
  weekStartDate: string; // YYYY-MM-DD (Monday)
  singleFare: number; // $3.00
  weeklyCap: number; // $35.00
}

export interface OTCCardState {
  totalBalance: number;
  remainingBalance: number;
  monthlyAllowance: number;
  allowancePeriod?: "MONTHLY" | "QUARTERLY";
  usedAmount: number;
  nextReloadDate: string; // YYYY-MM-DD
  cardNumberLast4?: string;
  notes?: string;
  cardName?: string;
}

export interface GiftCardState {
  totalBalance: number;
  remainingBalance: number;
}

export interface RecurringIncomeConfig {
  id: string;
  sourceName: string; // e.g., "Monthly Bank Direct Deposit / Salary"
  amount: number;
  frequency: "MONTHLY" | "BIWEEKLY";
  dayOfMonth: number; // 1 to 31
  isEnabled: boolean;
  lastAppliedMonth?: string; // YYYY-MM
  paymentMethod: string; // e.g., "Bank Checking ACH" or "OTC Card"
}

export interface NYCPaycheckConfig {
  annualIncome: number;
  filingStatus: "single" | "married";
  preTaxDeductionsAnnual: number; // e.g. 401k, FSA, Health insurance
}

export interface NYCNeighborhoodInfo {
  name: string;
  borough: NYCBorough;
  popularFor: string;
}
