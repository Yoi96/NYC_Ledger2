import React, { useState } from "react";
import { Download, Upload, RefreshCw, Shield, Trash2, Check, FileText, Database } from "lucide-react";
import { ExpenseTransaction } from "../types";
import { INITIAL_TRANSACTIONS } from "../data/nycDefaults";

interface SettingsBackupViewProps {
  transactions: ExpenseTransaction[];
  onSetTransactions: (txs: ExpenseTransaction[]) => void;
  onClearTransactions: () => void;
}

export const SettingsBackupView: React.FC<SettingsBackupViewProps> = ({
  transactions,
  onSetTransactions,
  onClearTransactions,
}) => {
  const [importedMessage, setImportedMessage] = useState<string | null>(null);

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `NYC_Ledger_Backup_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export CSV
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
  };

  // Helper to parse CSV lines with quoted commas support
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

  // Import CSV
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
          if (lines.length < 2) {
            alert("CSV table file is empty or missing valid columns!");
            return;
          }

          const parsedTxs: ExpenseTransaction[] = [];
          const startIdx = lines[0].toLowerCase().includes("merchant") || lines[0].toLowerCase().includes("id") ? 1 : 0;

          for (let i = startIdx; i < lines.length; i++) {
            const cols = parseCSVLine(lines[i]);
            if (cols.length >= 3) {
              const id = cols[0] || `tx-csv-${Date.now()}-${i}`;
              const merchant = cols[1] ? cols[1].replace(/^"|"$/g, "") : "CSV Import";
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
            setImportedMessage(`Successfully imported ${parsedTxs.length} CSV records!`);
            setTimeout(() => setImportedMessage(null), 3500);
          } else {
            alert("Could not parse valid transaction rows from the CSV file.");
          }
        } catch (err) {
          alert("Failed to parse CSV file.");
        }
      };
      reader.readAsText(file);
    }
  };

  // Import JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            onSetTransactions(parsed);
            setImportedMessage(`Successfully restored ${parsed.length} transactions from JSON backup!`);
            setTimeout(() => setImportedMessage(null), 3500);
          } else {
            alert("Invalid backup file format!");
          }
        } catch (err) {
          alert("Failed to parse JSON backup file.");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-amber-400" />
          <h2 className="font-extrabold text-slate-100 text-base">Local Data Privacy & Backup Management</h2>
        </div>
        <p className="text-xs text-slate-400">
          All your transaction records are stored securely on your local device (LocalStorage / IndexedDB) with complete privacy.
        </p>
      </div>

      {/* Local Storage Stats */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <h3 className="font-bold text-slate-200 text-xs sm:text-sm flex items-center gap-1.5">
          <Database className="w-4 h-4 text-amber-400" />
          <span>Local Storage Status</span>
        </h3>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Recorded Transactions</span>
            <span className="font-bold text-slate-100 text-base">{transactions.length} items</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Storage Mode</span>
            <span className="font-bold text-emerald-400 text-base">Local Offline Encrypted</span>
          </div>
        </div>
      </div>

      {/* Export & Backup */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <h3 className="font-bold text-slate-200 text-xs sm:text-sm flex items-center gap-1.5">
          <Download className="w-4 h-4 text-amber-400" />
          <span>Export Data Backup</span>
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={handleExportJSON}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold p-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all active:scale-98"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON Backup</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold p-3 rounded-xl flex items-center justify-center gap-1.5 border border-slate-700 transition-all active:scale-98"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Export CSV Table</span>
          </button>
        </div>
      </div>

      {/* Import & Restore */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <h3 className="font-bold text-slate-200 text-xs sm:text-sm flex items-center gap-1.5">
          <Upload className="w-4 h-4 text-amber-400" />
          <span>Import & Restore Data</span>
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <label className="bg-slate-950 hover:bg-slate-900 border border-dashed border-amber-500/30 p-3.5 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all text-center">
            <FileText className="w-5 h-5 text-amber-400 mb-1" />
            <span className="text-xs font-bold text-slate-200">Import CSV Table</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Supports CSV exported from Excel / Sheets</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
            />
          </label>

          <label className="bg-slate-950 hover:bg-slate-900 border border-dashed border-slate-700 p-3.5 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all text-center">
            <Upload className="w-5 h-5 text-slate-400 mb-1" />
            <span className="text-xs font-bold text-slate-200">Import JSON Backup</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Restore data from JSON backup file</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>
        </div>

        {importedMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{importedMessage}</span>
          </div>
        )}
      </div>

      {/* Reset & Demo Data */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <h3 className="font-bold text-slate-200 text-xs sm:text-sm">Reset & Demo Data</h3>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => {
              onSetTransactions(INITIAL_TRANSACTIONS);
              setImportedMessage("Loaded NYC default sample transactions!");
              setTimeout(() => setImportedMessage(null), 3000);
            }}
            className="bg-slate-950 hover:bg-slate-900 text-slate-300 font-medium p-2.5 rounded-xl border border-slate-800 flex items-center justify-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Load NYC Sample Data</span>
          </button>

          <button
            onClick={() => {
              if (confirm("Are you sure you want to clear all data? This action cannot be undone!")) {
                onClearTransactions();
                setImportedMessage("Successfully cleared all transaction data!");
                setTimeout(() => setImportedMessage(null), 3000);
              }
            }}
            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold p-2.5 rounded-xl border border-rose-500/20 flex items-center justify-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
