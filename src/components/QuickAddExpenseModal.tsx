import React, { useState, useRef } from "react";
import { X, Plus, Subtitles, MapPin, DollarSign, Calendar, CreditCard, Tag, Sparkles, Navigation, Briefcase, ShoppingBag, TrendingUp, Gift, Camera, Image as ImageIcon } from "lucide-react";
import { ExpenseTransaction, NYCExpenseCategory, NYCBorough } from "../types";
import { NYC_BOROUGHS, NYC_CATEGORIES, NYC_NEIGHBORHOODS } from "../data/nycDefaults";
import { getCurrentNYCLocation } from "../utils/geoUtils";
import { compressImageForAI } from "../utils/imageCompressor";

interface QuickAddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTransaction: (tx: Omit<ExpenseTransaction, "id" | "createdAt">) => void;
}

const INCOME_CATEGORIES: {
  category: string;
  icon: string;
  subCategories: string[];
}[] = [
  {
    category: "Salary / Wages",
    icon: "💼",
    subCategories: [
      "Full-time Payroll (W-2)",
      "Part-time Job Payroll",
      "Hourly / Daily Pay",
      "Bonus / Commission",
      "Tips",
    ],
  },
  {
    category: "Freelance & Side Job",
    icon: "💻",
    subCategories: ["Contract / Gig Work", "Design / Dev / Consulting", "Rideshare & Delivery", "Content Creation"],
  },
  {
    category: "Secondhand Sales",
    icon: "📦",
    subCategories: ["Craigslist / FB Marketplace", "eBay / Poshmark / Mercari", "Used Electronics & Phone", "Clothing & Luxury"],
  },
  {
    category: "Investment & Interest",
    icon: "📈",
    subCategories: ["Stocks & Dividends", "HYSA Interest", "Crypto Gains", "Rental Income"],
  },
  {
    category: "Gift & Reimbursement",
    icon: "🎁",
    subCategories: ["Gift / Transfer", "Work Reimbursement", "Credit Card Cashback"],
  },
  {
    category: "Other Income",
    icon: "💵",
    subCategories: ["Refunds & Deposits", "General Other Income"],
  },
];

