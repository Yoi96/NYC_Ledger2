import React, { useState, useEffect } from "react";
import {
  Shirt,
  Utensils,
  DollarSign,
  Calculator,
  Percent,
  Copy,
  Check,
  Info,
  Sparkles,
  TrendingUp,
  CreditCard,
  Edit2,
  Plus,
  Minus,
  RefreshCw,
  Navigation,
  MapPin,
  Train,
  AlertCircle,
  CheckCircle2,
  Recycle,
  Calendar,
  HelpCircle,
} from "lucide-react";
import { ExpenseTransaction, OMNYState, NYCBorough } from "../types";
import { NYC_SUBWAY_LINES, NYC_SUBWAY_STATIONS, getStationsForLine, getCurrentNYCLocation } from "../utils/geoUtils";
import { NYC_BOROUGHS, NYC_NEIGHBORHOODS } from "../data/nycDefaults";
import {
  getOTCCardState,
  saveOTCCardState,
  getGiftCardState,
  saveGiftCardState,
  getOMNYBalance,
  saveOMNYBalance,
  getRecurringIncomes,
  saveRecurringIncomes,
} from "../utils/financialUtils";

interface NYCToolsViewProps {
  transactions: ExpenseTransaction[];
  onAddOMNYTap: (details?: { stationName?: string; subwayLine?: string; borough?: NYCBorough; neighborhood?: string; note?: string }) => void;
  onAddTransaction?: (tx: Omit<ExpenseTransaction, "id" | "createdAt">) => void;
}

