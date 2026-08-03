import React, { useState, useEffect } from "react";
import { AndroidFrame } from "./components/AndroidFrame";
import { TransactionList } from "./components/TransactionList";
import { NYCToolsView } from "./components/NYCToolsView";
import { AnalyticsView } from "./components/AnalyticsView";
import { SettingsBackupView } from "./components/SettingsBackupView";
import { QuickAddExpenseModal } from "./components/QuickAddExpenseModal";
import { ReceiptScannerModal } from "./components/ReceiptScannerModal";
import { ExpenseTransaction, NYCBorough } from "./types";
import { INITIAL_TRANSACTIONS } from "./data/nycDefaults";
import { getCurrentNYCLocation } from "./utils/geoUtils";
import {
  getOTCCardState,
  saveOTCCardState,
  getGiftCardState,
  saveGiftCardState,
  getOMNYBalance,
  saveOMNYBalance,
  getRecurringIncomes,
  saveRecurringIncomes,
} from "./utils/financialUtils";

const LOCAL_STORAGE_KEY = "NYC_LEDGER_TRANSACTIONS_V1";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("ledger");
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);

  const handleSelectDateFromAnalytics = (date: string) => {
    setSelectedDateFilter(date);
    setActiveTab("ledger");
  };

  // Local state persistence
  const [transactions, setTransactions] = useState<ExpenseTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load transactions from localStorage", e);
    }
    return INITIAL_TRANSACTIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.error("Failed to save transactions to localStorage", e);
    }
  }, [transactions]);

  // Check and apply recurring bank & OTC income monthly
  useEffect(() => {
    const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
    const todayStr = new Date().toISOString().slice(0, 10);
    const recurringList = getRecurringIncomes();
    let updatedList = [...recurringList];
    let addedCount = 0;

    recurringList.forEach((rec, idx) => {
      if (rec.isEnabled && rec.lastAppliedMonth !== currentMonthStr) {
        // Auto-add transaction for this month
        const newTx: ExpenseTransaction = {
          id: "tx-rec-" + Date.now() + "-" + idx,
          merchant: rec.sourceName,
          amount: rec.amount,
          tax: 0,
          tip: 0,
          date: todayStr,
          category: "Income",
          subCategory: rec.sourceName.includes("OTC") ? "OTC Card Monthly Benefit" : "Recurring Bank Direct Deposit",
          borough: "Manhattan",
          neighborhood: "Financial District",
          note: `Auto-generated monthly recurring income (${currentMonthStr})`,
          type: "INCOME",
          paymentMethod: rec.paymentMethod || "Bank Checking ACH",
          createdAt: Date.now() + idx,
        };

        setTransactions((prev) => [newTx, ...prev]);

        // If OTC Income, top up OTC card balance!
        if (rec.paymentMethod === "OTC Card" || rec.sourceName.toLowerCase().includes("otc")) {
          const otcState = getOTCCardState();
          saveOTCCardState({
            ...otcState,
            remainingBalance: otcState.remainingBalance + rec.amount,
          });
        }

        updatedList[idx] = {
          ...rec,
          lastAppliedMonth: currentMonthStr,
        };
        addedCount++;
      }
    });

    if (addedCount > 0) {
      saveRecurringIncomes(updatedList);
    }
  }, []);

  const handleSaveTransaction = (
    txData: Omit<ExpenseTransaction, "id" | "createdAt">
  ) => {
    const newTx: ExpenseTransaction = {
      ...txData,
      id: "tx-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      createdAt: Date.now(),
    };

    // 1. OMNY Card Balance updates
    if (txData.category === "Pay for OMNY Card Balance" || txData.subCategory.includes("Pay for OMNY Card Balance") || txData.subCategory.includes("OMNY Card Top-up")) {
      const curBal = getOMNYBalance();
      saveOMNYBalance(curBal + txData.amount);
    } else if (txData.isOMNY || txData.subCategory.includes("OMNY") || txData.merchant.toLowerCase().includes("omny") || txData.merchant.toLowerCase().includes("mta")) {
      const curBal = getOMNYBalance();
      saveOMNYBalance(Math.max(0, curBal - (txData.amount || 3.0)));
    }

    // 2. OTC Card Balance updates
    if (txData.paymentMethod === "OTC Card") {
      const otcState = getOTCCardState();
      if (txData.type === "INCOME") {
        saveOTCCardState({
          ...otcState,
          remainingBalance: otcState.remainingBalance + txData.amount,
        });
      } else {
        saveOTCCardState({
          ...otcState,
          remainingBalance: Math.max(0, otcState.remainingBalance - txData.amount),
        });
      }
    }

    // 3. Gift Card Balance updates
    if (txData.paymentMethod === "Gift Card") {
      const giftState = getGiftCardState();
      if (txData.type === "INCOME") {
        saveGiftCardState({
          ...giftState,
          remainingBalance: giftState.remainingBalance + txData.amount,
        });
      } else {
        saveGiftCardState({
          ...giftState,
          remainingBalance: Math.max(0, giftState.remainingBalance - txData.amount),
        });
      }
    }

    setTransactions((prev) => [newTx, ...prev]);
  };

  const handleDeleteTransaction = (id: string) => {
    const target = transactions.find((t) => t.id === id);
    if (target) {
      // Restore OMNY balance on deletion
      const isOMNYTx = target.isOMNY || target.category.includes("Transit") || target.subCategory.includes("OMNY") || target.merchant.toLowerCase().includes("omny") || target.merchant.toLowerCase().includes("mta");
      if (isOMNYTx) {
        const curBal = getOMNYBalance();
        saveOMNYBalance(curBal + (target.amount || 3.0));
      }

      // Restore OTC balance on deletion
      if (target.paymentMethod === "OTC Card") {
        const otcState = getOTCCardState();
        if (target.type === "INCOME") {
          saveOTCCardState({
            ...otcState,
            remainingBalance: Math.max(0, otcState.remainingBalance - target.amount),
          });
        } else {
          saveOTCCardState({
            ...otcState,
            remainingBalance: otcState.remainingBalance + target.amount,
          });
        }
      }

      // Restore Gift card balance on deletion
      if (target.paymentMethod === "Gift Card") {
        const giftState = getGiftCardState();
        if (target.type === "INCOME") {
          saveGiftCardState({
            ...giftState,
            remainingBalance: Math.max(0, giftState.remainingBalance - target.amount),
          });
        } else {
          saveGiftCardState({
            ...giftState,
            remainingBalance: giftState.remainingBalance + target.amount,
          });
        }
      }
    }

    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpdateTransaction = (updatedTx: ExpenseTransaction) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === updatedTx.id ? updatedTx : t))
    );
  };

  const handleAddOMNYTap = async (details?: { stationName?: string; subwayLine?: string; borough?: NYCBorough; neighborhood?: string; note?: string }) => {
    let borough: NYCBorough = details?.borough || "Manhattan";
    let neighborhood = details?.neighborhood || "Midtown";
    let stationInfo = details?.stationName || "34 St - Herald Sq";
    let lineInfo = details?.subwayLine ? ` [${details.subwayLine}线]` : "";

    if (!details?.borough || !details?.stationName) {
      try {
        const loc = await getCurrentNYCLocation();
        if (!details?.borough) borough = loc.borough;
        if (!details?.neighborhood) neighborhood = loc.neighborhood;
        if (!details?.stationName && loc.stationName) stationInfo = loc.stationName;
        if (!details?.subwayLine && loc.subwayLine) lineInfo = ` [${loc.subwayLine}线]`;
      } catch {
        // Fallback
      }
    }

    const transactionNote = details?.note || `MTA OMNY Subway Single Ride ($3.00) [${stationInfo}${lineInfo}]`;

    handleSaveTransaction({
      merchant: "MTA OMNY Tap",
      amount: 3.00,
      tax: 0,
      tip: 0,
      date: new Date().toISOString().split("T")[0],
      category: "Transit (MTA/OMNY)",
      subCategory: "MTA Subway (OMNY)",
      borough,
      neighborhood,
      note: transactionNote,
      isOMNY: true,
      paymentMethod: "Apple Pay",
    });
  };

  return (
    <AndroidFrame
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onOpenQuickAdd={() => setIsQuickAddOpen(true)}
      onOpenScan={() => setIsScanOpen(true)}
    >
      {/* 1. Ledger Tab */}
      {activeTab === "ledger" && (
        <TransactionList
          transactions={transactions}
          onDeleteTransaction={handleDeleteTransaction}
          onUpdateTransaction={handleUpdateTransaction}
          onOpenQuickAdd={() => setIsQuickAddOpen(true)}
          onOpenScan={() => setIsScanOpen(true)}
          onSetTransactions={setTransactions}
          selectedDateFilter={selectedDateFilter}
          onClearDateFilter={() => setSelectedDateFilter(null)}
        />
      )}

      {/* 2. NYC Special Tools Tab */}
      {activeTab === "nyc-tools" && (
        <NYCToolsView
          transactions={transactions}
          onAddOMNYTap={handleAddOMNYTap}
          onAddTransaction={handleSaveTransaction}
        />
      )}

      {/* 3. Analytics Tab */}
      {activeTab === "analytics" && (
        <AnalyticsView
          transactions={transactions}
          onSelectDate={handleSelectDateFromAnalytics}
        />
      )}

      {/* 4. Settings & Backup Tab */}
      {activeTab === "settings" && (
        <SettingsBackupView
          transactions={transactions}
          onSetTransactions={setTransactions}
          onClearTransactions={() => setTransactions([])}
        />
      )}

      {/* Quick Add Expense Modal */}
      <QuickAddExpenseModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSaveTransaction={handleSaveTransaction}
      />

      {/* AI Receipt Scanner Modal */}
      <ReceiptScannerModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onSaveTransaction={handleSaveTransaction}
      />
    </AndroidFrame>
  );
}
