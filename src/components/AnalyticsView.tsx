import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LabelList,
} from "recharts";
import { ExpenseTransaction } from "../types";
import { parseDateComponents, getNormalizedYYYYMM, getNormalizedYYYY, getNormalizedYYYYMMDD, formatDateMMDDYYYY } from "../utils/dateUtils";

interface AnalyticsViewProps {
  transactions: ExpenseTransaction[];
  onSelectDate?: (date: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Transit (MTA/OMNY)": "#f59e0b",
  "Dining & Bodega": "#10b981",
  Groceries: "#0284c7",
  "Housing & Utilities": "#a855f7",
  "Shopping & Fashion": "#f43f5e",
  "Culture & Fun": "#6366f1",
  Services: "#14b8a6",
  Other: "#64748b",
};

const INCOME_COLORS: Record<string, string> = {
  "Salary / Wages": "#10b981",
  "Freelance & Side Job": "#06b6d4",
  "Secondhand Sales": "#a855f7",
  "Investment & Interest": "#f59e0b",
  "Gift & Reimbursement": "#ec4899",
  "Other Income": "#3b82f6",
  Freelance: "#06b6d4",
  Investment: "#8b5cf6",
  "Gift / Bonus": "#f59e0b",
  Other: "#3b82f6",
};

const DEFAULT_PIE_COLORS = [
  "#f59e0b",
  "#10b981",
  "#0284c7",
  "#a855f7",
  "#f43f5e",
  "#6366f1",
  "#14b8a6",
  "#ec4899",
];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ transactions, onSelectDate }) => {
  const currentYYYYMM = new Date().toISOString().slice(0, 7);
  const currentYYYY = new Date().getFullYear().toString();

  // Custom label renderer for Pie Chart to ensure text fits on all screen sizes
  const renderCustomizedPieLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    value,
  }: any) => {
    if (percent < 0.02) return null; // Skip tiny slices (< 2%) to prevent overlap
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 14;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const textAnchor = x > cx ? "start" : "end";
    const pctStr = `${(percent * 100).toFixed(0)}%`;
    const valStr = `$${Math.round(value)}`;

    return (
      <text
        x={x}
        y={y}
        fill="#f8fafc"
        textAnchor={textAnchor}
        dominantBaseline="central"
        className="text-[10px] sm:text-xs font-bold font-mono"
      >
        {`${pctStr} (${valStr})`}
      </text>
    );
  };
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYYYYMM);

  // Pie Chart Filter Dropdown State: "EXPENSE" | "INCOME" | "COMBINED"
  const [pieFilter, setPieFilter] = useState<"EXPENSE" | "INCOME" | "COMBINED">("EXPENSE");

  // Line Chart Trend Mode State: Monthly vs Yearly
  const [lineTrendMode, setLineTrendMode] = useState<"monthly" | "yearly">("monthly");

  // Filters for Monthly Breakdown daily details table
  const [breakdownYearFilter, setBreakdownYearFilter] = useState<string>("ALL");
  const [breakdownMonthFilter, setBreakdownMonthFilter] = useState<string>("ALL");

  // Bar Comparison Mode State: "all_months" | "two_months" | "yearly"
  const [barCompareMode, setBarCompareMode] = useState<"all_months" | "two_months" | "yearly">("all_months");

  // Two Months Selection State
  const [compareMonthA, setCompareMonthA] = useState<string>("");
  const [compareMonthB, setCompareMonthB] = useState<string>("");

  // Two Years Selection State
  const [compareYearA, setCompareYearA] = useState<string>("");
  const [compareYearB, setCompareYearB] = useState<string>("");

  // Extract all unique months from transactions
  const transactionMonths: string[] = Array.from(
    new Set<string>(
      transactions
        .map((tx) => (tx.date ? getNormalizedYYYYMM(tx.date) : currentYYYYMM))
        .filter(Boolean)
    )
  ).sort((a: string, b: string) => b.localeCompare(a));

  if (!transactionMonths.includes(currentYYYYMM)) {
    transactionMonths.unshift(currentYYYYMM);
  }

  // Extract all unique dates (YYYY-MM-DD) sorted descending
  const transactionDates: string[] = Array.from(
    new Set<string>(
      transactions
        .map((tx) => (tx.date ? getNormalizedYYYYMMDD(tx.date) : ""))
        .filter((d) => d && d.length === 10)
    )
  ).sort((a, b) => b.localeCompare(a));

  // Helper mapping of days grouped by YYYY-MM month
  const daysByMonthMap: Record<string, string[]> = {};
  transactionMonths.forEach((m) => {
    daysByMonthMap[m] = transactionDates.filter((d) => d.startsWith(m));
  });

  // Render options list with Months formatted as MM/YYYY (no days)
  const renderPeriodOptions = (prefix: string = "") => {
    return transactionMonths.map((m) => {
      const [year, month] = m.split("-");
      const label = month && year ? `${month}/${year}` : m;
      return (
        <option key={`${prefix}-${m}`} value={m} className="font-bold text-amber-300">
          {label} {m === currentYYYYMM ? "(Current)" : ""}
        </option>
      );
    });
  };

  // Extract all unique years from transactions
  const transactionYears: string[] = Array.from(
    new Set<string>(
      transactions
        .map((tx) => parseDateComponents(tx.date).year)
        .filter((y) => y.length === 4)
    )
  ).sort((a: string, b: string) => b.localeCompare(a));

  if (!transactionYears.includes(currentYYYY)) {
    transactionYears.unshift(currentYYYY);
  }

  // Initialize comparison month A & B default values
  React.useEffect(() => {
    if (transactionMonths.length >= 2) {
      if (!compareMonthA) setCompareMonthA(transactionMonths[1]);
      if (!compareMonthB) setCompareMonthB(transactionMonths[0]);
    } else {
      if (!compareMonthA) setCompareMonthA(transactionMonths[0] || currentYYYYMM);
      if (!compareMonthB) setCompareMonthB(transactionMonths[0] || currentYYYYMM);
    }
  }, [transactionMonths]);

  // Initialize comparison year A & B default values
  React.useEffect(() => {
    if (transactionYears.length >= 2) {
      if (!compareYearA) setCompareYearA(transactionYears[1]);
      if (!compareYearB) setCompareYearB(transactionYears[0]);
    } else {
      if (!compareYearA) setCompareYearA(transactionYears[0] || currentYYYY);
      if (!compareYearB) setCompareYearB(transactionYears[0] || currentYYYY);
    }
  }, [transactionYears]);

  // Overall Financial Stats
  let totalIncome = 0;
  let totalExpense = 0;

  // Selected Month Stats
  let previewIncome = 0;
  let previewExpense = 0;

  // 1. Category Totals (Expenses)
  const expenseCategoryTotals: Record<string, number> = {};
  // 2. Income Category Totals
  const incomeCategoryTotals: Record<string, number> = {};
  // 3. Monthly Breakdown (YYYY-MM) -> { month, income, expense, count }
  const monthlyMap: Record<string, { month: string; income: number; expense: number; count: number }> = {};
  // 4. Yearly Breakdown (YYYY) -> { year, income, expense, count }
  const yearlyMap: Record<string, { year: string; income: number; expense: number; count: number }> = {};

  // Payment Method Statistics Breakdown
  const paymentMethodTotals: Record<string, { income: number; expense: number; count: number }> = {
    Cash: { income: 0, expense: 0, count: 0 },
    "Credit Card": { income: 0, expense: 0, count: 0 },
    "Apple Pay": { income: 0, expense: 0, count: 0 },
    "OTC Card": { income: 0, expense: 0, count: 0 },
    "Gift Card": { income: 0, expense: 0, count: 0 },
    "Bank ACH / Direct Deposit": { income: 0, expense: 0, count: 0 },
    Other: { income: 0, expense: 0, count: 0 },
  };

  transactions.forEach((tx) => {
    const isIncome = tx.type === "INCOME";
    const month = getNormalizedYYYYMM(tx.date) || currentYYYYMM;
    const year = getNormalizedYYYY(tx.date) || currentYYYY;
    const isSelectedMonth = month === selectedMonth;

    // Categorize Payment Method into standardized buckets
    const methodStr = tx.paymentMethod || "Apple Pay";
    let bucket = "Other";
    if (methodStr === "Cash") bucket = "Cash";
    else if (methodStr.includes("Credit Card") || methodStr.includes("Chase") || methodStr.includes("Amex")) bucket = "Credit Card";
    else if (methodStr.includes("Apple Pay")) bucket = "Apple Pay";
    else if (methodStr.includes("OTC Card")) bucket = "OTC Card";
    else if (methodStr.includes("Gift Card")) bucket = "Gift Card";
    else if (methodStr.includes("ACH") || methodStr.includes("Deposit") || methodStr.includes("Bank")) bucket = "Bank ACH / Direct Deposit";

    if (!paymentMethodTotals[bucket]) {
      paymentMethodTotals[bucket] = { income: 0, expense: 0, count: 0 };
    }
    paymentMethodTotals[bucket].count += 1;
    if (isIncome) {
      paymentMethodTotals[bucket].income += tx.amount;
    } else {
      paymentMethodTotals[bucket].expense += tx.amount;
    }

    // Monthly totals initialization
    if (!monthlyMap[month]) {
      monthlyMap[month] = { month, income: 0, expense: 0, count: 0 };
    }
    monthlyMap[month].count += 1;

    // Yearly totals initialization
    if (!yearlyMap[year]) {
      yearlyMap[year] = { year, income: 0, expense: 0, count: 0 };
    }
    yearlyMap[year].count += 1;

    if (isIncome) {
      totalIncome += tx.amount;
      monthlyMap[month].income += tx.amount;
      yearlyMap[year].income += tx.amount;
      if (isSelectedMonth) previewIncome += tx.amount;

      const incCat = tx.category || "Salary / Wages";
      incomeCategoryTotals[incCat] = (incomeCategoryTotals[incCat] || 0) + tx.amount;
    } else {
      totalExpense += tx.amount;
      monthlyMap[month].expense += tx.amount;
      yearlyMap[year].expense += tx.amount;
      if (isSelectedMonth) previewExpense += tx.amount;

      const expCat = tx.category || "Other";
      expenseCategoryTotals[expCat] = (expenseCategoryTotals[expCat] || 0) + tx.amount;
    }
  });

  const previewBalance = previewIncome - previewExpense;
  const totalBalance = totalIncome - totalExpense;

  // Prepare Pie Chart Data for Expense Categories
  const expensePieData = Object.keys(expenseCategoryTotals).map((cat) => ({
    name: cat,
    value: expenseCategoryTotals[cat],
  }));

  // Prepare Pie Chart Data for Income Categories
  const incomePieData = Object.keys(incomeCategoryTotals).map((cat) => ({
    name: cat,
    value: incomeCategoryTotals[cat],
  }));

  // Prepare Monthly Trend Data sorted chronologically
  const monthlyChartData = Object.values(monthlyMap)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((item) => ({
      month: item.month,
      timeLabel: item.month,
      Income: item.income,
      Expense: item.expense,
      Balance: item.income - item.expense,
      count: item.count,
    }));

  // Prepare Yearly Trend Data sorted chronologically
  const yearlyChartData = Object.values(yearlyMap)
    .sort((a, b) => a.year.localeCompare(b.year))
    .map((item) => ({
      month: item.year,
      year: item.year,
      timeLabel: item.year,
      Income: item.income,
      Expense: item.expense,
      Balance: item.income - item.expense,
      count: item.count,
    }));

  // Line Chart Data for Monthly View
  const monthlyLineData = Object.values(monthlyMap)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((item) => {
      const inc = item.income;
      const exp = item.expense;
      const net = inc - exp;
      const expenseToIncomeRatio = inc > 0 ? parseFloat(((exp / inc) * 100).toFixed(1)) : 0;
      const savingsRate = inc > 0 ? parseFloat(((net / inc) * 100).toFixed(1)) : 0;

      return {
        timeLabel: item.month,
        Income: Math.round(inc),
        Expense: Math.round(exp),
        "Net Balance": Math.round(net),
        "Expense Ratio": expenseToIncomeRatio,
        "Savings Rate": savingsRate,
      };
    });

  // Line Chart Data for Yearly View
  const yearlyLineData = Object.values(yearlyMap)
    .sort((a, b) => a.year.localeCompare(b.year))
    .map((item) => {
      const inc = item.income;
      const exp = item.expense;
      const net = inc - exp;
      const expenseToIncomeRatio = inc > 0 ? parseFloat(((exp / inc) * 100).toFixed(1)) : 0;
      const savingsRate = inc > 0 ? parseFloat(((net / inc) * 100).toFixed(1)) : 0;

      return {
        timeLabel: item.year,
        Income: Math.round(inc),
        Expense: Math.round(exp),
        "Net Balance": Math.round(net),
        "Expense Ratio": expenseToIncomeRatio,
        "Savings Rate": savingsRate,
      };
    });

  // Selected Trend Period State for Line Chart
  const [selectedTrendPeriod, setSelectedTrendPeriod] = useState<string>("");

  const activeLineData = lineTrendMode === "monthly" ? monthlyLineData : yearlyLineData;

  const currentTrendPeriod =
    selectedTrendPeriod && activeLineData.some((d) => d.timeLabel === selectedTrendPeriod)
      ? selectedTrendPeriod
      : activeLineData.length > 0
      ? activeLineData[activeLineData.length - 1].timeLabel
      : selectedMonth;

  const selectedTrendMetric =
    activeLineData.find((d) => d.timeLabel === currentTrendPeriod) || {
      timeLabel: currentTrendPeriod,
      Income: 0,
      Expense: 0,
      "Net Balance": 0,
      "Expense Ratio": 0,
      "Savings Rate": 0,
    };

  // Comparison Calculations for Two Months
  const monthAData = monthlyMap[compareMonthA] || { month: compareMonthA, income: 0, expense: 0, count: 0 };
  const monthBData = monthlyMap[compareMonthB] || { month: compareMonthB, income: 0, expense: 0, count: 0 };

  const twoMonthsChartData = [
    { month: `${monthAData.month} (A)`, Income: monthAData.income, Expense: monthAData.expense, Balance: monthAData.income - monthAData.expense },
    { month: `${monthBData.month} (B)`, Income: monthBData.income, Expense: monthBData.expense, Balance: monthBData.income - monthBData.expense },
  ];

  const monthIncomeDiff = monthBData.income - monthAData.income;
  const monthExpenseDiff = monthBData.expense - monthAData.expense;
  const monthBalanceDiff = (monthBData.income - monthBData.expense) - (monthAData.income - monthAData.expense);

  const monthIncomePct = monthAData.income > 0 ? ((monthIncomeDiff / monthAData.income) * 100).toFixed(1) : "0";
  const monthExpensePct = monthAData.expense > 0 ? ((monthExpenseDiff / monthAData.expense) * 100).toFixed(1) : "0";

  // Comparison Calculations for Two Years
  const yearAData = yearlyMap[compareYearA] || { year: compareYearA, income: 0, expense: 0, count: 0 };
  const yearBData = yearlyMap[compareYearB] || { year: compareYearB, income: 0, expense: 0, count: 0 };

  const yearIncomeDiff = yearBData.income - yearAData.income;
  const yearExpenseDiff = yearBData.expense - yearAData.expense;
  const yearBalanceDiff = (yearBData.income - yearBData.expense) - (yearAData.income - yearAData.expense);

  const yearIncomePct = yearAData.income > 0 ? ((yearIncomeDiff / yearAData.income) * 100).toFixed(1) : "0";
  const yearExpensePct = yearAData.expense > 0 ? ((yearExpenseDiff / yearAData.expense) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <h2 className="font-extrabold text-slate-100 text-base mb-1 flex items-center gap-2">
          <span>🗽</span>
          <span>NYC Financial Overview</span>
        </h2>
        <p className="text-xs text-slate-400">
          Filter expense distribution and income trends by specific month and year.
        </p>
      </div>

      {/* 6 Core Financial Metrics Grid with Month/Year Selectors */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-slate-200 text-xs sm:text-sm flex items-center gap-1.5">
            <span>💰 Income, Expense & Balance</span>
            <span className="text-amber-400 font-mono text-xs">({selectedMonth})</span>
          </h3>

          {/* Month & Year Selectors */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px]">Period:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-950 border border-amber-500/40 text-amber-300 font-bold font-mono px-2.5 py-1 rounded-lg text-xs outline-none focus:border-amber-400 cursor-pointer"
            >
              {renderPeriodOptions("top-period")}
            </select>
          </div>
        </div>

        {/* Selected Month Metrics */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-400">
              {selectedMonth} Monthly Preview
            </span>
            <span className="text-[10px] text-amber-400/80 font-mono">
              Net: ${previewBalance.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-950 p-2.5 rounded-xl border border-emerald-500/20">
              <span className="text-[10px] text-emerald-400 font-semibold block">Monthly Income</span>
              <span className="font-mono text-xs sm:text-sm font-bold text-emerald-300">
                +${previewIncome.toFixed(2)}
              </span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-rose-500/20">
              <span className="text-[10px] text-rose-400 font-semibold block">Monthly Expense</span>
              <span className="font-mono text-xs sm:text-sm font-bold text-rose-300">
                -${previewExpense.toFixed(2)}
              </span>
            </div>
            <div
              className={`bg-slate-950 p-2.5 rounded-xl border ${
                previewBalance >= 0 ? "border-amber-500/30" : "border-rose-500/40"
              }`}
            >
              <span className="text-[10px] text-amber-400 font-semibold block">Monthly Balance</span>
              <span
                className={`font-mono text-xs sm:text-sm font-extrabold ${
                  previewBalance >= 0 ? "text-amber-300" : "text-rose-400"
                }`}
              >
                ${previewBalance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Total Metrics */}
        <div>
          <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
            All-Time Accumulation
          </span>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-950 p-2.5 rounded-xl border border-emerald-500/20">
              <span className="text-[10px] text-emerald-400 font-semibold block">Total Income</span>
              <span className="font-mono text-xs sm:text-sm font-bold text-emerald-300">
                +${totalIncome.toFixed(2)}
              </span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-rose-500/20">
              <span className="text-[10px] text-rose-400 font-semibold block">Total Expense</span>
              <span className="font-mono text-xs sm:text-sm font-bold text-rose-300">
                -${totalExpense.toFixed(2)}
              </span>
            </div>
            <div
              className={`bg-slate-950 p-2.5 rounded-xl border ${
                totalBalance >= 0 ? "border-sky-500/30" : "border-rose-500/40"
              }`}
            >
              <span className="text-[10px] text-sky-400 font-semibold block">Net Balance</span>
              <span
                className={`font-mono text-xs sm:text-sm font-extrabold ${
                  totalBalance >= 0 ? "text-sky-300" : "text-rose-400"
                }`}
              >
                ${totalBalance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Income vs Expense Trend Line Chart with Monthly/Yearly Toggle */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-200 text-xs sm:text-sm">📈 Income vs Expense Trend</h3>
            <p className="text-[10px] text-slate-400">Compare income and expense trends with net balance over time</p>
          </div>

          {/* Monthly vs Yearly Toggle Buttons */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs font-bold">
            <button
              onClick={() => setLineTrendMode("monthly")}
              className={`px-3 py-1 rounded-lg transition-all ${
                lineTrendMode === "monthly"
                  ? "bg-amber-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              📅 Monthly Trend
            </button>
            <button
              onClick={() => setLineTrendMode("yearly")}
              className={`px-3 py-1 rounded-lg transition-all ${
                lineTrendMode === "yearly"
                  ? "bg-amber-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              🗓️ Yearly Trend
            </button>
          </div>
        </div>

        {activeLineData.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">No transaction data available</p>
        ) : (
          <>
            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activeLineData} margin={{ top: 25, right: 15, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", fontSize: "12px" }}
                    formatter={(val: any, name: any) => [`$${val}`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Line
                    type="monotone"
                    dataKey="Income"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 5, fill: "#10b981" }}
                    activeDot={{ r: 7 }}
                  >
                    <LabelList
                      dataKey="Income"
                      position="top"
                      formatter={(val: number) => (val > 0 ? `$${val}` : "")}
                      fill="#34d399"
                      fontSize={10}
                      fontWeight="bold"
                    />
                  </Line>
                  <Line
                    type="monotone"
                    dataKey="Expense"
                    stroke="#f43f5e"
                    strokeWidth={3}
                    dot={{ r: 5, fill: "#f43f5e" }}
                    activeDot={{ r: 7 }}
                  >
                    <LabelList
                      dataKey="Expense"
                      position="bottom"
                      formatter={(val: number) => (val > 0 ? `$${val}` : "")}
                      fill="#fb7185"
                      fontSize={10}
                      fontWeight="bold"
                    />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Single Period Selector & Inline Ratio Summary Bar */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-semibold">Select Period:</span>
                  <select
                    value={currentTrendPeriod}
                    onChange={(e) => setSelectedTrendPeriod(e.target.value)}
                    className="bg-slate-950 border border-amber-500/40 text-amber-300 font-bold font-mono px-3 py-1 rounded-lg text-xs outline-none cursor-pointer"
                  >
                    {activeLineData.map((d) => (
                      <option key={d.timeLabel} value={d.timeLabel}>
                        {d.timeLabel}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">Balance:</span>
                    <span className={`font-extrabold ${selectedTrendMetric["Net Balance"] >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      ${selectedTrendMetric["Net Balance"]}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">Expense Ratio:</span>
                    <span className="font-extrabold text-amber-300">
                      {selectedTrendMetric["Expense Ratio"]}%
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">Savings Rate:</span>
                    <span className={`font-extrabold ${selectedTrendMetric["Savings Rate"] >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {selectedTrendMetric["Savings Rate"]}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Category Pie Chart Section with Dropdown Filter */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-200 text-xs sm:text-sm">🍰 Category Pie Chart</h3>
            <p className="text-[10px] text-slate-400">Breakdown, percentages, and share of spending & income</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Filter Mode:</span>
            <select
              value={pieFilter}
              onChange={(e) => setPieFilter(e.target.value as any)}
              className="bg-slate-950 border border-amber-500/40 text-amber-300 font-bold px-3 py-1.5 rounded-xl text-xs outline-none cursor-pointer"
            >
              <option value="EXPENSE">Expense Categories</option>
              <option value="INCOME">Income Categories</option>
              <option value="COMBINED">Combined Income & Expense Categories</option>
            </select>
          </div>
        </div>

        {(() => {
          let chartData: { name: string; value: number; color?: string }[] = [];
          if (pieFilter === "EXPENSE") {
            chartData = Object.keys(expenseCategoryTotals).map((cat, idx) => ({
              name: cat,
              value: expenseCategoryTotals[cat],
              color: CATEGORY_COLORS[cat] || DEFAULT_PIE_COLORS[idx % DEFAULT_PIE_COLORS.length],
            }));
          } else if (pieFilter === "INCOME") {
            chartData = Object.keys(incomeCategoryTotals).map((cat, idx) => ({
              name: cat,
              value: incomeCategoryTotals[cat],
              color: INCOME_COLORS[cat] || DEFAULT_PIE_COLORS[(idx + 2) % DEFAULT_PIE_COLORS.length],
            }));
          } else {
            // COMBINED
            const expenseData = Object.keys(expenseCategoryTotals).map((cat, idx) => ({
              name: `💸 [Expense] ${cat}`,
              value: expenseCategoryTotals[cat],
              color: CATEGORY_COLORS[cat] || DEFAULT_PIE_COLORS[idx % DEFAULT_PIE_COLORS.length],
            }));
            const incomeData = Object.keys(incomeCategoryTotals).map((cat, idx) => ({
              name: `💵 [Income] ${cat}`,
              value: incomeCategoryTotals[cat],
              color: INCOME_COLORS[cat] || DEFAULT_PIE_COLORS[(idx + 3) % DEFAULT_PIE_COLORS.length],
            }));
            chartData = [...expenseData, ...incomeData];
          }

          if (chartData.length === 0) {
            return <p className="text-xs text-slate-500 text-center py-6">No category data available for selected filter</p>;
          }

          const grandTotal = chartData.reduce((acc, curr) => acc + curr.value, 0);

          return (
            <>
              <div className="h-64 sm:h-72 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 12, right: 38, left: 38, bottom: 12 }}>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={36}
                      outerRadius={64}
                      paddingAngle={3}
                      dataKey="value"
                      label={renderCustomizedPieLabel}
                      labelLine={{ stroke: "#64748b", strokeWidth: 1.5 }}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`pie-cell-${index}`}
                          fill={entry.color || DEFAULT_PIE_COLORS[index % DEFAULT_PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        `$${Number(val).toFixed(2)} (${grandTotal > 0 ? ((Number(val) / grandTotal) * 100).toFixed(1) : 0}%)`,
                        name,
                      ]}
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Breakdown Cards */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Category Breakdown & Share:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {chartData.map((item, idx) => {
                    const pct = grandTotal > 0 ? (item.value / grandTotal) * 100 : 0;
                    return (
                      <div
                        key={item.name}
                        className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span
                              className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="font-bold text-slate-100 text-xs sm:text-sm truncate" title={item.name}>
                              {item.name}
                            </span>
                          </div>
                          <div className="text-right shrink-0 font-mono">
                            <span className="font-bold text-slate-100 text-xs sm:text-sm block">
                              ${item.value.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-amber-300 font-semibold block">
                              {pct.toFixed(1)}% Share
                            </span>
                          </div>
                        </div>

                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: item.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Payment Method Breakdown Card */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-200 text-xs sm:text-sm">💳 Payment Method Statistics</h3>
            <p className="text-[10px] text-slate-400">Separated totals for Cash, Credit Card, Apple Pay, OTC Card & Gift Cards</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
          {Object.entries(paymentMethodTotals).map(([method, data]) => {
            const isCash = method === "Cash";
            const isCredit = method === "Credit Card";
            const isOTC = method === "OTC Card";
            const isGift = method === "Gift Card";

            return (
              <div
                key={method}
                className={`bg-slate-950 p-3 rounded-xl border space-y-2 ${
                  isCash
                    ? "border-emerald-500/30"
                    : isCredit
                    ? "border-sky-500/30"
                    : isOTC
                    ? "border-teal-500/30"
                    : isGift
                    ? "border-purple-500/30"
                    : "border-slate-800"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                    <span>
                      {isCash ? "💵" : isCredit ? "💳" : isOTC ? "🏥" : isGift ? "🎁" : "📱"}
                    </span>
                    <span>{method}</span>
                  </span>
                  <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded-full border border-slate-800 font-mono">
                    {data.count} txns
                  </span>
                </div>

                <div className="space-y-1 font-mono text-[11px] pt-1 border-t border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-sans text-[10px]">Expenses Paid:</span>
                    <span className="font-bold text-rose-400">-${data.expense.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-sans text-[10px]">Income Received:</span>
                    <span className="font-bold text-emerald-400">+${data.income.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly / Two-Month / Yearly Bar Comparison Section */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-200 text-xs sm:text-sm">📊 Income vs Expense Bar Chart</h3>
            <p className="text-[10px] text-slate-400">Monthly bar overview, two-month comparison, and yearly comparison</p>
          </div>

          {/* Mode Selector Tabs */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs font-bold gap-1">
            <button
              onClick={() => setBarCompareMode("all_months")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                barCompareMode === "all_months"
                  ? "bg-amber-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              📊 All Months
            </button>
            <button
              onClick={() => setBarCompareMode("two_months")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                barCompareMode === "two_months"
                  ? "bg-amber-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              ⚖️ Two-Month
            </button>
            <button
              onClick={() => setBarCompareMode("yearly")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                barCompareMode === "yearly"
                  ? "bg-amber-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              🗓️ Yearly
            </button>
          </div>
        </div>

        {/* MODE 1: All Months Bar Chart */}
        {barCompareMode === "all_months" && (
          <div>
            {monthlyChartData.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No monthly data available</p>
            ) : (
              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData} margin={{ top: 25, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      formatter={(val: any, name: any) => [`$${Number(val).toFixed(2)}`, name]}
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", fontSize: "12px" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]}>
                      <LabelList
                        dataKey="Income"
                        position="top"
                        formatter={(val: number) => (val > 0 ? `$${val.toFixed(0)}` : "")}
                        fill="#34d399"
                        fontSize={10}
                        fontWeight="bold"
                      />
                    </Bar>
                    <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]}>
                      <LabelList
                        dataKey="Expense"
                        position="top"
                        formatter={(val: number) => (val > 0 ? `$${val.toFixed(0)}` : "")}
                        fill="#fb7185"
                        fontSize={10}
                        fontWeight="bold"
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* MODE 2: Two Months Comparison */}
        {barCompareMode === "two_months" && (
          <div className="space-y-4 pt-1">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-300">Base Period (A):</span>
                <select
                  value={compareMonthA}
                  onChange={(e) => setCompareMonthA(e.target.value)}
                  className="bg-slate-900 border border-amber-500/40 text-amber-300 font-bold font-mono px-3 py-1.5 rounded-lg text-xs outline-none cursor-pointer"
                >
                  {renderPeriodOptions("comp-a")}
                </select>
              </div>

              <span className="text-amber-400 font-bold text-sm">VS</span>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-300">Target Period (B):</span>
                <select
                  value={compareMonthB}
                  onChange={(e) => setCompareMonthB(e.target.value)}
                  className="bg-slate-900 border border-emerald-500/40 text-emerald-300 font-bold font-mono px-3 py-1.5 rounded-lg text-xs outline-none cursor-pointer"
                >
                  {renderPeriodOptions("comp-b")}
                </select>
              </div>
            </div>

            {/* Side by side chart */}
            <div className="h-60 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={twoMonthsChartData} margin={{ top: 25, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    formatter={(val: any, name: any) => [`$${Number(val).toFixed(2)}`, name]}
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", fontSize: "12px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]}>
                    <LabelList
                      dataKey="Income"
                      position="top"
                      formatter={(val: number) => (val > 0 ? `$${val.toFixed(0)}` : "")}
                      fill="#34d399"
                      fontSize={10}
                      fontWeight="bold"
                    />
                  </Bar>
                  <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]}>
                    <LabelList
                      dataKey="Expense"
                      position="top"
                      formatter={(val: number) => (val > 0 ? `$${val.toFixed(0)}` : "")}
                      fill="#fb7185"
                      fontSize={10}
                      fontWeight="bold"
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Variance Statistics Table */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-200 block border-b border-slate-800 pb-1.5">
                Two-Month Comparison ({compareMonthA} ➔ {compareMonthB}):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">Income Change</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-slate-300 font-bold">${monthAData.income.toFixed(0)} ➔ ${monthBData.income.toFixed(0)}</span>
                    <span className={`font-bold ${monthIncomeDiff >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {monthIncomeDiff >= 0 ? `+${monthIncomeDiff.toFixed(2)}` : `${monthIncomeDiff.toFixed(2)}`} ({monthIncomePct}%)
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">Expense Change</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-slate-300 font-bold">${monthAData.expense.toFixed(0)} ➔ ${monthBData.expense.toFixed(0)}</span>
                    <span className={`font-bold ${monthExpenseDiff <= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {monthExpenseDiff >= 0 ? `+${monthExpenseDiff.toFixed(2)}` : `${monthExpenseDiff.toFixed(2)}`} ({monthExpensePct}%)
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">Net Balance Change</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-slate-300 font-bold">
                      ${(monthAData.income - monthAData.expense).toFixed(0)} ➔ ${(monthBData.income - monthBData.expense).toFixed(0)}
                    </span>
                    <span className={`font-bold ${monthBalanceDiff >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {monthBalanceDiff >= 0 ? `+${monthBalanceDiff.toFixed(2)}` : `${monthBalanceDiff.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODE 3: Yearly Comparison */}
        {barCompareMode === "yearly" && (
          <div className="space-y-4 pt-1">
            {yearlyChartData.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No yearly data available</p>
            ) : (
              <>
                <div className="h-60 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yearlyChartData} margin={{ top: 25, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="year" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip
                        formatter={(val: any, name: any) => [`$${Number(val).toFixed(2)}`, name]}
                        contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", fontSize: "12px" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                      <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]}>
                        <LabelList
                          dataKey="Income"
                          position="top"
                          formatter={(val: number) => (val > 0 ? `$${val.toFixed(0)}` : "")}
                          fill="#34d399"
                          fontSize={10}
                          fontWeight="bold"
                        />
                      </Bar>
                      <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]}>
                        <LabelList
                          dataKey="Expense"
                          position="top"
                          formatter={(val: number) => (val > 0 ? `$${val.toFixed(0)}` : "")}
                          fill="#fb7185"
                          fontSize={10}
                          fontWeight="bold"
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Specific Two Years Comparison Tool */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-800 pb-2">
                    <span className="font-bold text-amber-300">🗓️ Yearly (YoY) Comparison:</span>
                    <div className="flex items-center gap-2">
                      <select
                        value={compareYearA}
                        onChange={(e) => setCompareYearA(e.target.value)}
                        className="bg-slate-900 border border-amber-500/40 text-amber-300 font-bold font-mono px-2.5 py-1 rounded-lg text-xs outline-none cursor-pointer"
                      >
                        {transactionYears.map((y) => (
                          <option key={`ya-${y}`} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                      <span className="text-slate-400 font-bold">VS</span>
                      <select
                        value={compareYearB}
                        onChange={(e) => setCompareYearB(e.target.value)}
                        className="bg-slate-900 border border-emerald-500/40 text-emerald-300 font-bold font-mono px-2.5 py-1 rounded-lg text-xs outline-none cursor-pointer"
                      >
                        {transactionYears.map((y) => (
                          <option key={`yb-${y}`} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans">Total Income Comparison</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-slate-300 font-bold">${yearAData.income.toFixed(0)} ➔ ${yearBData.income.toFixed(0)}</span>
                        <span className={`font-bold ${yearIncomeDiff >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {yearIncomeDiff >= 0 ? `+${yearIncomeDiff.toFixed(2)}` : `${yearIncomeDiff.toFixed(2)}`} ({yearIncomePct}%)
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans">Total Expense Comparison</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-slate-300 font-bold">${yearAData.expense.toFixed(0)} ➔ ${yearBData.expense.toFixed(0)}</span>
                        <span className={`font-bold ${yearExpenseDiff <= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {yearExpenseDiff >= 0 ? `+${yearExpenseDiff.toFixed(2)}` : `${yearExpenseDiff.toFixed(2)}`} ({yearExpensePct}%)
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans">Net Balance Comparison</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-slate-300 font-bold">
                          ${(yearAData.income - yearAData.expense).toFixed(0)} ➔ ${(yearBData.income - yearBData.expense).toFixed(0)}
                        </span>
                        <span className={`font-bold ${yearBalanceDiff >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {yearBalanceDiff >= 0 ? `+${yearBalanceDiff.toFixed(2)}` : `${yearBalanceDiff.toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Monthly Bookkeeping Data Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 p-2.5 sm:p-4 rounded-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-200 text-xs sm:text-sm">📅 Monthly Breakdown</h3>
            <p className="text-[10px] text-slate-400">Filter by year and month to view daily income, expenses, and daily balances</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400">Year:</span>
              <select
                value={breakdownYearFilter}
                onChange={(e) => setBreakdownYearFilter(e.target.value)}
                className="bg-slate-950 border border-amber-500/40 text-amber-300 font-bold font-mono px-2 py-1 rounded-xl text-xs outline-none cursor-pointer"
              >
                <option value="ALL">All Years</option>
                {transactionYears.map((y) => (
                  <option key={`by-${y}`} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400">Month:</span>
              <select
                value={breakdownMonthFilter}
                onChange={(e) => setBreakdownMonthFilter(e.target.value)}
                className="bg-slate-950 border border-amber-500/40 text-amber-300 font-bold font-mono px-2 py-1 rounded-xl text-xs outline-none cursor-pointer"
              >
                <option value="ALL">All Months</option>
                <option value="01">01 (Jan)</option>
                <option value="02">02 (Feb)</option>
                <option value="03">03 (Mar)</option>
                <option value="04">04 (Apr)</option>
                <option value="05">05 (May)</option>
                <option value="06">06 (Jun)</option>
                <option value="07">07 (Jul)</option>
                <option value="08">08 (Aug)</option>
                <option value="09">09 (Sep)</option>
                <option value="10">10 (Oct)</option>
                <option value="11">11 (Nov)</option>
                <option value="12">12 (Dec)</option>
              </select>
            </div>
          </div>
        </div>

        {(() => {
          // Filter transactions by breakdownYearFilter & breakdownMonthFilter
          const targetTxs = transactions.filter((t) => {
            if (!t.date) return false;
            const { year: txYear, month: txMonth } = parseDateComponents(t.date);
            const matchesYear = breakdownYearFilter === "ALL" || txYear === breakdownYearFilter;
            const matchesMonth = breakdownMonthFilter === "ALL" || txMonth === breakdownMonthFilter;
            return matchesYear && matchesMonth;
          });

          // Group by Date (YYYY-MM-DD)
          const dailyMap: Record<string, { date: string; income: number; expense: number; count: number }> = {};
          targetTxs.forEach((t) => {
            const dateKey = t.date ? getNormalizedYYYYMMDD(t.date) : "Unknown Date";
            if (!dailyMap[dateKey]) {
              dailyMap[dateKey] = { date: dateKey, income: 0, expense: 0, count: 0 };
            }
            dailyMap[dateKey].count += 1;
            if (t.type === "INCOME") {
              dailyMap[dateKey].income += t.amount;
            } else {
              dailyMap[dateKey].expense += t.amount;
            }
          });

          const dailyRows = Object.values(dailyMap).sort((a, b) => b.date.localeCompare(a.date));

          if (dailyRows.length === 0) {
            return <p className="text-xs text-slate-500 text-center py-6">No daily data for selected month</p>;
          }

          return (
            <div className="w-full rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full table-fixed text-left text-[10px] sm:text-xs">
                <colgroup>
                  <col className="w-[23%]" />
                  <col className="w-[21%]" />
                  <col className="w-[21%]" />
                  <col className="w-[23%]" />
                  <col className="w-[12%]" />
                </colgroup>
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold text-[9px] sm:text-xs uppercase tracking-tight">
                    <th className="py-2 px-1 sm:px-2">Date</th>
                    <th className="py-2 px-1 sm:px-2 text-right text-emerald-400">Income</th>
                    <th className="py-2 px-1 sm:px-2 text-right text-rose-400">Expense</th>
                    <th className="py-2 px-1 sm:px-2 text-right text-amber-300">Balance</th>
                    <th className="py-2 px-1 sm:px-2 text-center">Items</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[9px] xs:text-[10px] sm:text-xs">
                  {dailyRows.map((row) => {
                    const dailyBalance = row.income - row.expense;
                    return (
                      <tr
                        key={row.date}
                        onClick={() => onSelectDate?.(row.date)}
                        className="hover:bg-amber-500/10 cursor-pointer transition-colors group"
                        title={`Click to view transaction details for ${formatDateMMDDYYYY(row.date)}`}
                      >
                        <td className="py-2.5 px-1 sm:px-2 font-bold text-amber-400 group-hover:text-amber-300 group-hover:underline flex items-center gap-1 truncate">
                          <span>{formatDateMMDDYYYY(row.date)}</span>
                          <span className="text-[10px] text-amber-500 group-hover:translate-x-0.5 transition-transform">➔</span>
                        </td>
                        <td className="py-2.5 px-1 sm:px-2 text-right text-emerald-400 font-semibold truncate">
                          {row.income > 0 ? `+$${row.income.toFixed(2)}` : "$0.00"}
                        </td>
                        <td className="py-2.5 px-1 sm:px-2 text-right text-rose-400 font-semibold truncate">
                          {row.expense > 0 ? `-$${row.expense.toFixed(2)}` : "$0.00"}
                        </td>
                        <td
                          className={`py-2.5 px-1 sm:px-2 text-right font-bold truncate ${
                            dailyBalance >= 0 ? "text-amber-300" : "text-rose-400"
                          }`}
                        >
                          ${dailyBalance.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-1 sm:px-2 text-center text-slate-300 font-sans truncate">
                          <span className="bg-slate-800 group-hover:bg-amber-500 group-hover:text-slate-950 px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors">
                            {row.count} 📝
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>
    </div>
  );
};



