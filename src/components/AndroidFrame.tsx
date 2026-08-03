import React, { useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

interface AndroidFrameProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickAdd: () => void;
  onOpenScan: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  activeTab,
  setActiveTab,
  onOpenQuickAdd,
  onOpenScan,
}) => {
  const [isFullWidth, setIsFullWidth] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== "undefined" ? navigator.onLine : true);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-start p-0 md:p-6 transition-colors duration-200 font-sans overflow-x-hidden">
      {/* Container Frame */}
      <div
        className={`w-full transition-all duration-300 ${
          isFullWidth
            ? "max-w-5xl"
            : "max-w-md my-0 md:my-4 rounded-none md:rounded-[40px] border-0 md:border-[8px] border-slate-800 shadow-2xl"
        } bg-slate-950 flex flex-col h-[100dvh] md:h-auto md:min-h-[840px] md:max-h-[920px] overflow-hidden relative`}
      >
        {/* Header App Bar */}
        <div className="bg-slate-900/90 backdrop-blur-md px-4 py-3 border-b border-slate-800/80 flex items-center justify-between z-20 sticky top-0 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20 text-sm">
              NY
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-100 leading-tight flex items-center gap-1.5">
                NYC Ledger
                {isOnline ? (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded-full font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Offline Ready
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded-full font-semibold flex items-center gap-1">
                    ⚡ Offline Mode
                  </span>
                )}
              </h1>
              <p className="text-[11px] text-slate-400">NYC Life · Local Storage & PWA</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Camera Scan FAB button in Header */}
            <button
              onClick={onOpenScan}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 shadow-md shadow-amber-500/20 transition-all active:scale-95 text-center shrink-0"
            >
              <span className="text-sm leading-none">📷</span>
              <span className="text-[10px] font-bold leading-tight">Scan Receipt</span>
            </button>

            {/* Desktop frame toggle */}
            <button
              onClick={() => setIsFullWidth(!isFullWidth)}
              className="hidden md:flex p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              title={isFullWidth ? "Switch to Phone Frame" : "Switch to Wide Frame"}
            >
              {isFullWidth ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 pb-28 bg-slate-950 text-slate-100 scrollbar-thin scrollbar-thumb-slate-800">
          {children}
        </div>

        {/* Android Bottom Navigation Bar */}
        <div className="sticky bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/80 px-1 py-1.5 z-30 grid grid-cols-5 items-center justify-items-center shadow-lg shrink-0">
          <button
            onClick={() => setActiveTab("ledger")}
            className={`w-full h-14 flex flex-col items-center justify-center py-1 px-1 rounded-xl border transition-all text-center ${
              activeTab === "ledger"
                ? "text-amber-400 bg-amber-500/10 font-semibold border-amber-500/30"
                : "text-slate-400 hover:text-slate-200 border-transparent"
            }`}
          >
            <div className="h-6 flex items-center justify-center text-lg leading-none">📋</div>
            <span className="text-[10px] mt-0.5 font-medium whitespace-nowrap">Transactions</span>
          </button>

          <button
            onClick={() => setActiveTab("nyc-tools")}
            className={`w-full h-14 flex flex-col items-center justify-center py-1 px-1 rounded-xl border transition-all text-center ${
              activeTab === "nyc-tools"
                ? "text-amber-400 bg-amber-500/10 font-semibold border-amber-500/30"
                : "text-slate-400 hover:text-slate-200 border-transparent"
            }`}
          >
            <div className="h-6 flex items-center justify-center text-lg leading-none">🗽</div>
            <span className="text-[10px] mt-0.5 font-medium whitespace-nowrap">NYC Tools</span>
          </button>

          {/* Center Floating Quick Add Button */}
          <div className="w-full h-14 flex items-center justify-center relative">
            <button
              onClick={onOpenQuickAdd}
              className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-extrabold flex items-center justify-center text-2xl shadow-lg shadow-amber-500/30 translate-y-0 active:scale-95 transition-all border-2 border-slate-900"
              title="Log Expense or Income"
            >
              +
            </button>
          </div>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`w-full h-14 flex flex-col items-center justify-center py-1 px-1 rounded-xl border transition-all text-center ${
              activeTab === "analytics"
                ? "text-amber-400 bg-amber-500/10 font-semibold border-amber-500/30"
                : "text-slate-400 hover:text-slate-200 border-transparent"
            }`}
          >
            <div className="h-6 flex items-center justify-center text-lg leading-none">📊</div>
            <span className="text-[10px] mt-0.5 font-medium whitespace-nowrap">Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full h-14 flex flex-col items-center justify-center py-1 px-1 rounded-xl border transition-all text-center ${
              activeTab === "settings"
                ? "text-amber-400 bg-amber-500/10 font-semibold border-amber-500/30"
                : "text-slate-400 hover:text-slate-200 border-transparent"
            }`}
          >
            <div className="h-6 flex items-center justify-center text-lg leading-none">⚙️</div>
            <span className="text-[10px] mt-0.5 font-medium whitespace-nowrap">Backup</span>
          </button>
        </div>
      </div>
    </div>
  );
};