export const QuickAddExpenseModal: React.FC<QuickAddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSaveTransaction,
}) => {
  const [txType, setTxType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [tax, setTax] = useState("0");
  const [tip, setTip] = useState("0");
  const [category, setCategory] = useState<NYCExpenseCategory>("Dining & Bodega");
  const [subCategory, setSubCategory] = useState("Bodega Egg & Cheese");

  // Income Specific States & Company Address auto-fill
  const [incomeCategory, setIncomeCategory] = useState("Salary / Wages");
  const [incomeSubCategory, setIncomeSubCategory] = useState("Full-time Payroll (W-2)");
  const [companyAddress, setCompanyAddress] = useState(() => {
    return localStorage.getItem("nyc_last_company_address") || "";
  });

  // Custom Category State Management
  const [categoriesList, setCategoriesList] = useState(() => {
    try {
      const saved = localStorage.getItem("nyc_custom_categories_v1");
      return saved ? JSON.parse(saved) : NYC_CATEGORIES;
    } catch {
      return NYC_CATEGORIES;
    }
  });

  const [incomeCategoriesList, setIncomeCategoriesList] = useState(() => {
    try {
      const saved = localStorage.getItem("nyc_custom_income_categories_v1");
      return saved ? JSON.parse(saved) : INCOME_CATEGORIES;
    } catch {
      return INCOME_CATEGORIES;
    }
  });

  const [showCatManager, setShowCatManager] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newSubCatName, setNewSubCatName] = useState("");

  // Category & Sub-category Edit States
  const [editingPrimaryCatName, setEditingPrimaryCatName] = useState("");
  const [isEditingPrimary, setIsEditingPrimary] = useState(false);
  const [editingSubIdx, setEditingSubIdx] = useState<number | null>(null);
  const [editingSubText, setEditingSubText] = useState("");
  const [newSubInput, setNewSubInput] = useState("");

  const [borough, setBorough] = useState<NYCBorough>("Manhattan");
  const [neighborhood, setNeighborhood] = useState("East Village");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [customIcon, setCustomIcon] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [isOMNY, setIsOMNY] = useState(false);
  const [nycTaxExempt, setNycTaxExempt] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationMsg, setLocationMsg] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  // AI Product Photo Recognition State
  const productCameraInputRef = useRef<HTMLInputElement>(null);
  const productFileInputRef = useRef<HTMLInputElement>(null);
  const [isRecognizingProduct, setIsRecognizingProduct] = useState(false);
  const [productRecognizedMsg, setProductRecognizedMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProductImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRecognizingProduct(true);
    setProductRecognizedMsg(null);

    // Completely clear previous recognition data before scanning new photo
    setMerchant("");
    setAmount("");
    setNote("");
    setReceiptUrl(null);

    try {
      // Compress image client-side to max 1280px and 0.82 quality
      const compressed = await compressImageForAI(file, 1280, 0.82);
      setReceiptUrl(compressed.base64);

      const res = await fetch("/api/identify-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: compressed.base64,
          mimeType: compressed.mimeType,
        }),
      });

      const result = await res.json();
      if (res.ok && result.success && result.data) {
        const { productName, price, category: aiCat, subCategory: aiSub, description } = result.data;

        setMerchant(productName || "");
        setAmount(price && price > 0 ? price.toString() : "");
        if (aiCat && categoriesList.some((c: any) => c.category === aiCat)) {
          setCategory(aiCat as NYCExpenseCategory);
        }
        if (aiSub) setSubCategory(aiSub);
        setNote(description ? `[AI Recognition] ${description}` : "");

        setProductRecognizedMsg(
          `✨ AI Recognized: [${productName || 'Item'}]${price > 0 ? ` · Price $${price.toFixed(2)}` : ' · Price not detected, please enter manually'}`
        );
      } else {
        const errMsg = result.error || "Could not clearly identify item, please enter name & price manually.";
        setProductRecognizedMsg(`⚠️ ${errMsg}`);
      }
    } catch (err: any) {
      console.error("AI Product recognition error:", err);
      setProductRecognizedMsg("⚠️ Image processing issue. Please try again or fill manually.");
    } finally {
      setIsRecognizingProduct(false);
      // Reset inputs so user can re-select same photo if desired
      if (productCameraInputRef.current) productCameraInputRef.current.value = "";
      if (productFileInputRef.current) productFileInputRef.current.value = "";
    }
  };

  const loadSampleProductDemo = (type: "milk" | "nike" | "coffee") => {
    setTxType("EXPENSE");
    if (type === "milk") {
      setMerchant("Trader Joe's Organic Whole Milk");
      setAmount("4.99");
      setCategory("Groceries");
      setSubCategory("Trader Joe's");
      setNote("[AI Sample] Detected Trader Joe's Organic Milk, price tag $4.99");
      setReceiptUrl("https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop&q=80");
      setProductRecognizedMsg("✨ AI Sample: [Trader Joe's Organic Milk] · Price $4.99");
    } else if (type === "nike") {
      setMerchant("Nike Dunk Low Sneakers");
      setAmount("115.00");
      setCategory("Shopping & Fashion");
      setSubCategory("Clothing <$110 (Tax Exempt)");
      setNote("[AI Sample] Detected Nike Sneakers, tag price $115.00");
      setReceiptUrl("https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=80");
      setProductRecognizedMsg("✨ AI Sample: [Nike Dunk Low Sneakers] · Price $115.00");
    } else {
      setMerchant("Starbucks Iced Caramel Macchiato");
      setAmount("6.45");
      setCategory("Dining & Bodega");
      setSubCategory("Coffee & Bakery");
      setNote("[AI Sample] Detected Starbucks Iced Caramel Macchiato, cup tag $6.45");
      setReceiptUrl("https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=80");
      setProductRecognizedMsg("✨ AI Sample: [Starbucks Iced Caramel Macchiato] · Price $6.45");
    }
  };

  const handleSaveCompanyAddress = (addressVal: string) => {
    setCompanyAddress(addressVal);
    if (addressVal.trim()) {
      localStorage.setItem("nyc_last_company_address", addressVal.trim());
    }
  };

  const handleAddCustomCategory = () => {
    if (!newCatName.trim()) return;
    const subArr = newSubCatName.trim() ? newSubCatName.split(",").map((s) => s.trim()) : ["General"];

    if (txType === "INCOME") {
      const updated = [
        ...incomeCategoriesList,
        { category: newCatName.trim(), icon: "💵", subCategories: subArr },
      ];
      setIncomeCategoriesList(updated);
      localStorage.setItem("nyc_custom_income_categories_v1", JSON.stringify(updated));
      setIncomeCategory(newCatName.trim());
      setIncomeSubCategory(subArr[0]);
    } else {
      const updated = [
        ...categoriesList,
        {
          category: newCatName.trim() as NYCExpenseCategory,
          icon: "Tag",
          color: "bg-emerald-500 text-emerald-950 border-emerald-300",
          subCategories: subArr,
        },
      ];
      setCategoriesList(updated);
      localStorage.setItem("nyc_custom_categories_v1", JSON.stringify(updated));
      setCategory(newCatName.trim() as NYCExpenseCategory);
      setSubCategory(subArr[0]);
    }

    setNewCatName("");
    setNewSubCatName("");
    setShowCatManager(false);
  };

  const handleDeleteCurrentCategory = (catToDelete: string) => {
    if (txType === "INCOME") {
      if (incomeCategoriesList.length <= 1) return;
      const updated = incomeCategoriesList.filter((c: any) => c.category !== catToDelete);
      setIncomeCategoriesList(updated);
      localStorage.setItem("nyc_custom_income_categories_v1", JSON.stringify(updated));
      setIncomeCategory(updated[0].category);
      setIncomeSubCategory(updated[0].subCategories[0] || "");
    } else {
      if (categoriesList.length <= 1) return;
      const updated = categoriesList.filter((c: any) => c.category !== catToDelete);
      setCategoriesList(updated);
      localStorage.setItem("nyc_custom_categories_v1", JSON.stringify(updated));
      setCategory(updated[0].category);
      setSubCategory(updated[0].subCategories[0] || "");
    }
  };

  // Handler: Rename Primary Category
  const handleRenamePrimaryCategory = () => {
    if (!editingPrimaryCatName.trim()) return;
    const newName = editingPrimaryCatName.trim();

    if (txType === "INCOME") {
      const updated = incomeCategoriesList.map((c: any) => {
        if (c.category === incomeCategory) {
          return { ...c, category: newName };
        }
        return c;
      });
      setIncomeCategoriesList(updated);
      localStorage.setItem("nyc_custom_income_categories_v1", JSON.stringify(updated));
      setIncomeCategory(newName);
    } else {
      const updated = categoriesList.map((c: any) => {
        if (c.category === category) {
          return { ...c, category: newName as NYCExpenseCategory };
        }
        return c;
      });
      setCategoriesList(updated);
      localStorage.setItem("nyc_custom_categories_v1", JSON.stringify(updated));
      setCategory(newName as NYCExpenseCategory);
    }

    setIsEditingPrimary(false);
  };

  // Handler: Save Sub-category Rename
  const handleSaveSubCatRename = (idx: number) => {
    if (!editingSubText.trim()) return;
    const newSubName = editingSubText.trim();

    if (txType === "INCOME") {
      const updated = incomeCategoriesList.map((c: any) => {
        if (c.category === incomeCategory) {
          const newSubs = [...c.subCategories];
          const oldSub = newSubs[idx];
          newSubs[idx] = newSubName;
          if (incomeSubCategory === oldSub) {
            setIncomeSubCategory(newSubName);
          }
          return { ...c, subCategories: newSubs };
        }
        return c;
      });
      setIncomeCategoriesList(updated);
      localStorage.setItem("nyc_custom_income_categories_v1", JSON.stringify(updated));
    } else {
      const updated = categoriesList.map((c: any) => {
        if (c.category === category) {
          const newSubs = [...c.subCategories];
          const oldSub = newSubs[idx];
          newSubs[idx] = newSubName;
          if (subCategory === oldSub) {
            setSubCategory(newSubName);
          }
          return { ...c, subCategories: newSubs };
        }
        return c;
      });
      setCategoriesList(updated);
      localStorage.setItem("nyc_custom_categories_v1", JSON.stringify(updated));
    }

    setEditingSubIdx(null);
    setEditingSubText("");
  };

  // Handler: Delete Sub-category
  const handleDeleteSubCat = (idx: number) => {
    if (txType === "INCOME") {
      const currentCatObj = incomeCategoriesList.find((c: any) => c.category === incomeCategory);
      if (!currentCatObj || currentCatObj.subCategories.length <= 1) return;

      const updated = incomeCategoriesList.map((c: any) => {
        if (c.category === incomeCategory) {
          const newSubs = c.subCategories.filter((_: any, i: number) => i !== idx);
          if (incomeSubCategory === c.subCategories[idx]) {
            setIncomeSubCategory(newSubs[0] || "");
          }
          return { ...c, subCategories: newSubs };
        }
        return c;
      });
      setIncomeCategoriesList(updated);
      localStorage.setItem("nyc_custom_income_categories_v1", JSON.stringify(updated));
    } else {
      const currentCatObj = categoriesList.find((c: any) => c.category === category);
      if (!currentCatObj || currentCatObj.subCategories.length <= 1) return;

      const updated = categoriesList.map((c: any) => {
        if (c.category === category) {
          const newSubs = c.subCategories.filter((_: any, i: number) => i !== idx);
          if (subCategory === c.subCategories[idx]) {
            setSubCategory(newSubs[0] || "");
          }
          return { ...c, subCategories: newSubs };
        }
        return c;
      });
      setCategoriesList(updated);
      localStorage.setItem("nyc_custom_categories_v1", JSON.stringify(updated));
    }
  };

  // Handler: Add New Sub-category to current primary category
  const handleAddSubCatToCurrent = () => {
    if (!newSubInput.trim()) return;
    const newSubName = newSubInput.trim();

    if (txType === "INCOME") {
      const updated = incomeCategoriesList.map((c: any) => {
        if (c.category === incomeCategory) {
          return { ...c, subCategories: [...c.subCategories, newSubName] };
        }
        return c;
      });
      setIncomeCategoriesList(updated);
      localStorage.setItem("nyc_custom_income_categories_v1", JSON.stringify(updated));
      setIncomeSubCategory(newSubName);
    } else {
      const updated = categoriesList.map((c: any) => {
        if (c.category === category) {
          return { ...c, subCategories: [...c.subCategories, newSubName] };
        }
        return c;
      });
      setCategoriesList(updated);
      localStorage.setItem("nyc_custom_categories_v1", JSON.stringify(updated));
      setSubCategory(newSubName);
    }

    setNewSubInput("");
  };

  const handleAutoDetectLocation = async () => {
    setIsLocating(true);
    setLocationMsg(null);
    const loc = await getCurrentNYCLocation();
    setBorough(loc.borough);
    setNeighborhood(loc.neighborhood);
    if (loc.message) {
      setLocationMsg(loc.message);
    }
    setIsLocating(false);
  };

  // Preset shortcuts for fast logging
  const applyPreset = async (preset: "omny" | "egg_cheese" | "halal" | "tjoes") => {
    setTxType("EXPENSE");
    if (preset === "omny") {
      setMerchant("MTA OMNY Tap");
      setAmount("3.00");
      setTax("0");
      setTip("0");
      setCategory("Transit (MTA/OMNY)");
      setSubCategory("MTA Subway (OMNY)");
      setIsOMNY(true);
      setNote("MTA Subway single tap ($3.00)");
      handleAutoDetectLocation();
    } else if (preset === "egg_cheese") {
      setMerchant("Corner Bodega");
      setAmount("7.50");
      setTax("0.65");
      setTip("0");
      setCategory("Dining & Bodega");
      setSubCategory("Bodega Egg & Cheese");
      setIsOMNY(false);
      setNote("Bacon, Egg & Cheese on a roll + Coffee");
    } else if (preset === "halal") {
      setMerchant("Midtown Halal Cart");
      setAmount("12.00");
      setTax("0");
      setTip("2.00");
      setCategory("Dining & Bodega");
      setSubCategory("Halal Cart");
      setIsOMNY(false);
      setNote("Chicken Platter with White & Red Sauce");
    } else if (preset === "tjoes") {
      setMerchant("Trader Joe's");
      setAmount("45.20");
      setTax("0");
      setTip("0");
      setCategory("Groceries");
      setSubCategory("Trader Joe's");
      setIsOMNY(false);
      setNote("Weekly grocery run");
    }
  };

  // Income presets
  const applyIncomePreset = (preset: "salary" | "freelance" | "secondhand" | "investment") => {
    setTxType("INCOME");
    if (preset === "salary") {
      setMerchant("Full-time Payroll");
      setAmount("3200.00");
      setIncomeCategory("Salary / Wages");
      setIncomeSubCategory("Full-time Payroll (W-2)");
      setPaymentMethod("Direct Deposit / ACH");
      setNote("Semi-monthly paycheck (Direct Deposit)");
    } else if (preset === "freelance") {
      setMerchant("Upwork / Freelance");
      setAmount("450.00");
      setIncomeCategory("Freelance & Side Job");
      setIncomeSubCategory("Contract / Gig Work");
      setPaymentMethod("Venmo Card");
      setNote("Design / UI development payout");
    } else if (preset === "secondhand") {
      setMerchant("Craigslist Secondhand Sale");
      setAmount("220.00");
      setIncomeCategory("Secondhand Sales");
      setIncomeSubCategory("Craigslist / FB Marketplace");
      setPaymentMethod("Cash");
      setNote("Sold old monitor");
    } else if (preset === "investment") {
      setMerchant("Marcus / HYSA Interest");
      setAmount("85.50");
      setIncomeCategory("Investment & Interest");
      setIncomeSubCategory("HYSA Interest");
      setPaymentMethod("Direct Deposit / ACH");
      setNote("Monthly high-yield savings interest");
    }
  };

  const handleCalculateTax = () => {
    if (txType === "INCOME") return;
    const numericAmount = parseFloat(amount);
    if (!isNaN(numericAmount) && numericAmount > 0) {
      if (category === "Shopping & Fashion" && numericAmount < 110) {
        setTax("0");
        setNycTaxExempt(true);
      } else {
        const calculatedTax = (numericAmount * 0.08875).toFixed(2);
        setTax(calculatedTax);
        setNycTaxExempt(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    if (txType === "INCOME" && companyAddress.trim()) {
      localStorage.setItem("nyc_last_company_address", companyAddress.trim());
      if (merchant.trim()) {
        try {
          const map = JSON.parse(localStorage.getItem("nyc_company_addresses_map") || "{}");
          map[merchant.trim()] = companyAddress.trim();
          localStorage.setItem("nyc_company_addresses_map", JSON.stringify(map));
        } catch {}
      }
    }

    const finalCategory = (txType === "INCOME" ? incomeCategory : category) as NYCExpenseCategory;
    const finalSubCategory = txType === "INCOME" ? incomeSubCategory : subCategory;

    onSaveTransaction({
      merchant: merchant || (txType === "INCOME" ? "Unnamed Income" : "Unnamed Merchant"),
      amount: numAmount,
      tax: txType === "INCOME" ? 0 : parseFloat(tax) || 0,
      tip: txType === "INCOME" ? 0 : parseFloat(tip) || 0,
      date: date || new Date().toISOString().split("T")[0],
      category: finalCategory,
      subCategory: finalSubCategory || "General",
      borough,
      neighborhood: neighborhood || "Midtown",
      note,
      type: txType,
      companyAddress: txType === "INCOME" ? companyAddress.trim() : undefined,
      isOMNY: txType === "EXPENSE" && (isOMNY || category === "Transit (MTA/OMNY)"),
      nycTaxExempt: txType === "EXPENSE" ? nycTaxExempt : false,
      paymentMethod,
      receiptUrl: receiptUrl || undefined,
      customIcon: customIcon || undefined,
    });

    onClose();
  };

  const currentCategoryData = categoriesList.find((c: any) => c.category === category);
  const currentIncomeCategoryData = incomeCategoriesList.find((c: any) => c.category === incomeCategory);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-lg border ${
              txType === "INCOME" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"
            }`}>
              {txType === "INCOME" ? "+" : "−"}
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                {txType === "INCOME" ? "💵 Add Income Entry" : "💸 Add NYC Expense"}
              </h3>
              <p className="text-[11px] text-slate-400">
                {txType === "INCOME" ? "Track payroll, freelance, side gigs, or sales" : "Log daily NYC transactions & subway taps"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Income / Expense Toggle */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex text-xs font-bold">
              <button
                type="button"
                onClick={() => setTxType("EXPENSE")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  txType === "EXPENSE"
                    ? "bg-rose-500 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setTxType("INCOME")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  txType === "INCOME"
                    ? "bg-emerald-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Income
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Shortcuts bar */}
        <div className="bg-slate-950 px-5 py-2.5 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0">
            {txType === "INCOME" ? "Income Shortcuts:" : "NYC Shortcuts:"}
          </span>
          {txType === "INCOME" ? (
            <>
              <button
                type="button"
                onClick={() => applyIncomePreset("salary")}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-semibold shrink-0 hover:bg-emerald-500/20 transition-all"
              >
                💼 Salary Paycheck
              </button>
              <button
                type="button"
                onClick={() => applyIncomePreset("freelance")}
                className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/30 text-xs font-semibold shrink-0 hover:bg-sky-500/20 transition-all"
              >
                💻 Freelance Gig
              </button>
              <button
                type="button"
                onClick={() => applyIncomePreset("secondhand")}
                className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/30 text-xs font-semibold shrink-0 hover:bg-purple-500/20 transition-all"
              >
                📦 Secondhand Sale
              </button>
              <button
                type="button"
                onClick={() => applyIncomePreset("investment")}
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-semibold shrink-0 hover:bg-amber-500/20 transition-all"
              >
                📈 Investment Interest
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => applyPreset("omny")}
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-semibold shrink-0 hover:bg-amber-500/20 transition-all"
              >
                🚇 OMNY Subway $3.00
              </button>
              <button
                type="button"
                onClick={() => applyPreset("egg_cheese")}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-semibold shrink-0 hover:bg-emerald-500/20 transition-all"
              >
                🥯 Bodega Breakfast $7.50
              </button>
              <button
                type="button"
                onClick={() => applyPreset("halal")}
                className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/30 text-xs font-semibold shrink-0 hover:bg-sky-500/20 transition-all"
              >
                🥙 Halal Cart $12.00
              </button>
              <button
                type="button"
                onClick={() => applyPreset("tjoes")}
                className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/30 text-xs font-semibold shrink-0 hover:bg-purple-500/20 transition-all"
              >
                🛒 Trader Joe's
              </button>
            </>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {/* AI Product Recognition Card */}
          {txType === "EXPENSE" && (
            <div className="bg-gradient-to-r from-amber-950/30 via-slate-900 to-indigo-950/30 border border-amber-500/30 p-3 rounded-2xl space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-200 block">AI Item & Price Recognition</span>
                    <span className="text-[10px] text-slate-400">Scan item, price tag, or menu to auto-fill name & price</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Camera button */}
                  <button
                    type="button"
                    onClick={() => productCameraInputRef.current?.click()}
                    disabled={isRecognizingProduct}
                    className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    {isRecognizingProduct ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                        <span>Scanning...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-3.5 h-3.5" />
                        <span>Camera</span>
                      </>
                    )}
                  </button>

                  {/* Gallery button */}
                  <button
                    type="button"
                    onClick={() => productFileInputRef.current?.click()}
                    disabled={isRecognizingProduct}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1 border border-slate-700 transition-all cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Gallery</span>
                  </button>

                  {/* Hidden inputs */}
                  <input
                    ref={productCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleProductImageSelect}
                    className="hidden"
                  />
                  <input
                    ref={productFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProductImageSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Status Message */}
              {productRecognizedMsg && (
                <div className="text-xs text-amber-300 font-medium bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl flex items-center justify-between">
                  <span>{productRecognizedMsg}</span>
                  <button
                    type="button"
                    onClick={() => setProductRecognizedMsg(null)}
                    className="text-slate-400 hover:text-slate-200 text-xs ml-2 font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Quick Sample Demos */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80 text-[10px] text-slate-400">
                <span className="shrink-0 font-medium text-slate-400">Try AI Recognition Demos:</span>
                <button
                  type="button"
                  onClick={() => loadSampleProductDemo("milk")}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/50"
                >
                  🥛 TJ Milk $4.99
                </button>
                <button
                  type="button"
                  onClick={() => loadSampleProductDemo("nike")}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/50"
                >
                  👟 Nike Sneakers $115
                </button>
                <button
                  type="button"
                  onClick={() => loadSampleProductDemo("coffee")}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/50"
                >
                  ☕ Starbucks $6.45
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {txType === "INCOME" ? "Income Source / Company Payer" : "Merchant / Title"} <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                list="company-name-suggestions"
                placeholder={txType === "INCOME" ? "Enter or select company / source..." : "e.g. Trader Joe's, MTA OMNY..."}
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:border-amber-500 outline-none"
              />
              {txType === "INCOME" && (
                <datalist id="company-name-suggestions">
                  <option value="Google NYC" />
                  <option value="Goldman Sachs" />
                  <option value="JPMorgan Chase" />
                  <option value="Columbia University" />
                  <option value="NYU Langone" />
                  <option value="Meta NYC" />
                  <option value="Amazon NYC" />
                  <option value="Upwork / Freelance" />
                  <option value="Etsy / Shopify" />
                </datalist>
              )}
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {txType === "INCOME" ? "Pre-Tax Wage / Amount ($ USD)" : "Total Amount ($ USD)"} <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-semibold">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onBlur={handleCalculateTax}
                  className={`w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-sm font-bold outline-none focus:border-amber-500 ${
                    txType === "INCOME" ? "text-emerald-400" : "text-amber-400"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Tax & Tip Row (Shown ONLY for EXPENSE) */}
          {txType === "EXPENSE" && (
            <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-400">Sales Tax ($)</label>
                  <button
                    type="button"
                    onClick={handleCalculateTax}
                    className="text-[10px] text-amber-400 hover:underline"
                  >
                    Auto 8.875%
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Tip ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={tip}
                  onChange={(e) => setTip(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              {category === "Shopping & Fashion" && (
                <div className="col-span-2 pt-1 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="nycTaxExempt"
                    checked={nycTaxExempt}
                    onChange={(e) => setNycTaxExempt(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900"
                  />
                  <label htmlFor="nycTaxExempt" className="text-xs text-amber-300 font-medium">
                    NYC Clothing Tax Exempt (Items &lt; $110 are exempt from 8.875% sales tax)
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Category & Subcategory Selection */}
          {txType === "INCOME" ? (
            <div className="bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-xl space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-emerald-300 block mb-1">
                    Income Category
                  </label>
                  <select
                    value={incomeCategory}
                    onChange={(e) => {
                      const cat = e.target.value;
                      setIncomeCategory(cat);
                      const firstSub = incomeCategoriesList.find((c: any) => c.category === cat)?.subCategories[0];
                      setIncomeSubCategory(firstSub || "");
                      setIsEditingPrimary(false);
                      setEditingSubIdx(null);
                    }}
                    className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-emerald-200 focus:border-emerald-400 outline-none font-medium cursor-pointer"
                  >
                    {incomeCategoriesList.map((cat: any) => (
                      <option key={cat.category} value={cat.category}>
                        {cat.icon || "💵"} {cat.category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-emerald-300 block mb-1">
                    Sub-category
                  </label>
                  <select
                    value={incomeSubCategory}
                    onChange={(e) => setIncomeSubCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-emerald-200 focus:border-emerald-400 outline-none font-medium cursor-pointer"
                  >
                    {currentIncomeCategoryData?.subCategories.map((sub: string) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category Management Actions */}
              <div className="flex flex-wrap items-center justify-between text-[11px] gap-2 pt-1 border-t border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPrimaryCatName(incomeCategory);
                      setIsEditingPrimary(!isEditingPrimary);
                    }}
                    className="text-emerald-300 hover:underline flex items-center gap-1 font-semibold"
                  >
                    ✏️ Edit Category Name
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCatManager(!showCatManager)}
                    className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ New Category</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteCurrentCategory(incomeCategory)}
                  className="text-rose-400 hover:underline font-semibold"
                >
                  🗑️ Delete [{incomeCategory}]
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Expense Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const cat = e.target.value as NYCExpenseCategory;
                      setCategory(cat);
                      const firstSub = categoriesList.find((c: any) => c.category === cat)?.subCategories[0];
                      setSubCategory(firstSub || "");
                      setIsEditingPrimary(false);
                      setEditingSubIdx(null);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-amber-500 outline-none font-medium cursor-pointer"
                  >
                    {categoriesList.map((cat: any) => (
                      <option key={cat.category} value={cat.category}>
                        {cat.category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Sub-category
                  </label>
                  <select
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-amber-500 outline-none font-medium cursor-pointer"
                  >
                    {currentCategoryData?.subCategories.map((sub: string) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category Management Actions */}
              <div className="flex flex-wrap items-center justify-between text-[11px] gap-2 pt-1 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPrimaryCatName(category);
                      setIsEditingPrimary(!isEditingPrimary);
                    }}
                    className="text-amber-300 hover:underline flex items-center gap-1 font-semibold"
                  >
                    ✏️ Edit Category Name
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCatManager(!showCatManager)}
                    className="text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ New Category</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteCurrentCategory(category)}
                  className="text-rose-400 hover:underline font-semibold"
                >
                  🗑️ Delete [{category}]
                </button>
              </div>
            </div>
          )}

          {/* Primary Category Rename Panel */}
          {isEditingPrimary && (
            <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/40 space-y-2">
              <span className="text-xs font-bold text-amber-300 block">
                ✏️ Rename Primary Category
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editingPrimaryCatName}
                  onChange={(e) => setEditingPrimaryCatName(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-amber-400 font-medium"
                  placeholder="Enter new category name..."
                />
                <button
                  type="button"
                  onClick={handleRenamePrimaryCategory}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shrink-0"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingPrimary(false)}
                  className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Sub-categories List & Editor Panel */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <span>📂 Sub-categories List:</span>
                <span className="text-amber-400">
                  {txType === "INCOME" ? incomeCategory : category}
                </span>
              </span>
            </div>

            {/* Sub-categories Tags List */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(txType === "INCOME" ? currentIncomeCategoryData : currentCategoryData)?.subCategories.map(
                (subStr: string, idx: number) => {
                  const isEditingThis = editingSubIdx === idx;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 px-2 py-1 rounded-lg text-xs"
                    >
                      {isEditingThis ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editingSubText}
                            onChange={(e) => setEditingSubText(e.target.value)}
                            className="bg-slate-950 border border-amber-400 rounded px-1.5 py-0.5 text-xs text-slate-100 outline-none w-28"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveSubCatRename(idx)}
                            className="text-amber-400 hover:text-amber-300 text-[10px] font-bold"
                          >
                            ✓
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSubIdx(null)}
                            className="text-slate-400 hover:text-slate-200 text-[10px]"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="text-slate-200 font-medium">{subStr}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSubIdx(idx);
                              setEditingSubText(subStr);
                            }}
                            className="text-slate-400 hover:text-amber-300 text-[10px] ml-0.5"
                            title="Edit Subcategory"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubCat(idx)}
                            className="text-slate-500 hover:text-rose-400 text-[10px] ml-0.5 font-bold"
                            title="Delete Subcategory"
                          >
                            ✕
                          </button>
                        </>
                      )}
                    </div>
                  );
                }
              )}
            </div>

            {/* Add New Sub-category Form */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
              <input
                type="text"
                placeholder="+ Add Sub-category..."
                value={newSubInput}
                onChange={(e) => setNewSubInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSubCatToCurrent();
                  }
                }}
                className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-200 outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={handleAddSubCatToCurrent}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-bold text-xs rounded-lg shrink-0"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Dynamic Custom Category Add Form */}
          {showCatManager && (
            <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/40 space-y-2">
              <span className="text-xs font-bold text-amber-300 block">
                ✨ Add New Primary Category ({txType === "INCOME" ? "Income" : "Expense"})
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <input
                  type="text"
                  placeholder={txType === "INCOME" ? "e.g. Dividend / Rental" : "e.g. Credit Card Pay / Pet"}
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 outline-none focus:border-amber-400"
                />
                <input
                  type="text"
                  placeholder="Subcategories (comma separated)"
                  value={newSubCatName}
                  onChange={(e) => setNewSubCatName(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 outline-none focus:border-amber-400"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCatManager(false)}
                  className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddCustomCategory}
                  className="px-3 py-1 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-amber-400 shadow-sm"
                >
                  Save Category
                </button>
              </div>
            </div>
          )}

          {/* Location: Borough & Neighborhood */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                {txType === "INCOME" ? "Location / Neighborhood (Optional)" : "Borough & Neighborhood"}
              </span>
              <button
                type="button"
                onClick={handleAutoDetectLocation}
                disabled={isLocating}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-lg transition-colors"
              >
                <Navigation className="w-3 h-3" />
                <span>{isLocating ? "Locating..." : "📍 Auto Detect Location"}</span>
              </button>
            </div>

            {locationMsg && (
              <p className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                {locationMsg}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Borough</label>
                <select
                  value={borough}
                  onChange={(e) => setBorough(e.target.value as NYCBorough)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-amber-500 outline-none"
                >
                  {NYC_BOROUGHS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Neighborhood / Area</label>
                <select
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-amber-500 outline-none"
                >
                  {NYC_NEIGHBORHOODS.map((n) => (
                    <option key={n.name} value={n.name}>
                      {n.name} ({n.borough})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Date & Payment/Receipt Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {txType === "INCOME" ? "Account / Channel" : "Payment Method"}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-amber-500 outline-none"
              >
                <option value="Bank Checking ACH">Bank Checking (ACH)</option>
                <option value="Direct Deposit / ACH">Direct Deposit (ACH)</option>
                <option value="OTC Card">OTC Card (Health Benefits)</option>
                <option value="Gift Card">Gift Card</option>
                <option value="Apple Pay">Apple Pay</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Chase Sapphire">Chase Sapphire</option>
                <option value="Amex Gold">Amex Gold</option>
                <option value="Cash">Cash</option>
                <option value="Zelle">Zelle</option>
                <option value="Venmo / PayPal">Venmo / PayPal</option>
              </select>
            </div>
          </div>

          {/* Custom Icon Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Transaction Icon (自定义图标 - 可选)
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-950 rounded-xl border border-slate-800 max-h-28 overflow-y-auto">
              {[
                { id: "utensils", name: "Meal / Halal", icon: "🍽️" },
                { id: "coffee", name: "Coffee", icon: "☕" },
                { id: "pizza", name: "Pizza", icon: "🍕" },
                { id: "makeup", name: "Makeup / 美妆", icon: "💄" },
                { id: "lipstick", name: "Beauty / 护肤", icon: "💅" },
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
                  onClick={() => setCustomIcon(ico.id === customIcon ? "" : ico.id)}
                  className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1 transition-all border ${
                    customIcon === ico.id
                      ? "bg-amber-500 text-slate-950 font-bold border-amber-400 shadow"
                      : "bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-800"
                  }`}
                >
                  <span>{ico.icon}</span>
                  <span className="text-[10px]">{ico.name}</span>
                </button>
              ))}
            </div>
            {customIcon && (
              <button
                type="button"
                onClick={() => setCustomIcon("")}
                className="text-[10px] text-amber-400 hover:underline mt-1 inline-block"
              >
                Reset icon to category default
              </button>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Note / Description</label>
            <input
              type="text"
              placeholder={txType === "INCOME" ? "e.g. Base pay + quarterly bonus..." : "e.g. Lunch with friends, includes $2 tip..."}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-amber-500 outline-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 shadow-md transition-all ${
                txType === "INCOME"
                  ? "bg-gradient-to-r from-emerald-400 to-emerald-300 hover:from-emerald-300 hover:to-emerald-200 shadow-emerald-500/20"
                  : "bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 shadow-amber-500/20"
              }`}
            >
              {txType === "INCOME" ? "Save Income" : "Save Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