export const NYCToolsView: React.FC<NYCToolsViewProps> = ({
  transactions = [],
  onAddOMNYTap,
  onAddTransaction,
}) => {
  const [activeTab, setActiveTab] = useState<"omny" | "otc" | "bottle" | "meals" | "tax" | "tip" | "paycheck">("omny");

  // Sync OMNY Balance & OTC Card state on external updates
  useEffect(() => {
    const syncFinancials = () => {
      setOmnyBalance(getOMNYBalance());
      setOtcState(getOTCCardState());
    };
    window.addEventListener("nyc_omny_balance_updated", syncFinancials);
    window.addEventListener("nyc_otc_state_updated", syncFinancials);
    return () => {
      window.removeEventListener("nyc_omny_balance_updated", syncFinancials);
      window.removeEventListener("nyc_otc_state_updated", syncFinancials);
    };
  }, []);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showSuccessToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Confirmation Modal state
  const [confirmModalData, setConfirmModalData] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const triggerConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModalData({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        setConfirmModalData((prev) => ({ ...prev, isOpen: false }));
        onConfirm();
      },
    });
  };

  // ==================== OTC CARD TOOL STATE ====================
  const [otcState, setOtcState] = useState(() => getOTCCardState());
  const [isEditingOTCModal, setIsEditingOTCModal] = useState(false);
  const [otcAllowanceInput, setOtcAllowanceInput] = useState(otcState.monthlyAllowance.toString());
  const [otcReloadDateInput, setOtcReloadDateInput] = useState(otcState.nextReloadDate);
  const [otcCardNameInput, setOtcCardNameInput] = useState(otcState.cardName || "NYC OTC Benefit Allowance Card");
  
  // Quick Log OTC Purchase form state
  const [otcItemName, setOtcItemName] = useState("Multivitamins & First Aid Supplies");
  const [otcItemPrice, setOtcItemPrice] = useState("24.50");
  const [otcMerchantInput, setOtcMerchantInput] = useState("CVS Pharmacy / Duane Reade");
  const [otcBoroughInput, setOtcBoroughInput] = useState<NYCBorough>("Manhattan");

  const handleSaveOTCSettings = () => {
    const allowVal = parseFloat(otcAllowanceInput);
    if (isNaN(allowVal) || allowVal <= 0) return;
    const updated = {
      ...otcState,
      monthlyAllowance: allowVal,
      totalBalance: allowVal,
      remainingBalance: Math.min(allowVal, otcState.remainingBalance),
      nextReloadDate: otcReloadDateInput || "2026-09-01",
      cardName: otcCardNameInput,
    };
    saveOTCCardState(updated);
    setOtcState(updated);
    setIsEditingOTCModal(false);
    showSuccessToast("💳 OTC Benefit Card settings updated successfully!");
  };

  const handleLogOTCPurchase = () => {
    const priceNum = parseFloat(otcItemPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;

    if (priceNum > otcState.remainingBalance) {
      alert(`Insufficient OTC Card balance! Current remaining balance: $${otcState.remainingBalance.toFixed(2)}`);
      return;
    }

    if (onAddTransaction) {
      onAddTransaction({
        merchant: otcMerchantInput || "CVS / Walgreens OTC",
        amount: Number(priceNum.toFixed(2)),
        date: new Date().toISOString().split("T")[0],
        category: "Services",
        subCategory: "OTC Card Health Purchase",
        borough: otcBoroughInput,
        neighborhood: "Local Pharmacy",
        note: `[OTC Benefit] ${otcItemName} ($${priceNum.toFixed(2)}). Paid with OTC Card. Remaining OTC: $${(otcState.remainingBalance - priceNum).toFixed(2)}`,
        paymentMethod: "OTC Card",
      });
    }

    const updated = {
      ...otcState,
      usedAmount: (otcState.usedAmount || 0) + priceNum,
      remainingBalance: Math.max(0, otcState.remainingBalance - priceNum),
    };
    saveOTCCardState(updated);
    setOtcState(updated);
    showSuccessToast(`✅ Logged OTC Purchase: ${otcItemName} ($${priceNum.toFixed(2)})! Remaining OTC Balance: $${updated.remainingBalance.toFixed(2)}`);
  };

  // ==================== OMNY STORED BALANCE & REFILL ====================
  const [omnyBalance, setOmnyBalance] = useState<number>(() => getOMNYBalance());
  const [isPayOMNYModalOpen, setIsPayOMNYModalOpen] = useState(false);
  const [payOMNYAmountInput, setPayOMNYAmountInput] = useState("35.00");
  const [payOMNYPaymentMethod, setPayOMNYPaymentMethod] = useState("Credit Card");

  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState(omnyBalance.toFixed(2));

  const handleSaveBalance = () => {
    const newBal = parseFloat(balanceInput);
    if (isNaN(newBal)) return;
    const valid = Math.max(0, newBal);
    setOmnyBalance(valid);
    setBalanceInput(valid.toFixed(2));
    saveOMNYBalance(valid);
    setIsEditingBalance(false);
    showSuccessToast(`💳 OMNY Card Balance updated to $${valid.toFixed(2)}`);
  };

  const handleConfirmPayOMNYBalance = () => {
    const amountNum = parseFloat(payOMNYAmountInput);
    if (isNaN(amountNum) || amountNum <= 0) return;

    triggerConfirmation(
      "Confirm OMNY Balance Top-up",
      `Are you sure you want to add $${amountNum.toFixed(2)} to your OMNY Card balance and record this transaction?`,
      () => {
        if (onAddTransaction) {
          onAddTransaction({
            merchant: "OMNY Card Balance Refill",
            amount: amountNum,
            date: new Date().toISOString().split("T")[0],
            category: "Transit (MTA/OMNY)",
            subCategory: "OMNY Fare Card",
            borough: "Manhattan",
            neighborhood: "Midtown",
            note: `[OMNY Refill] Top-up via ${payOMNYPaymentMethod}. Balance updated from $${omnyBalance.toFixed(2)} to $${(omnyBalance + amountNum).toFixed(2)}`,
            paymentMethod: payOMNYPaymentMethod,
            isOMNY: true,
          });
        }
        const updated = omnyBalance + amountNum;
        setOmnyBalance(updated);
        saveOMNYBalance(updated);
        setIsPayOMNYModalOpen(false);
        showSuccessToast(`✅ Successfully topped up $${amountNum.toFixed(2)} to OMNY Balance! New Balance: $${updated.toFixed(2)}`);
      }
    );
  };

  // ==================== OMNY SUBWAY & BUS SELECTION ====================
  const [transitMode, setTransitMode] = useState<"subway" | "bus">("subway");
  const [selectedBusRoute, setSelectedBusRoute] = useState<string>("M15 SBS");
  const [transferRoute, setTransferRoute] = useState<string>("Direct (No Transfer)");

  const [departureSubwayLine, setDepartureSubwayLine] = useState<string>("D Train");
  const [departureStation, setDepartureStation] = useState<string>("20th Ave");
  const [departureBorough, setDepartureBorough] = useState<NYCBorough>("Brooklyn");

  const [destSubwayLine, setDestSubwayLine] = useState<string>("BDFM Train");
  const [destStation, setDestStation] = useState<string>("34 St - Herald Sq");
  const [destBorough, setDestBorough] = useState<NYCBorough>("Manhattan");

  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationMsg, setLocationMsg] = useState<string | null>(null);

  // Available stations for current selected line
  const cleanLineCode = departureSubwayLine.replace(" Train", "");
  const availableDepartureStations = getStationsForLine(cleanLineCode);

  const cleanDestLineCode = destSubwayLine.replace(" Train", "");
  const availableDestStations = getStationsForLine(cleanDestLineCode);

  const handleAutoLocate = async () => {
    setIsLocating(true);
    setLocationMsg(null);
    try {
      const loc = await getCurrentNYCLocation();
      if (loc.borough) setDepartureBorough(loc.borough);
      if (loc.stationName) setDepartureStation(loc.stationName);
      if (loc.subwayLine) {
        setDepartureSubwayLine(`${loc.subwayLine} Train`);
      }
      if (loc.message) {
        setLocationMsg(`📍 Located nearby station: ${loc.borough} · ${loc.stationName}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLocating(false);
    }
  };

  // ==================== OMNY WEEKLY DATA & CAP CALCULATIONS ====================
  const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date(dateStr);
  };

  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  // Filter out balance top-ups, include only actual tap rides
  const omnyTapTransactions = safeTransactions.filter((tx) => {
    if (!tx) return false;
    if (
      tx.merchant?.includes("Refill") ||
      tx.subCategory?.includes("Fare Card") ||
      tx.note?.includes("[OMNY Refill]")
    ) {
      return false;
    }
    if (tx.isOMNY) return true;
    const sub = tx.subCategory || "";
    const merch = (tx.merchant || "").toLowerCase();
    const cat = tx.category || "";
    return (
      sub.includes("OMNY") ||
      sub.includes("Subway") ||
      merch.includes("omny") ||
      merch.includes("mta") ||
      cat.includes("OMNY") ||
      cat.includes("Transit")
    );
  });

  const getWeekMonday = (d: Date) => {
    const dt = new Date(d);
    const day = dt.getDay();
    const diff = dt.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(dt.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const currentWeekMonday = getWeekMonday(new Date());
  const currentWeekEnd = new Date(currentWeekMonday);
  currentWeekEnd.setDate(currentWeekMonday.getDate() + 6);

  const formatShortDate = (d: Date) => {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const weekMap = new Map<
    string,
    {
      startDate: Date;
      endDate: Date;
      taps: ExpenseTransaction[];
      isCurrent: boolean;
    }
  >();

  const currentKey = `${currentWeekMonday.getFullYear()}-${(currentWeekMonday.getMonth() + 1).toString().padStart(2, "0")}-${currentWeekMonday.getDate().toString().padStart(2, "0")}`;
  weekMap.set(currentKey, {
    startDate: currentWeekMonday,
    endDate: currentWeekEnd,
    taps: [],
    isCurrent: true,
  });

  omnyTapTransactions.forEach((tx) => {
    if (!tx.date) return;
    const txDate = parseLocalDate(tx.date);
    const monday = getWeekMonday(txDate);
    const key = `${monday.getFullYear()}-${(monday.getMonth() + 1).toString().padStart(2, "0")}-${monday.getDate().toString().padStart(2, "0")}`;

    if (!weekMap.has(key)) {
      const endD = new Date(monday);
      endD.setDate(monday.getDate() + 6);
      weekMap.set(key, {
        startDate: monday,
        endDate: endD,
        taps: [],
        isCurrent: key === currentKey,
      });
    }
    weekMap.get(key)!.taps.push(tx);
  });

  const sortedWeeks = Array.from(weekMap.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  const [selectedWeekKey, setSelectedWeekKey] = useState<string>(currentKey);

  const activeWeekData = sortedWeeks.find(([k]) => k === selectedWeekKey)?.[1] || sortedWeeks[0]?.[1] || {
    startDate: currentWeekMonday,
    endDate: currentWeekEnd,
    taps: [],
    isCurrent: true,
  };

  const [manualExtraTaps, setManualExtraTaps] = useState<number>(0);
  const totalOMNYCount = activeWeekData.taps.length + (activeWeekData.isCurrent ? Math.max(0, manualExtraTaps) : 0);
  const omnyCapHit = totalOMNYCount >= 12;
  const tapsToCap = Math.max(0, 12 - totalOMNYCount);
  const totalFarePaid = Math.min(totalOMNYCount * 3.00, 35.00);
  const freeRidesCount = Math.max(0, totalOMNYCount - 12);
  const savedAmount = Math.max(0, (totalOMNYCount * 3.00) - totalFarePaid);

  const handleQuickSubwayTap = () => {
    const isBus = transitMode === "bus";
    const lineOrRoute = isBus ? `Bus ${selectedBusRoute}` : departureSubwayLine;
    const stationOrStop = isBus ? `MTA Bus Stop (${selectedBusRoute})` : departureStation;
    const transferNote = transferRoute && transferRoute !== "Direct (No Transfer)" ? ` | Transfer: ${transferRoute}` : "";
    const fullNote = `[${isBus ? "Bus Tap" : "Subway Tap"}] ${lineOrRoute} at ${stationOrStop} (${departureBorough}) ➔ ${destStation} (${destBorough})${transferNote}`;

    if (onAddOMNYTap) {
      onAddOMNYTap({
        stationName: stationOrStop,
        subwayLine: lineOrRoute,
        borough: departureBorough,
        neighborhood: isBus ? "Bus Stop" : "Subway Station",
        note: fullNote,
      });

      // Deduct $3.00 fare from OMNY Card Balance
      const fareAmount = omnyCapHit ? 0 : 3.00;
      if (fareAmount > 0) {
        const newBal = Math.max(0, omnyBalance - fareAmount);
        setOmnyBalance(newBal);
        saveOMNYBalance(newBal);
      }

      showSuccessToast(
        `🚇 Recorded MTA ${isBus ? "Bus" : "Subway"} Tap ($${fareAmount.toFixed(2)})! ${lineOrRoute}. ${
          omnyCapHit ? "🎉 Ride is FREE (Weekly Cap Reached)!" : `Tap #${totalOMNYCount + 1}/12`
        }`
      );
    }
  };

  // ==================== BEVERAGE BOTTLE DEPOSIT ($0.05) STATE ====================
  const [bottleCountInput, setBottleCountInput] = useState<string>("6");
  const [beverageType, setBeverageType] = useState<string>("Water / Soda Cans");
  const [bottleMerchant, setBottleMerchant] = useState<string>("Target / Supermarket");
  const [bottleBorough, setBottleBorough] = useState<NYCBorough>("Queens");

  const parsedBottleCount = Math.max(1, parseInt(bottleCountInput) || 1);
  const bottleDepositFee = parsedBottleCount * 0.05;
  const annualBottleSavings = parsedBottleCount * 0.05 * 52; // weekly purchase

  const handleRecordBottleDeposit = () => {
    if (onAddTransaction) {
      onAddTransaction({
        merchant: bottleMerchant || "NYC Supermarket",
        amount: Number(bottleDepositFee.toFixed(2)),
        date: new Date().toISOString().split("T")[0],
        category: "Groceries",
        subCategory: "Beverage Bottle Deposit ($0.05)",
        borough: bottleBorough,
        neighborhood: "Neighborhood Store",
        note: `[NY Bottle Bill] $0.05 Deposit for ${parsedBottleCount} x ${beverageType} containers ($${bottleDepositFee.toFixed(2)})`,
        paymentMethod: "Apple Pay",
      });
      showSuccessToast(`🥤 Recorded NY $0.05 Bottle Deposit Fee ($${bottleDepositFee.toFixed(2)}) for ${parsedBottleCount} containers!`);
    }
  };

  const handleRecordBottleRefund = () => {
    if (onAddTransaction) {
      onAddTransaction({
        merchant: "NYC Bottle Recycling RVM Center",
        amount: -Number(bottleDepositFee.toFixed(2)), // refund credit
        date: new Date().toISOString().split("T")[0],
        category: "Groceries",
        subCategory: "Bottle Recycling Refund",
        borough: bottleBorough,
        neighborhood: "Recycling Station",
        note: `[Bottle Return Credit] Returned ${parsedBottleCount} empty ${beverageType} containers. Refund received: +$${bottleDepositFee.toFixed(2)}`,
        paymentMethod: "Cash Refund",
      });
      showSuccessToast(`♻️ Recorded Bottle Return Refund Credit +$${bottleDepositFee.toFixed(2)} to ledger!`);
    }
  };

  // ==================== CLOTHING TAX EXEMPTION STATE ====================
  const [itemPrice, setItemPrice] = useState<string>("95.00");
  const [itemQty, setItemQty] = useState<string>("1");
  const priceNum = parseFloat(itemPrice) || 0;
  const qtyNum = parseInt(itemQty) || 1;
  const isClothingTaxExempt = priceNum < 110;
  const itemTotalBase = priceNum * qtyNum;
  const taxIfApplicable = isClothingTaxExempt ? 0 : itemTotalBase * 0.08875;
  const totalWithTax = itemTotalBase + taxIfApplicable;
  const savedTaxAmount = isClothingTaxExempt ? itemTotalBase * 0.08875 : 0;

  // ==================== QUICK MEALS STATE ====================
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "midday" | "bodega">("breakfast");
  const [mealBorough, setMealBorough] = useState<NYCBorough>("Manhattan");
  const [mealTipRate, setMealTipRate] = useState<number>(18);
  const [customMealPrice, setCustomMealPrice] = useState<string>("7.50");
  const [customMealName, setCustomMealName] = useState<string>("Breakfast");
  const [mealPaymentMethod, setMealPaymentMethod] = useState<string>("Credit Card");

  const mealPresets = {
    breakfast: { name: "Breakfast", base: 7.5, desc: "Classic NYC Bacon Egg & Cheese + Coffee", borough: "Manhattan" as NYCBorough },
    lunch: { name: "Lunch", base: 12.5, desc: "Chicken over Rice or Midtown Bento", borough: "Queens" as NYCBorough },
    dinner: { name: "Dinner", base: 18.0, desc: "Authentic Restaurant Feast & Buns", borough: "Queens" as NYCBorough },
    midday: { name: "Mid-day", base: 6.5, desc: "Quick Afternoon Snack or Night Bite", borough: "Brooklyn" as NYCBorough },
    bodega: { name: "Bodega", base: 8.5, desc: "Espresso & Cream Cheese Bagel", borough: "Manhattan" as NYCBorough },
  };

  const selectedPreset = mealPresets[mealType];
  const currentMealBase = parseFloat(customMealPrice) || selectedPreset.base;
  const mealTaxVal = currentMealBase * 0.08875;
  const mealTipVal = currentMealBase * (mealTipRate / 100);
  const mealTotalVal = currentMealBase + mealTaxVal + mealTipVal;

  const handleQuickMealAdd = () => {
    if (onAddTransaction) {
      onAddTransaction({
        merchant: customMealName || selectedPreset.name,
        amount: Number(mealTotalVal.toFixed(2)),
        date: new Date().toISOString().split("T")[0],
        category: "Food & Dining",
        subCategory: "Quick Meal",
        borough: mealBorough,
        neighborhood: "Local Spot",
        note: `[NYC Quick Meal] Base $${currentMealBase.toFixed(2)} + NYC Tax $${mealTaxVal.toFixed(2)} + Tip $${mealTipVal.toFixed(2)} (${mealTipRate}%)`,
        paymentMethod: mealPaymentMethod,
      });
      showSuccessToast(`🍳 Added Meal: ${customMealName || selectedPreset.name} ($${mealTotalVal.toFixed(2)})`);
    }
  };

  // ==================== TIP & SPLIT STATE ====================
  const [billBase, setBillBase] = useState<string>("85.00");
  const [tipPercent, setTipPercent] = useState<number>(18);
  const [splitPeople, setSplitPeople] = useState<number>(2);

  const billBaseNum = parseFloat(billBase) || 0;
  const calculatedTax = billBaseNum * 0.08875;
  const calculatedTip = billBaseNum * (tipPercent / 100);
  const grandTotalBill = billBaseNum + calculatedTax + calculatedTip;
  const perPersonTotal = splitPeople > 0 ? grandTotalBill / splitPeople : grandTotalBill;

  // ==================== RESIDENT PAYCHECK ESTIMATOR STATE ====================
  const [annualSalaryInput, setAnnualSalaryInput] = useState<string>("30000");
  const salaryNum = parseFloat(annualSalaryInput) || 0;

  const fedTaxEst = salaryNum * 0.14;
  const nyStateTaxEst = salaryNum * 0.055;
  const nycResTaxEst = salaryNum * 0.035;
  const ficaTaxEst = salaryNum * 0.0765;
  const totalTaxesEst = fedTaxEst + nyStateTaxEst + nycResTaxEst + ficaTaxEst;
  const netAnnualPay = Math.max(0, salaryNum - totalTaxesEst);
  const biweeklyNetPay = netAnnualPay / 26;
  const monthlyNetPay = netAnnualPay / 12;

  return (
    <div className="space-y-4">
      {/* NYC Header Card */}
      <div className="bg-gradient-to-r from-amber-500/20 via-slate-900 to-amber-950/40 border border-amber-500/30 p-4 rounded-2xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🗽</span>
          <h2 className="font-extrabold text-slate-100 text-base">
            NYC Life & Financial Tools
          </h2>
        </div>
        <p className="text-xs text-slate-400">
          MTA OMNY Cap ($3.00 / $35 Cap), Beverage $0.05 Bottle Deposit, Quick Meals, Clothing Tax Exemption & Income Tax Estimator.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 bg-slate-900 p-1.5 rounded-xl border border-slate-800 text-xs w-full max-w-full">
        <button
          onClick={() => setActiveTab("omny")}
          className={`py-2 px-1 rounded-lg font-semibold transition-all flex flex-col items-center gap-0.5 ${
            activeTab === "omny" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span className="text-sm">🚇</span>
          <span className="font-bold text-[11px]">OMNY Cap</span>
        </button>

        <button
          onClick={() => setActiveTab("otc")}
          className={`py-2 px-1 rounded-lg font-semibold transition-all flex flex-col items-center gap-0.5 ${
            activeTab === "otc" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span className="text-sm">💳</span>
          <span className="font-bold text-[11px]">OTC Card</span>
        </button>

        <button
          onClick={() => setActiveTab("bottle")}
          className={`py-2 px-1 rounded-lg font-semibold transition-all flex flex-col items-center gap-0.5 ${
            activeTab === "bottle" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span className="text-sm">🥤</span>
          <span className="font-bold text-[11px]">Bottle $0.05</span>
        </button>

        <button
          onClick={() => setActiveTab("meals")}
          className={`py-2 px-1 rounded-lg font-semibold transition-all flex flex-col items-center gap-0.5 ${
            activeTab === "meals" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span className="text-sm">🍳</span>
          <span className="font-bold text-[11px]">Quick Meals</span>
        </button>

        <button
          onClick={() => setActiveTab("tax")}
          className={`py-2 px-1 rounded-lg font-semibold transition-all flex flex-col items-center gap-0.5 ${
            activeTab === "tax" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span className="text-sm">👕</span>
          <span className="font-bold text-[11px]">Clothing Tax</span>
        </button>

        <button
          onClick={() => setActiveTab("tip")}
          className={`py-2 px-1 rounded-lg font-semibold transition-all flex flex-col items-center gap-0.5 ${
            activeTab === "tip" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span className="text-sm">🍕</span>
          <span className="font-bold text-[11px]">Tip & Split</span>
        </button>

        <button
          onClick={() => setActiveTab("paycheck")}
          className={`py-2 px-1 rounded-lg font-semibold transition-all flex flex-col items-center gap-0.5 ${
            activeTab === "paycheck" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span className="text-sm">💵</span>
          <span className="font-bold text-[11px]">Paycheck</span>
        </button>
      </div>

      {/* Toast Banner */}
      {toastMessage && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-2.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-lg">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-emerald-400 hover:text-emerald-200 text-xs ml-2">
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: MTA OMNY FARE CAP & TAP TRACKER */}
      {activeTab === "omny" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 max-w-full overflow-x-hidden">
          {/* OMNY Header & Stored Balance */}
          <div className="border-b border-slate-800 pb-3 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>🚇 MTA OMNY Weekly Fare Cap ($35.00 Max)</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Tap 12 times in a rolling 7-day period ($3.00/tap, capped at $35.00 max) and all additional subway/bus rides are 100% FREE!
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-slate-400">Card Balance:</span>
                <span className="text-sm font-mono font-bold text-emerald-400">${omnyBalance.toFixed(2)}</span>
                <button
                  onClick={() => {
                    setBalanceInput(omnyBalance.toFixed(2));
                    setIsEditingBalance(true);
                  }}
                  className="text-slate-400 hover:text-slate-200 p-1"
                  title="Edit OMNY Balance"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => setIsPayOMNYModalOpen(true)}
                className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Refill Card</span>
              </button>
            </div>
          </div>

          {/* Current Week Rolling Cap & Progress Card */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-200">Current Week (Rolling 7-Day Cap):</span>
                <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs font-bold text-amber-300">
                  {formatShortDate(activeWeekData.startDate)} - {formatShortDate(activeWeekData.endDate)}
                </span>
              </div>

              <span className="text-xs font-mono font-bold text-amber-400">
                {omnyCapHit ? "🎉 FARE CAP REACHED! RIDES ARE FREE!" : `${tapsToCap} Taps Until Cap`}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>0 Taps ($0.00)</span>
                <span>6 Taps ($18.00)</span>
                <span className="text-amber-400 font-bold">12 Taps ($35.00 CAP)</span>
              </div>
              <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    omnyCapHit ? "bg-emerald-500 shadow-lg shadow-emerald-500/50" : "bg-gradient-to-r from-amber-500 to-amber-400"
                  }`}
                  style={{ width: `${Math.min(100, (totalOMNYCount / 12) * 100)}%` }}
                />
              </div>
            </div>

            {/* Stats Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 block">Total Rides</span>
                  {activeWeekData.isCurrent && (
                    <div className="flex gap-1 items-center">
                      <button
                        onClick={() => setManualExtraTaps((p) => Math.max(0, p - 1))}
                        className="p-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                        title="Remove unrecorded tap"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={() => setManualExtraTaps((p) => p + 1)}
                        className="p-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                        title="Add unrecorded manual tap"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-sm font-extrabold text-slate-100 font-mono">{totalOMNYCount} Taps</span>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Fare Paid</span>
                <span className="text-sm font-extrabold text-amber-400 font-mono">${totalFarePaid.toFixed(2)}</span>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Free Rides</span>
                <span className="text-sm font-extrabold text-emerald-400 font-mono">{freeRidesCount} Rides</span>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Money Saved</span>
                <span className="text-sm font-extrabold text-emerald-300 font-mono">${savedAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Quick Tap Subway / Bus Fare Entry Form */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Train className="w-4 h-4 text-amber-400" />
                  <span>Tap Subway / Bus Fare Entry</span>
                </span>
                {/* Mode Selector Toggle */}
                <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setTransitMode("subway")}
                    className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                      transitMode === "subway" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    🚇 Subway
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransitMode("bus")}
                    className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                      transitMode === "bus" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    🚌 Bus
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAutoLocate}
                disabled={isLocating}
                className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
              >
                <Navigation className="w-3 h-3" />
                <span>{isLocating ? "Locating..." : "Auto-Detect Station"}</span>
              </button>
            </div>

            {locationMsg && <p className="text-[11px] text-amber-300 font-semibold">{locationMsg}</p>}

            {/* BUS SELECTION EDITING (Visible when Bus mode is active) */}
            {transitMode === "bus" ? (
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <span className="text-sm">🚌</span>
                  <span>MTA Bus Line Selection & Route Edit</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Bus Route Name / SBS (Editable):</label>
                    <input
                      type="text"
                      value={selectedBusRoute}
                      onChange={(e) => setSelectedBusRoute(e.target.value)}
                      placeholder="e.g. M15 SBS, Q66, B62"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-bold focus:border-amber-500 outline-none mb-1"
                    />
                    <select
                      value={["M15 SBS", "Q66", "B62", "Bx12 SBS", "M101", "B44 SBS", "SIM1 Express Bus"].includes(selectedBusRoute) ? selectedBusRoute : ""}
                      onChange={(e) => {
                        if (e.target.value) setSelectedBusRoute(e.target.value);
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-1 text-[11px] text-slate-300 focus:border-amber-500 outline-none"
                    >
                      <option value="">-- Preset Bus Line Dropdown --</option>
                      {["M15 SBS", "Q66", "B62", "Bx12 SBS", "M101", "B44 SBS", "SIM1 Express Bus"].map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Borough:</label>
                    <select
                      value={departureBorough}
                      onChange={(e) => setDepartureBorough(e.target.value as NYCBorough)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:border-amber-500 outline-none"
                    >
                      {NYC_BOROUGHS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              /* SUBWAY LINE SELECTION */
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block">1. Select MTA Subway Line:</span>
                <div className="flex flex-wrap gap-1">
                  {[
                    { name: "7 Train", label: "7 Line", bg: "bg-purple-900/60 border-purple-500 text-purple-200" },
                    { name: "D Train", label: "D Train", bg: "bg-orange-900/60 border-orange-500 text-orange-200" },
                    { name: "A Train", label: "A Train", bg: "bg-blue-900/60 border-blue-500 text-blue-200" },
                    { name: "1 Train", label: "1 Train", bg: "bg-red-900/60 border-red-500 text-red-200" },
                    { name: "4 Train", label: "4 Train", bg: "bg-emerald-900/60 border-emerald-500 text-emerald-200" },
                    { name: "N Train", label: "N Train", bg: "bg-yellow-900/60 border-yellow-500 text-yellow-200" },
                    { name: "L Train", label: "L Line", bg: "bg-slate-800 border-slate-500 text-slate-200" },
                    { name: "F Train", label: "F Train", bg: "bg-orange-900/60 border-orange-500 text-orange-200" },
                    { name: "E Train", label: "E Train", bg: "bg-blue-900/60 border-blue-500 text-blue-200" },
                    { name: "G Train", label: "G Line", bg: "bg-lime-900/60 border-lime-500 text-lime-200" },
                  ].map((t) => (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => {
                        setDepartureSubwayLine(t.name);
                        const code = t.name.replace(" Train", "");
                        const stations = getStationsForLine(code);
                        if (stations && stations.length > 0) {
                          setDepartureStation(stations[0].name);
                          setDepartureBorough(stations[0].borough);
                        }
                      }}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border transition-all ${t.bg} ${
                        departureSubwayLine === t.name ? "ring-2 ring-amber-400 scale-105" : "opacity-80 hover:opacity-100"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Departure Station Card (Subway) */}
            {transitMode === "subway" && (
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Departure Station & Subway Line</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Subway Line (Editable + Single Train Choice) */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Subway Line (Editable):
                    </label>
                    <input
                      type="text"
                      value={departureSubwayLine}
                      onChange={(e) => {
                        const lineVal = e.target.value;
                        setDepartureSubwayLine(lineVal);
                        const code = lineVal.replace(/车|Train|Line/gi, "").trim();
                        const stations = getStationsForLine(code);
                        if (stations && stations.length > 0) {
                          setDepartureStation(stations[0].name);
                          setDepartureBorough(stations[0].borough);
                        }
                      }}
                      placeholder="e.g. D Train, 7 Train"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-bold focus:border-amber-500 outline-none mb-1"
                    />
                    <select
                      value={
                        [
                          "1 Train", "2 Train", "3 Train", "4 Train", "5 Train", "6 Train", "7 Train",
                          "A Train", "C Train", "E Train", "B Train", "D Train", "F Train", "M Train",
                          "N Train", "Q Train", "R Train", "W Train", "J Train", "Z Train", "L Train",
                          "G Train", "S Shuttle"
                        ].includes(departureSubwayLine)
                          ? departureSubwayLine
                          : ""
                      }
                      onChange={(e) => {
                        const lineVal = e.target.value;
                        if (!lineVal) return;
                        setDepartureSubwayLine(lineVal);
                        const code = lineVal.replace(" Train", "");
                        const stations = getStationsForLine(code);
                        if (stations && stations.length > 0) {
                          setDepartureStation(stations[0].name);
                          setDepartureBorough(stations[0].borough);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-1 text-[11px] text-slate-300 focus:border-amber-500 outline-none"
                    >
                      <option value="">-- Single Train Choice --</option>
                      {[
                        "1 Train", "2 Train", "3 Train", "4 Train", "5 Train", "6 Train", "7 Train",
                        "A Train", "C Train", "E Train", "B Train", "D Train", "F Train", "M Train",
                        "N Train", "Q Train", "R Train", "W Train", "J Train", "Z Train", "L Train",
                        "G Train", "S Shuttle"
                      ].map((train) => (
                        <option key={train} value={train}>
                          {train}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Departure Station (Filtered to selected line stops) */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Departure Station Name:
                    </label>
                    <select
                      value={departureStation}
                      onChange={(e) => {
                        const stName = e.target.value;
                        setDepartureStation(stName);
                        const matched = availableDepartureStations.find((s) => s.name === stName);
                        if (matched) {
                          setDepartureBorough(matched.borough);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:border-amber-500 outline-none"
                    >
                      {availableDepartureStations.map((st) => (
                        <option key={st.name} value={st.name}>
                          {st.name} ({st.borough})
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Showing {availableDepartureStations.length} stops on {departureSubwayLine}
                    </span>
                  </div>

                  {/* Departure Borough (Auto-changed based on station selection) */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Borough (Auto-sets):
                    </label>
                    <select
                      value={departureBorough}
                      onChange={(e) => setDepartureBorough(e.target.value as NYCBorough)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:border-amber-500 outline-none"
                    >
                      {NYC_BOROUGHS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-emerald-400 font-medium block mt-1">
                      ✓ Auto-detected ({departureBorough})
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Transfer Editing Field */}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
              <label className="text-[11px] font-bold text-amber-300 block">
                🔄 Subway / Bus Transfer Details (Editable):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={transferRoute}
                  onChange={(e) => setTransferRoute(e.target.value)}
                  placeholder="e.g. Transfer to Bus M15 SBS, Transfer to 7 Train"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-bold focus:border-amber-500 outline-none"
                />
                <select
                  value={["Direct (No Transfer)", "Transfer to Bus M15 SBS", "Transfer to 7 Train", "Transfer to N/Q/R/W", "Transfer to E/F/M/R"].includes(transferRoute) ? transferRoute : ""}
                  onChange={(e) => {
                    if (e.target.value) setTransferRoute(e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:border-amber-500 outline-none"
                >
                  <option value="">-- Quick Transfer Preset --</option>
                  {["Direct (No Transfer)", "Transfer to Bus M15 SBS", "Transfer to 7 Train", "Transfer to N/Q/R/W", "Transfer to E/F/M/R"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Destination Station Grid (Aligned Dropdowns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Destination Station
                </label>
                <select
                  value={destStation}
                  onChange={(e) => {
                    const stName = e.target.value;
                    setDestStation(stName);
                    const matched = availableDestStations.find((s) => s.name === stName);
                    if (matched) setDestBorough(matched.borough);
                  }}
                  className="w-full h-10 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:border-amber-500 outline-none"
                >
                  {availableDestStations.map((st) => (
                    <option key={`dest-${st.name}`} value={st.name}>
                      {st.name} ({st.borough})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Destination Borough (Auto-sets)
                </label>
                <select
                  value={destBorough}
                  onChange={(e) => setDestBorough(e.target.value as NYCBorough)}
                  className="w-full h-10 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:border-amber-500 outline-none"
                >
                  {NYC_BOROUGHS.map((b) => (
                    <option key={`destB-${b}`} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleQuickSubwayTap}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Train className="w-4 h-4" />
              <span>Tap OMNY Turnstile ($3.00)</span>
            </button>
          </div>

          {/* OMNY Tap History for Selected Week */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Recorded Taps in Selected Week ({activeWeekData.taps.length})</span>
              <span className="text-[10px] text-slate-500">
                {formatShortDate(activeWeekData.startDate)} - {formatShortDate(activeWeekData.endDate)}
              </span>
            </h4>

            {activeWeekData.taps.length === 0 ? (
              <p className="text-[11px] text-slate-500 py-3 text-center italic">
                No subway taps recorded for this week yet. Tap turnstile above to log rides!
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs">
                {activeWeekData.taps.map((tx, idx) => (
                  <div
                    key={tx.id || idx}
                    className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">🚇</span>
                      <div>
                        <span className="font-bold text-slate-200 block truncate max-w-[200px]">
                          {tx.merchant}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[220px]">
                          {tx.date} · {tx.borough} · {tx.note || tx.subCategory}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-mono font-bold text-xs block ${
                          idx >= 12 ? "text-emerald-400" : idx === 11 ? "text-amber-300" : "text-amber-400"
                        }`}
                      >
                        {idx >= 12 ? "$0.00 (FREE)" : idx === 11 ? "$2.00 (Cap)" : `$${(tx.amount || 3.00).toFixed(2)}`}
                      </span>
                      <span className="text-[9px] text-slate-500">Ride #{idx + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: OTC BENEFIT CARD TOOL */}
      {activeTab === "otc" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 max-w-full overflow-x-hidden">
          {/* Card Header & Current Balance */}
          <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 p-4 rounded-xl border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-100">{otcState.cardName || "NYC OTC Benefit Allowance Card"}</h3>
                  <span className="text-[10px] text-emerald-300 font-mono">Over-The-Counter Health & OTC Product Benefit</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setOtcAllowanceInput(otcState.monthlyAllowance.toString());
                  setOtcReloadDateInput(otcState.nextReloadDate);
                  setOtcCardNameInput(otcState.cardName || "NYC OTC Benefit Allowance Card");
                  setIsEditingOTCModal(true);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Edit OTC Card Settings</span>
              </button>
            </div>

            {/* OTC Main Stats Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Current Balance</span>
                <span className="text-base font-extrabold text-emerald-400 font-mono">${otcState.remainingBalance.toFixed(2)}</span>
              </div>

              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Allowance</span>
                <span className="text-base font-extrabold text-slate-200 font-mono">${otcState.monthlyAllowance.toFixed(2)} / Mo</span>
              </div>

              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Used Amount</span>
                <span className="text-base font-extrabold text-amber-400 font-mono">
                  ${(otcState.usedAmount !== undefined ? otcState.usedAmount : (otcState.monthlyAllowance - otcState.remainingBalance)).toFixed(2)}
                </span>
              </div>

              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Next Reload</span>
                <span className="text-xs font-extrabold text-cyan-300 font-mono block mt-1">{otcState.nextReloadDate || "2026-09-01"}</span>
              </div>
            </div>

            {/* Usage Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Allowance Usage Progress Bar</span>
                <span className="text-emerald-400 font-mono">
                  {Math.min(100, Math.round(((otcState.monthlyAllowance - otcState.remainingBalance) / Math.max(1, otcState.monthlyAllowance)) * 100))}% Used · ${otcState.remainingBalance.toFixed(2)} Remaining
                </span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.min(100, Math.max(0, ((otcState.monthlyAllowance - otcState.remainingBalance) / Math.max(1, otcState.monthlyAllowance)) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Log OTC Purchase Form */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Log OTC Card Health & Wellness Purchase</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Item Name / Health Category:</label>
                <input
                  type="text"
                  value={otcItemName}
                  onChange={(e) => setOtcItemName(e.target.value)}
                  placeholder="e.g. Toothpaste, Pain Relief, Eye Care"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Price ($):</label>
                <input
                  type="number"
                  step="0.01"
                  value={otcItemPrice}
                  onChange={(e) => setOtcItemPrice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-300 font-bold focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Pharmacy / Merchant:</label>
                <input
                  type="text"
                  value={otcMerchantInput}
                  onChange={(e) => setOtcMerchantInput(e.target.value)}
                  placeholder="e.g. CVS Pharmacy, Duane Reade, Walgreens"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Borough:</label>
                <select
                  value={otcBoroughInput}
                  onChange={(e) => setOtcBoroughInput(e.target.value as NYCBorough)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:border-emerald-500 outline-none"
                >
                  {NYC_BOROUGHS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { name: "Pain Relief (Advil/Tylenol)", price: "12.99" },
                { name: "Multivitamins & Zinc", price: "22.50" },
                { name: "First Aid & Bandages", price: "8.75" },
                { name: "Dental Care & Toothpaste", price: "14.20" },
                { name: "Cold & Eye Allergy Relief", price: "18.50" },
              ].map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => {
                    setOtcItemName(item.name);
                    setOtcItemPrice(item.price);
                  }}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-slate-300 font-semibold transition-all"
                >
                  {item.name} (${item.price})
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleLogOTCPurchase}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Log OTC Purchase (Payment Method: OTC Card)</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: BEVERAGE BOTTLE DEPOSIT ($0.05) & REFUND TRACKER */}
      {activeTab === "bottle" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 max-w-full overflow-x-hidden">
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🥤</span>
              <h3 className="text-sm font-bold text-slate-100">
                NYC Beverage Bottle Deposit ($0.05 Fee) & Redemption Tracker
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              New York State Returnable Container Act automatically imposes a mandatory <strong>$0.05 bottle deposit fee</strong> on carbonated soft drinks, water, beer, energy drinks, and malt beverages. You can redeem empty containers at any NYC Reverse Vending Machine (RVM) or supermarket for cash!
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4 max-w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Beverage Container Type
                </label>
                <select
                  value={beverageType}
                  onChange={(e) => setBeverageType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:border-amber-500 outline-none"
                >
                  <option value="Water / Soda Cans">Water / Soda Cans (5¢/unit)</option>
                  <option value="Beer / Cider Bottles">Beer & Cider Bottles (5¢/unit)</option>
                  <option value="Energy Drink Cans">Energy Drink Cans (5¢/unit)</option>
                  <option value="Iced Tea / Juice Bottles">Iced Tea / Juice Bottles (5¢/unit)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 block">
                  Number of Bottles / Cans
                </label>
                <input
                  type="number"
                  min="1"
                  value={bottleCountInput}
                  onChange={(e) => setBottleCountInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:border-amber-500 outline-none"
                />
                <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                  {[6, 12, 24].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setBottleCountInput(cnt.toString())}
                      className={`py-1 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border rounded-lg text-xs font-bold transition-all text-center ${
                        bottleCountInput === cnt.toString()
                          ? "border-amber-500 text-amber-300 bg-amber-500/10"
                          : "border-slate-800"
                      }`}
                    >
                      {cnt}-pk
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Calculated Fee & Refund Card */}
            <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 p-4 rounded-xl border border-cyan-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Container Count:</span>
                <span className="font-bold text-slate-100 font-mono">{parsedBottleCount} Containers</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Mandatory NY $0.05 Deposit Fee:</span>
                <span className="font-bold text-cyan-400 font-mono text-sm">${bottleDepositFee.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                <span className="text-slate-300 font-semibold">Annual Deposit Paid (1x/week):</span>
                <span className="font-bold text-emerald-400 font-mono">${annualBottleSavings.toFixed(2)} / year</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleRecordBottleDeposit}
                className="py-2.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Log $0.05 Bottle Deposit Fee</span>
              </button>

              <button
                type="button"
                onClick={handleRecordBottleRefund}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Recycle className="w-4 h-4" />
                <span>Log RVM Recycling Refund (+${bottleDepositFee.toFixed(2)})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: QUICK MEALS */}
      {activeTab === "meals" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>🍳 NYC Quick Meal Preset Logger</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Log bodega breakfasts, halal platters, and street bites with auto-applied NYC 8.875% tax & tip.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {(Object.keys(mealPresets) as Array<keyof typeof mealPresets>).map((key) => {
              const item = mealPresets[key];
              const isSel = mealType === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setMealType(key);
                    setCustomMealPrice(item.base.toString());
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSel
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-200 shadow-md"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <span className="text-xs font-bold block truncate">{item.name}</span>
                  <span className="text-[10px] text-slate-400 block">${item.base.toFixed(2)} Base</span>
                </button>
              );
            })}
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Meal Base Price ($)
                </label>
                <input
                  type="number"
                  step="0.25"
                  value={customMealPrice}
                  onChange={(e) => setCustomMealPrice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Borough
                </label>
                <select
                  value={mealBorough}
                  onChange={(e) => setMealBorough(e.target.value as NYCBorough)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:border-amber-500 outline-none"
                >
                  {NYC_BOROUGHS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Tip Rate (%)
                </label>
                <div className="flex gap-1">
                  {[0, 15, 18, 20].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setMealTipRate(rate)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        mealTipRate === rate
                          ? "bg-amber-500 text-slate-950 border-amber-400"
                          : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Base Meal Price:</span>
                <span className="font-mono text-slate-200">${currentMealBase.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>NYC Sales Tax (8.875%):</span>
                <span className="font-mono text-slate-200">${mealTaxVal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tip ({mealTipRate}%):</span>
                <span className="font-mono text-slate-200">${mealTipVal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-amber-400 pt-1 border-t border-slate-800 text-sm">
                <span>Total Amount:</span>
                <span className="font-mono">${mealTotalVal.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleQuickMealAdd}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Record Meal Expense to NYC Ledger</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: CLOTHING TAX EXEMPTION */}
      {activeTab === "tax" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">👕</span>
              <h3 className="text-sm font-bold text-slate-100">
                NYC Clothing & Footwear Tax Exemption Calculator
              </h3>
            </div>
            <p className="text-[11px] text-slate-400">
              Apparel, footwear, and items <strong>under $110 per item</strong> are 100% EXEMPT from NYC (4.5%) & NY State (4.0%) sales tax (Save 8.875%).
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Item Price per Piece ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={itemQty}
                  onChange={(e) => setItemQty(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            <div
              className={`p-4 rounded-xl border space-y-2 ${
                isClothingTaxExempt
                  ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
                  : "bg-amber-950/30 border-amber-500/40 text-amber-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {isClothingTaxExempt ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                )}
                <div>
                  <span className="text-xs font-extrabold block">
                    {isClothingTaxExempt ? "100% TAX EXEMPT! ($0 Tax Paid)" : "Subject to 8.875% NYC Sales Tax"}
                  </span>
                  <span className="text-[10px] opacity-80">
                    {isClothingTaxExempt
                      ? `Item price $${priceNum.toFixed(2)} is under $110 limit. Saved $${savedTaxAmount.toFixed(2)} in taxes!`
                      : `Item price $${priceNum.toFixed(2)} is $110 or higher.`}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex justify-between text-xs font-bold font-mono">
                <span>Total Amount:</span>
                <span>${totalWithTax.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TIP & SPLIT */}
      {activeTab === "tip" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🍕</span>
              <h3 className="text-sm font-bold text-slate-100">NYC Dining Tip & Tax Splitter</h3>
            </div>
            <p className="text-[11px] text-slate-400">
              Calculate post-tax or pre-tax gratuity and split dining bills easily amongst friends.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Food Subtotal ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={billBase}
                  onChange={(e) => setBillBase(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Tip Percentage (%)</label>
                <div className="flex gap-1">
                  {[15, 18, 20, 22].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setTipPercent(pct)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        tipPercent === pct
                          ? "bg-amber-500 text-slate-950 border-amber-400"
                          : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Split Between</label>
                <input
                  type="number"
                  min="1"
                  value={splitPeople}
                  onChange={(e) => setSplitPeople(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span>${billBaseNum.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>NYC Sales Tax (8.875%):</span>
                <span>${calculatedTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tip ({tipPercent}%):</span>
                <span>${calculatedTip.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-amber-400 text-sm pt-2 border-t border-slate-800">
                <span>Grand Total:</span>
                <span>${grandTotalBill.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-400 text-base pt-1">
                <span>Per Person ({splitPeople}x):</span>
                <span>${perPersonTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PAYCHECK ESTIMATOR */}
      {activeTab === "paycheck" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">💵</span>
              <h3 className="text-sm font-bold text-slate-100">NYC Resident Paycheck & Net Income Estimator</h3>
            </div>
            <p className="text-[11px] text-slate-400">
              Estimates Federal, New York State, NYC Resident Tax (3.078%-3.876%), and FICA deductions.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Annual Gross Salary ($)</label>
              <input
                type="number"
                step="1000"
                value={annualSalaryInput}
                onChange={(e) => setAnnualSalaryInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:border-amber-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Federal Tax</span>
                <span className="text-amber-400 font-bold">${fedTaxEst.toFixed(0)}</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">NY State Tax</span>
                <span className="text-amber-400 font-bold">${nyStateTaxEst.toFixed(0)}</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">NYC Resident Tax</span>
                <span className="text-rose-400 font-bold">${nycResTaxEst.toFixed(0)}</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">FICA Tax</span>
                <span className="text-amber-400 font-bold">${ficaTaxEst.toFixed(0)}</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-emerald-950/40 p-4 rounded-xl border border-emerald-500/30 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-semibold">Net Take-Home Pay (Annual):</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">${netAnnualPay.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-semibold">Bi-Weekly Paycheck (26x/year):</span>
                <span className="font-bold text-emerald-300 font-mono text-base">${biweeklyNetPay.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-semibold">Monthly Net Pay (12x/year):</span>
                <span className="font-bold text-emerald-300 font-mono text-base">${monthlyNetPay.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT OMNY BALANCE MODAL */}
      {isEditingBalance && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xs p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-amber-400" />
              <span>Edit OMNY Stored Balance</span>
            </h3>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Current Balance ($)</label>
              <input
                type="number"
                step="0.01"
                value={balanceInput}
                onChange={(e) => setBalanceInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono font-bold focus:border-amber-500 outline-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setIsEditingBalance(false)}
                className="flex-1 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBalance}
                className="flex-1 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-400 shadow-md"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REFILL OMNY MODAL */}
      {isPayOMNYModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>Refill OMNY Stored Balance</span>
              </h3>
              <button
                onClick={() => setIsPayOMNYModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Top-Up Amount ($)</label>
                <input
                  type="number"
                  step="5"
                  value={payOMNYAmountInput}
                  onChange={(e) => setPayOMNYAmountInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-bold focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Payment Method</label>
                <select
                  value={payOMNYPaymentMethod}
                  onChange={(e) => setPayOMNYPaymentMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:border-amber-500 outline-none"
                >
                  <option value="Apple Pay">Apple Pay</option>
                  <option value="Chase Freedom Visa">Chase Freedom Visa</option>
                  <option value="Bank Checking ACH">Bank Checking ACH</option>
                  <option value="NYC Commuter Benefits Card">NYC Commuter Benefits Card</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsPayOMNYModalOpen(false)}
                className="flex-1 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayOMNYBalance}
                className="flex-1 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-400 shadow-md shadow-amber-500/20"
              >
                Confirm Top-Up
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {confirmModalData.isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-100 text-sm">{confirmModalData.title}</h3>
            <p className="text-xs text-slate-300">{confirmModalData.message}</p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmModalData((prev) => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmModalData.onConfirm}
                className="flex-1 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-400 shadow-md"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
