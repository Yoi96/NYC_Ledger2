import React, { useState, useEffect } from "react";
import { Search, Filter, Trash2, Tag, Calendar, MapPin, Receipt, CheckCircle, ChevronRight, AlertCircle, ZoomIn, Download, Upload, FileSpreadsheet, Check, CreditCard } from "lucide-react";
import { ExpenseTransaction, NYCExpenseCategory, NYCBorough } from "../types";
import { NYC_BOROUGHS, NYC_CATEGORIES } from "../data/nycDefaults";
import { parseDateComponents, getNormalizedYYYYMM, getNormalizedYYYYMMDD, formatDateMMDDYYYY, matchesDateSearch } from "../utils/dateUtils";
import { ImageLightboxModal } from "./ImageLightboxModal";
import { CategoryIcon } from "./CategoryIcon";
import { getOTCCardState, getGiftCardState } from "../utils/financialUtils";

interface TransactionListProps {
  transactions: ExpenseTransaction[];
  onDeleteTransaction: (id: string) => void;
  onUpdateTransaction?: (tx: ExpenseTransaction) => void;
  onOpenQuickAdd: () => void;
  onOpenScan: () => void;
  onSetTransactions?: (txs: ExpenseTransaction[]) => void;
  selectedDateFilter?: string | null;
  onClearDateFilter?: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onDeleteTransaction,
  onUpdateTransaction,
  onOpenQuickAdd,
  onOpenScan,
  onSetTransactions,
  selectedDateFilter,
  onClearDateFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");
  const [selectedDay, setSelectedDay] = useState<string>("ALL");
  const [selectedTxDetail, setSelectedTxDetail] = useState<ExpenseTransaction | null>(null);
  const [isEditingTx, setIsEditingTx] = useState(false);
  const [editMerchant, setEditMerchant] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editCategory, setEditCategory] = useState<string>("Dining & Bodega");
  const [editSubCategory, setEditSubCategory] = useState("");
  const [editBorough, setEditBorough] = useState<NYCBorough>("Manhattan");
  const [editNeighborhood, setEditNeighborhood] = useState("");
  const [editTax, setEditTax] = useState("");
  const [editTip, setEditTip] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState("Apple Pay");
  const [editNote, setEditNote] = useState("");
  const [editCustomIcon, setEditCustomIcon] = useState("");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Extract unique YYYY years from transactions
  const availableYears = Array.from(
    new Set<string>(
      transactions
        .map((t) => parseDateComponents(t.date).year)
        .filter((y) => y.length === 4)
    )
  ).sort((a, b) => b.localeCompare(a));

  // Extract unique YYYY-MM months from transactions
  const availableMonths = Array.from(
    new Set<string>(
      transactions
        .map((t) => (t.date ? getNormalizedYYYYMM(t.date) : ""))
        .filter((m) => m.length === 7)
    )
  ).sort((a, b) => b.localeCompare(a));

  const INCOME_CATEGORY_LIST = [
    "Salary / Wages",
    "Freelance & Side Job",
    "Secondhand Sales",
    "Investment & Interest",
    "Gift & Reimbursement",
    "Other Income",
  ];

  const startEditingTx = (tx: ExpenseTransaction) => {
    setSelectedTxDetail(tx);
    setEditMerchant(tx.merchant);
    setEditAmount(tx.amount.toString());
    setEditDate(tx.date);
    setEditCategory(tx.category);
    setEditSubCategory(tx.subCategory);
    setEditBorough(tx.borough);
    setEditNeighborhood(tx.neighborhood);
    setEditTax(tx.tax ? tx.tax.toString() : "0");
    setEditTip(tx.tip ? tx.tip.toString() : "0");
    setEditPaymentMethod(tx.paymentMethod || (tx.type === "INCOME" ? "Direct Deposit / ACH" : "Apple Pay"));
    setEditNote(tx.note || "");
    setEditCustomIcon(tx.customIcon || "");
    setIsEditingTx(true);
  };

  const handleSaveTxEdit = () => {
    if (!selectedTxDetail) return;
    const updated: ExpenseTransaction = {
      ...selectedTxDetail,
      merchant: editMerchant || selectedTxDetail.merchant,
      amount: parseFloat(editAmount) || selectedTxDetail.amount,
      date: editDate || selectedTxDetail.date,
      category: editCategory,
      subCategory: editSubCategory,
      borough: editBorough,
      neighborhood: editNeighborhood,
      tax: selectedTxDetail.type === "INCOME" ? 0 : parseFloat(editTax) || 0,
      tip: selectedTxDetail.type === "INCOME" ? 0 : parseFloat(editTip) || 0,
      paymentMethod: editPaymentMethod,
      note: editNote,
      customIcon: editCustomIcon || undefined,
    };

    if (onUpdateTransaction) {
      onUpdateTransaction(updated);
    } else if (onSetTransactions) {
      onSetTransactions(transactions.map((t) => (t.id === updated.id ? updated : t)));
    }
    setSelectedTxDetail(updated);
    setIsEditingTx(false);
    setStatusMsg("Transaction updated successfully!");
    setTimeout(() => setStatusMsg(null), 2500);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ["ID", "Merchant", "Amount", "Tax", "Tip", "Category", "SubCategory", "Borough", "Neighborhood", "Date", "Note"];
    const rows = transactions.map((t) => [
      t.id,
      `"${t.merchant.replace(/"/g, '""')}"`,
      t.amount,
      t.tax,
      t.tip,
      `"${t.category}"`,
      `"${t.subCategory}"`,
      `"${t.borough}"`,
      `"${t.neighborhood}"`,
      t.date,
      `"${(t.note || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `NYC_Ledger_Export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setStatusMsg("CSV file exported successfully!");
    setTimeout(() => setStatusMsg(null), 3000);
  };

  // CSV Import Helper
  const parseCSVLine = (text: string) => {
    const result: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (inQuotes && text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = "";
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onSetTransactions) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
          if (lines.length < 2) {
            alert("The CSV file format is incorrect!");
            return;
          }

          const parsedTxs: ExpenseTransaction[] = [];
          const startIdx = lines[0].toLowerCase().includes("merchant") || lines[0].toLowerCase().includes("id") ? 1 : 0;

          for (let i = startIdx; i < lines.length; i++) {
            const cols = parseCSVLine(lines[i]);
            if (cols.length >= 3) {
              const id = cols[0] || `tx-csv-${Date.now()}-${i}`;
              const merchant = cols[1] ? cols[1].replace(/^"|"$/g, "") : "Excel Import";
              const amount = parseFloat(cols[2]) || 0;
              const tax = parseFloat(cols[3]) || 0;
              const tip = parseFloat(cols[4]) || 0;
              const category = (cols[5] ? cols[5].replace(/^"|"$/g, "") : "Other") as any;
              const subCategory = cols[6] ? cols[6].replace(/^"|"$/g, "") : "General";
              const borough = (cols[7] ? cols[7].replace(/^"|"$/g, "") : "Manhattan") as any;
              const neighborhood = cols[8] ? cols[8].replace(/^"|"$/g, "") : "Midtown";
              const date = cols[9] || new Date().toISOString().split("T")[0];
              const note = cols[10] ? cols[10].replace(/^"|"$/g, "") : "";

              parsedTxs.push({
                id,
                merchant,
                amount,
                tax,
                tip,
                category,
                subCategory,
                borough,
                neighborhood,
                date,
                note,
                isOMNY: merchant.toLowerCase().includes("omny") || subCategory.toLowerCase().includes("omny"),
                paymentMethod: "CSV Import",
                createdAt: Date.now() - i,
              });
            }
          }

          if (parsedTxs.length > 0) {
            onSetTransactions(parsedTxs);
            setStatusMsg(`Successfully imported ${parsedTxs.length} transactions from CSV!`);
            setTimeout(() => setStatusMsg(null), 3500);
          }
        } catch {
          alert("Failed to parse the CSV file.");
        }
      };
      reader.readAsText(file);
    }
  };

  // OTC & Gift Card State
  const [otcState, setOtcState] = useState(getOTCCardState());
  const [giftState, setGiftState] = useState(getGiftCardState());

  useEffect(() => {
    const syncBalances = () => {
      setOtcState(getOTCCardState());
      setGiftState(getGiftCardState());
    };
    window.addEventListener("nyc_otc_state_updated", syncBalances);
    window.addEventListener("nyc_gift_card_updated", syncBalances);
    return () => {
      window.removeEventListener("nyc_otc_state_updated", syncBalances);
      window.removeEventListener("nyc_gift_card_updated", syncBalances);
    };
  }, []);

  // Filter transactions with full date search support
  const filtered = transactions.filter((tx) => {
    // If selectedDateFilter is present, strictly match date YYYY-MM-DD
    if (selectedDateFilter) {
      const txNormalizedDate = getNormalizedYYYYMMDD(tx.date);
      if (txNormalizedDate !== selectedDateFilter) {
        return false;
      }
    }

    const searchLower = searchTerm.toLowerCase().trim();
    const formattedDateStr = formatDateMMDDYYYY(tx.date).toLowerCase();
    
    const matchesSearch =
      !searchLower ||
      tx.merchant.toLowerCase().includes(searchLower) ||
      tx.date.toLowerCase().includes(searchLower) ||
      formattedDateStr.includes(searchLower) ||
      matchesDateSearch(tx.date, searchLower) ||
      tx.category.toLowerCase().includes(searchLower) ||
      tx.subCategory.toLowerCase().includes(searchLower) ||
      tx.borough.toLowerCase().includes(searchLower) ||
      (tx.paymentMethod && tx.paymentMethod.toLowerCase().includes(searchLower)) ||
      (tx.note && tx.note.toLowerCase().includes(searchLower)) ||
      (tx.neighborhood && tx.neighborhood.toLowerCase().includes(searchLower)) ||
      tx.amount.toString().includes(searchLower);

    const matchesCategory =
      selectedCategory === "ALL" ||
      tx.category === selectedCategory ||
      tx.subCategory === selectedCategory;

    const { year: txYear, month: txMonth, day: txDay } = parseDateComponents(tx.date);

    const matchesYear = selectedYear === "ALL" || txYear === selectedYear;
    const matchesMonth = selectedMonth === "ALL" || txMonth === selectedMonth;
    const matchesDay = selectedDay === "ALL" || txDay === selectedDay;

    return matchesSearch && matchesCategory && matchesYear && matchesMonth && matchesDay;
  });

  // Automatically sort all transactions by date descending (newest date first, then createdAt)
  filtered.sort((a, b) => {
    const dateCmp = (b.date || "").localeCompare(a.date || "");
    if (dateCmp !== 0) return dateCmp;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  // Calculate totals
  const currentYYYYMM = new Date().toISOString().slice(0, 7);
  let monthlyIncome = 0;
  let monthlyExpense = 0;
  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach((tx) => {
    const isIncome = tx.type === "INCOME";
    const isCurrentMonth = getNormalizedYYYYMM(tx.date) === currentYYYYMM;

    if (isIncome) {
      totalIncome += tx.amount;
      if (isCurrentMonth) monthlyIncome += tx.amount;
    } else {
      totalExpense += tx.amount;
      if (isCurrentMonth) monthlyExpense += tx.amount;
    }
  });

  const monthlyBalance = monthlyIncome - monthlyExpense;
  const totalBalance = totalIncome - totalExpense;

  const totalSpent = filtered.filter((t) => t.type !== "INCOME").reduce((acc, curr) => acc + curr.amount, 0);
  const totalTax = filtered.reduce((acc, curr) => acc + (curr.tax || 0), 0);
  const totalTips = filtered.reduce((acc, curr) => acc + (curr.tip || 0), 0);
  const omnyTapsCount = filtered.filter((tx) => tx.isOMNY || tx.subCategory.includes("OMNY")).length;

  return (
    <div className="space-y-4">
      {/* Date Filter Selected Banner (if navigate from Monthly Breakdown) */}
      {selectedDateFilter && (
        <div className="bg-amber-500/15 border border-amber-500/40 p-3 rounded-2xl flex items-center justify-between text-xs text-amber-200 shadow-xl">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">📅</span>
            <div>
              <p className="font-bold text-amber-300">
                Filtered for Date: <span className="font-mono underline">{formatDateMMDDYYYY(selectedDateFilter)}</span>
              </p>
              <p className="text-[10px] text-amber-400/80">
                Found {filtered.length} transaction record{filtered.length === 1 ? "" : "s"} on this day
              </p>
            </div>
          </div>
          {onClearDateFilter && (
            <button
              type="button"
              onClick={onClearDateFilter}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-3 py-1.5 rounded-xl text-xs transition-all shadow shrink-0 cursor-pointer"
            >
              Show All Dates ✕
            </button>
          )}
        </div>
      )}
      {/* Monthly & Total Financial Summary Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 p-4 rounded-2xl shadow-xl relative overflow-hidden space-y-3">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
            🍎 NYC Financial Overview ({currentYYYYMM})
          </span>
          <span className="text-xs text-slate-400">{filtered.length} entries</span>
        </div>

        {/* 6 Core Financial Metrics Display */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Monthly Block */}
          <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-bold text-amber-400/90 block">Monthly Overview</span>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Monthly Income:</span>
              <span className="font-mono font-bold text-emerald-400">+${monthlyIncome.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Monthly Expense:</span>
              <span className="font-mono font-bold text-rose-400">-${monthlyExpense.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-800/80">
              <span className="text-slate-300 font-semibold">Monthly Balance:</span>
              <span className={`font-mono font-bold ${monthlyBalance >= 0 ? "text-amber-300" : "text-rose-400"}`}>
                ${monthlyBalance.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Total Block */}
          <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-bold text-sky-400/90 block">All-Time Total</span>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Total Income:</span>
              <span className="font-mono font-bold text-emerald-400">+${totalIncome.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Total Expense:</span>
              <span className="font-mono font-bold text-rose-400">-${totalExpense.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-800/80">
              <span className="text-slate-300 font-semibold">Total Balance:</span>
              <span className={`font-mono font-bold ${totalBalance >= 0 ? "text-sky-300" : "text-rose-400"}`}>
                ${totalBalance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div>
            <p className="text-[10px] text-slate-400 font-medium">💳 OTC Card Bal</p>
            <p className="font-bold text-teal-300 mt-0.5">${otcState.remainingBalance.toFixed(2)}</p>
          </div>
          
          <div>
            <p className="text-[10px] text-slate-400 font-medium">NYC Tax & Tips</p>
            <p className="font-semibold text-slate-200 mt-0.5">${(totalTax + totalTips).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-medium">MTA OMNY Paid</p>
            <p className="font-semibold text-amber-400 mt-0.5">${(omnyTapsCount * 3.0).toFixed(2)} ({omnyTapsCount} taps)</p>
          </div>
        </div>
      </div>

      {/* Action Bar & Quick Scan */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenScan}
          className="bg-slate-900 hover:bg-slate-800 border border-amber-500/30 px-3.5 py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 text-amber-400 font-semibold text-xs shadow-md transition-all active:scale-98 shrink-0 text-center"
        >
          <span className="text-base leading-none">📷</span>
          <span className="text-[11px] leading-tight">Scan Receipt</span>
        </button>

        <button
          onClick={onOpenQuickAdd}
          className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 font-bold text-xs shadow-md shadow-amber-500/20 transition-all active:scale-98 text-center"
        >
          <span className="text-base leading-none font-extrabold">+</span>
          <span className="text-[11px] leading-tight">Add Transaction</span>
        </button>
      </div>

      {/* Spreadsheet CSV Export & Import Quick Bar */}
      <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between text-xs gap-2">
        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 shrink-0">
          <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
          <span>Spreadsheet Data:</span>
        </span>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-colors"
          >
            <Download className="w-3 h-3 text-amber-400" />
            <span>Export CSV</span>
          </button>

          <label className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors">
            <Upload className="w-3 h-3 text-amber-400" />
            <span>Import CSV</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {statusMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-xl text-emerald-300 text-xs flex items-center gap-1.5">
          <Check className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search merchant, date (e.g. 08/02, 2026-08-02, Aug), category, neighborhood..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-300 outline-none focus:border-amber-500"
          >
            <option value="ALL">All Categories</option>
            <optgroup label="💵 Income Categories">
              {INCOME_CATEGORY_LIST.map((incCat) => (
                <option key={incCat} value={incCat}>
                  {incCat}
                </option>
              ))}
            </optgroup>
            <optgroup label="💸 Expense Categories">
              {NYC_CATEGORIES.map((cat) => (
                <option key={cat.category} value={cat.category}>
                  {cat.category}
                </option>
              ))}
            </optgroup>
          </select>

          {/* Year Dropdown */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-300 outline-none focus:border-amber-500 font-mono"
          >
            <option value="ALL">All Years</option>
            {availableYears.map((y) => (
              <option key={`y-${y}`} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Month Dropdown */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-300 outline-none focus:border-amber-500 font-mono"
          >
            <option value="ALL">All Months</option>
            <option value="01">01 - Jan</option>
            <option value="02">02 - Feb</option>
            <option value="03">03 - Mar</option>
            <option value="04">04 - Apr</option>
            <option value="05">05 - May</option>
            <option value="06">06 - Jun</option>
            <option value="07">07 - Jul</option>
            <option value="08">08 - Aug</option>
            <option value="09">09 - Sep</option>
            <option value="10">10 - Oct</option>
            <option value="11">11 - Nov</option>
            <option value="12">12 - Dec</option>
          </select>

          {/* Day Dropdown */}
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-300 outline-none focus:border-amber-500 font-mono"
          >
            <option value="ALL">All Days</option>
            {Array.from({ length: 31 }, (_, i) => {
              const d = (i + 1).toString().padStart(2, "0");
              return (
                <option key={`d-${d}`} value={d}>
                  {d}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-8 text-center space-y-2">
            <p className="text-2xl">🗽</p>
            <p className="text-sm font-bold text-slate-300">No matching transactions found</p>
            <p className="text-xs text-slate-500">Try clearing filter criteria or scanning a receipt above</p>
          </div>
        ) : (
          filtered.map((tx) => {
            const catObj = NYC_CATEGORIES.find((c) => c.category === tx.category);
            return (
              <div
                key={tx.id}
                onClick={() => setSelectedTxDetail(tx)}
                className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 p-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <CategoryIcon
                    category={tx.category}
                    subCategory={tx.subCategory}
                    customIcon={tx.customIcon}
                    type={tx.type}
                    size="md"
                  />

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-slate-200 text-xs sm:text-sm group-hover:text-amber-400 transition-colors">
                        {tx.merchant}
                      </h4>
                      {tx.isOMNY && (
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded font-semibold">
                          OMNY
                        </span>
                      )}
                      {tx.nycTaxExempt && (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-semibold">
                          Tax Exempt &lt;$110
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                      <span className="font-semibold text-slate-300">{formatDateMMDDYYYY(tx.date)}</span>
                      <span>·</span>
                      <span>{tx.subCategory || tx.category}</span>
                      {tx.note && (
                        <>
                          <span>·</span>
                          <span className="text-slate-400 italic truncate max-w-[150px] sm:max-w-[220px]">{tx.note}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`font-extrabold text-sm sm:text-base ${tx.type === "INCOME" ? "text-emerald-400" : "text-slate-100"}`}>
                    {tx.type === "INCOME" ? `+$${tx.amount.toFixed(2)}` : `-$${tx.amount.toFixed(2)}`}
                  </span>
                  {tx.type === "INCOME" ? (
                    <p className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20">
                      Income
                    </p>
                  ) : (
                    tx.tip > 0 && <p className="text-[10px] text-slate-500">Incl. ${tx.tip.toFixed(2)} Tip</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Transaction Detail & Edit Modal / Mobile Card */}
      {selectedTxDetail && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <span>{isEditingTx ? "✏️ Edit Transaction" : "📄 Transaction Details"}</span>
              </h3>
              <button
                onClick={() => {
                  setSelectedTxDetail(null);
                  setIsEditingTx(false);
                }}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {isEditingTx ? (
              /* Mobile Edit Form */
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">
                    {selectedTxDetail?.type === "INCOME" ? "Income Source / Company Payer" : "Merchant / Title"}
                  </label>
                  <input
                    type="text"
                    value={editMerchant}
                    onChange={(e) => setEditMerchant(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-medium outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">
                      {selectedTxDetail?.type === "INCOME" ? "Pre-Tax Wage ($)" : "Amount ($)"}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className={`w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-bold outline-none focus:border-amber-400 ${
                        selectedTxDetail?.type === "INCOME" ? "text-emerald-400" : "text-amber-300"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">Date</label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">
                    {selectedTxDetail?.type === "INCOME" ? "Receiving Account / Payment Channel" : "Payment Method"}
                  </label>
                  <select
                    value={editPaymentMethod}
                    onChange={(e) => setEditPaymentMethod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-amber-400"
                  >
                    <option value="Direct Deposit / ACH">Direct Deposit (ACH)</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Zelle">Zelle</option>
                    <option value="Venmo / PayPal">Venmo / PayPal</option>
                    <option value="Cash">Cash</option>
                    <option value="Apple Pay">Apple Pay</option>
                    <option value="Chase Sapphire">Chase Sapphire</option>
                    <option value="Amex Gold">Amex Gold</option>
                    <option value="Citi Double Cash">Citi Double Cash</option>
                    <option value="Capital One Venture">Capital One Venture</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">Category</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none"
                    >
                      {selectedTxDetail?.type === "INCOME"
                        ? INCOME_CATEGORY_LIST.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))
                        : NYC_CATEGORIES.map((c) => (
                            <option key={c.category} value={c.category}>
                              {c.category}
                            </option>
                          ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">Subcategory</label>
                    <input
                      type="text"
                      value={editSubCategory}
                      onChange={(e) => setEditSubCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">Borough</label>
                    <select
                      value={editBorough}
                      onChange={(e) => setEditBorough(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none"
                    >
                      {NYC_BOROUGHS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">Neighborhood</label>
                    <input
                      type="text"
                      value={editNeighborhood}
                      onChange={(e) => setEditNeighborhood(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {selectedTxDetail?.type !== "INCOME" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 font-semibold block mb-1">Sales Tax ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editTax}
                        onChange={(e) => setEditTax(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 font-semibold block mb-1">Tip ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editTip}
                        onChange={(e) => setEditTip(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">
                    Transaction Icon
                  </label>
                  <div className="flex flex-wrap gap-1.5 p-2 bg-slate-950 rounded-xl border border-slate-800 max-h-32 overflow-y-auto">
                    {[
                      { id: "utensils", name: "Meal / Halal", icon: "🍽️" },
                      { id: "coffee", name: "Coffee / Bakery", icon: "☕" },
                      { id: "pizza", name: "Pizza", icon: "🍕" },
                      { id: "shopping-bag", name: "Shopping", icon: "🛍️" },
                      { id: "cart", name: "Groceries", icon: "🛒" },
                      { id: "apple", name: "Fruit", icon: "🍎" },
                      { id: "train", name: "Subway", icon: "🚇" },
                      { id: "bus", name: "Bus", icon: "🚌" },
                      { id: "home", name: "Housing", icon: "🏠" },
                      { id: "zap", name: "Power", icon: "⚡" },
                      { id: "wifi", name: "Wifi", icon: "📶" },
                      { id: "shirt", name: "Fashion", icon: "👕" },
                      { id: "ticket", name: "Show", icon: "🎟️" },
                      { id: "music", name: "Music", icon: "🎵" },
                      { id: "dumbbell", name: "Gym", icon: "🏋️" },
                      { id: "scissors", name: "Salon", icon: "✂️" },
                      { id: "sparkles", name: "Special", icon: "✨" },
                      { id: "credit-card", name: "Card", icon: "💳" },
                      { id: "trending-up", name: "Income", icon: "📈" },
                    ].map((ico) => (
                      <button
                        key={ico.id}
                        type="button"
                        onClick={() => setEditCustomIcon(ico.id === editCustomIcon ? "" : ico.id)}
                        className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1 transition-all border ${
                          editCustomIcon === ico.id
                            ? "bg-amber-500 text-slate-950 font-bold border-amber-400 shadow"
                            : "bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-800"
                        }`}
                      >
                        <span>{ico.icon}</span>
                        <span className="text-[10px]">{ico.name}</span>
                      </button>
                    ))}
                  </div>
                  {editCustomIcon && (
                    <button
                      type="button"
                      onClick={() => setEditCustomIcon("")}
                      className="text-[10px] text-amber-400 hover:underline mt-1 inline-block"
                    >
                      Reset to default category icon
                    </button>
                  )}
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Note</label>
                  <textarea
                    rows={2}
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-amber-400"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditingTx(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTxEdit}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              /* Mobile View Mode */
              <div className="space-y-3 text-xs">
                <div className="text-center py-2.5 bg-slate-950 rounded-xl border border-slate-800 relative flex flex-col items-center justify-center">
                  <button
                    type="button"
                    onClick={() => startEditingTx(selectedTxDetail)}
                    className="absolute top-2 right-2 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-bold flex items-center gap-1"
                  >
                    ✏️ Edit
                  </button>
                  <div className="mb-1">
                    <CategoryIcon
                      category={selectedTxDetail.category}
                      subCategory={selectedTxDetail.subCategory}
                      customIcon={selectedTxDetail.customIcon}
                      type={selectedTxDetail.type}
                      size="lg"
                    />
                  </div>
                  <p className="text-slate-400 text-xs font-semibold px-8 truncate">{selectedTxDetail.merchant}</p>
                  <p className={`text-3xl font-extrabold my-1 ${selectedTxDetail.type === "INCOME" ? "text-emerald-400" : "text-amber-400"}`}>
                    ${selectedTxDetail.amount.toFixed(2)}
                  </p>
                  <p className="text-[11px] text-slate-500">{formatDateMMDDYYYY(selectedTxDetail.date)} · {selectedTxDetail.paymentMethod || "Direct Deposit"}</p>
                </div>

                <div className="space-y-2 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                  {selectedTxDetail.type === "INCOME" && (
                    <div className="flex justify-between text-emerald-300 bg-emerald-950/30 p-2 rounded-lg border border-emerald-500/20">
                      <span className="text-emerald-400 font-semibold">Pre-Tax Wage / Gross Income:</span>
                      <span className="font-bold text-emerald-300">${selectedTxDetail.amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">
                      {selectedTxDetail.type === "INCOME" ? "Receiving Account / Channel" : "Payment Channel"}
                    </span>
                    <span className="font-semibold">{selectedTxDetail.paymentMethod || "Direct Deposit / ACH"}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Category</span>
                    <span className="font-semibold">{selectedTxDetail.category}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Subcategory</span>
                    <span className="font-semibold">{selectedTxDetail.subCategory}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Borough / Neighborhood</span>
                    <span className="font-semibold">{selectedTxDetail.borough} · {selectedTxDetail.neighborhood}</span>
                  </div>
                  {selectedTxDetail.type !== "INCOME" && (
                    <>
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-500">Sales Tax ($ Tax)</span>
                        <span className="font-semibold">${selectedTxDetail.tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-500">Tip ($ Tip)</span>
                        <span className="font-semibold">${selectedTxDetail.tip.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>

                {selectedTxDetail.note && (
                  <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-amber-300">
                    <span className="font-semibold">Note: </span> {selectedTxDetail.note}
                  </div>
                )}

                {selectedTxDetail.items && selectedTxDetail.items.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-400">Item Breakdown:</p>
                    <div className="space-y-1 max-h-28 overflow-y-auto bg-slate-950 p-2 rounded-lg">
                      {selectedTxDetail.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-slate-300 text-[11px]">
                          <span>{item.name} {item.qty ? `x${item.qty}` : ""}</span>
                          <span>${item.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTxDetail.receiptUrl && (
                  <div>
                    <p className="font-semibold text-slate-400 mb-1 flex items-center justify-between">
                      <span>Receipt Image:</span>
                      <span className="text-[10px] text-amber-400 flex items-center gap-0.5 font-normal">
                        <ZoomIn className="w-3 h-3" /> Click to enlarge
                      </span>
                    </p>
                    <div
                      className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950 max-h-36 flex items-center justify-center cursor-pointer group"
                      onClick={() => setLightboxImage(selectedTxDetail.receiptUrl || null)}
                    >
                      <img
                        src={selectedTxDetail.receiptUrl}
                        alt="Receipt"
                        className="w-full max-h-36 object-contain group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="bg-amber-500 text-slate-950 text-[11px] font-bold px-2.5 py-1 rounded-full shadow flex items-center gap-1">
                          <ZoomIn className="w-3.5 h-3.5" /> Fullscreen View
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800 flex justify-between gap-2">
                  <button
                    onClick={() => {
                      onDeleteTransaction(selectedTxDetail.id);
                      setSelectedTxDetail(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1 border border-rose-500/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEditingTx(selectedTxDetail)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => setSelectedTxDetail(null)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full-screen Lightbox Modal */}
      <ImageLightboxModal
        isOpen={!!lightboxImage}
        imageUrl={lightboxImage}
        title={selectedTxDetail?.merchant ? `${selectedTxDetail.merchant} Receipt` : "Receipt Image"}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
};
