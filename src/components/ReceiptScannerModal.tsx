import React, { useState, useRef } from "react";
import { X, Camera, Sparkles, Check, AlertCircle, RefreshCw, ZoomIn, Plus, Trash2, Calculator, Image as ImageIcon } from "lucide-react";
import { ExpenseTransaction, NYCExpenseCategory, NYCBorough } from "../types";
import { NYC_CATEGORIES } from "../data/nycDefaults";
import { ImageLightboxModal } from "./ImageLightboxModal";
import { compressImageForAI } from "../utils/imageCompressor";

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTransaction: (tx: Omit<ExpenseTransaction, "id" | "createdAt">) => void;
}

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  onSaveTransaction,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [isCompressing, setIsCompressing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAnalyzeReceipt = async (overrideBase64?: string, overrideMime?: string) => {
    const targetImage = overrideBase64 || imagePreview;
    const targetMime = overrideMime || mimeType;

    if (!targetImage) return;

    setIsAnalyzing(true);
    setErrorMsg(null);
    setExtractedData(null);

    try {
      const response = await fetch("/api/parse-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: targetImage,
          mimeType: targetMime,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to parse receipt");
      }

      const data = result.data || {};

      // Normalize Borough
      let rawBorough = data.borough || "Manhattan";
      if (rawBorough === "Bronx") rawBorough = "The Bronx";

      // Ensure all fields are filled
      const filledData = {
        merchant: data.merchant || "Target / Store",
        productName: data.productName || (data.items && data.items[0]?.name) || data.subCategory || "Scanned Merchandise Item",
        total: data.total !== undefined ? Number(data.total) : 0,
        tax: data.tax !== undefined ? Number(data.tax) : 0,
        tip: data.tip !== undefined ? Number(data.tip) : 0,
        date: data.date || new Date().toISOString().split("T")[0],
        category: (data.category as NYCExpenseCategory) || "Shopping & Fashion",
        subCategory: data.subCategory || "General",
        borough: (rawBorough as NYCBorough) || "Manhattan",
        neighborhood: data.neighborhood || "Flushing",
        items: data.items || [],
        nycTaxNote: data.nycTaxNote || "",
        note: data.nycTaxNote || "",
        confidence: data.confidence || 0.95,
      };

      setExtractedData(filledData);
    } catch (err: any) {
      console.error("Receipt parsing error:", err);
      setErrorMsg(err.message || "An error occurred during Gemini receipt scanning. Please try again or edit manually.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setErrorMsg(null);
    setExtractedData(null);

    try {
      const compressed = await compressImageForAI(file, 1280, 0.82);
      setImagePreview(compressed.base64);
      setMimeType(compressed.mimeType);

      // Auto trigger AI receipt analysis immediately on selection/photo!
      handleAnalyzeReceipt(compressed.base64, compressed.mimeType);
    } catch (err) {
      console.error("Image compression error:", err);
      setErrorMsg("Failed to read image. Please select another photo.");
    } finally {
      setIsCompressing(false);
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const loadSampleReceipt = (type: "tj" | "halal" | "uniqlo") => {
    setErrorMsg(null);
    setExtractedData(null);
    if (type === "tj") {
      setExtractedData({
        merchant: "Trader Joe's (Chelsea)",
        productName: "Trader Joe's Organic Groceries & Cold Brew",
        total: 58.75,
        tax: 0,
        tip: 0,
        date: new Date().toISOString().split("T")[0],
        category: "Groceries",
        subCategory: "Trader Joe's",
        borough: "Manhattan",
        neighborhood: "Chelsea",
        items: [
          { name: "Cold Brew Coffee", price: 5.49, qty: 1 },
          { name: "Mandarin Orange Chicken", price: 4.99, qty: 2 },
          { name: "Wild Salmon", price: 12.99, qty: 1 },
          { name: "Organic Produce & Greens", price: 30.29, qty: 1 },
        ],
        nycTaxNote: "Unprepared grocery items are exempt from NYC 8.875% sales tax.",
        confidence: 0.98,
      });
      setImagePreview("https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=80");
    } else if (type === "halal") {
      setExtractedData({
        merchant: "The Halal Guys (53rd & 6th)",
        productName: "Combo Platter + Extra White Sauce",
        total: 16.25,
        tax: 1.25,
        tip: 2.00,
        date: new Date().toISOString().split("T")[0],
        category: "Dining & Bodega",
        subCategory: "Halal Cart",
        borough: "Manhattan",
        neighborhood: "Midtown",
        items: [{ name: "Combo Platter + White Sauce", price: 13.00, qty: 1 }],
        nycTaxNote: "Standard NYC dining sales tax (8.875%) + tip.",
        confidence: 0.95,
      });
      setImagePreview("https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=80");
    } else {
      setExtractedData({
        merchant: "Uniqlo SoHo Flagship",
        productName: "AIRism Cotton T-Shirt & Ankle Pants",
        total: 79.80,
        tax: 0.00,
        tip: 0.00,
        date: new Date().toISOString().split("T")[0],
        category: "Shopping & Fashion",
        subCategory: "Clothing <$110 (Tax Exempt)",
        borough: "Manhattan",
        neighborhood: "SoHo",
        items: [
          { name: "AIRism Cotton T-Shirt", price: 19.90, qty: 2 },
          { name: "Ankle Pants", price: 39.90, qty: 1 },
        ],
        nycTaxNote: "🎉 NYC Tax Exemption: Clothing and footwear under $110 per item are 100% tax-free!",
        confidence: 0.99,
      });
      setImagePreview("https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500&auto=format&fit=crop&q=80");
    }
  };

  const handleConfirmSave = () => {
    if (!extractedData) return;

    const noteText = [
      extractedData.productName ? `Item: ${extractedData.productName}` : "",
      extractedData.note || extractedData.nycTaxNote || "",
    ].filter(Boolean).join(" | ");

    onSaveTransaction({
      merchant: extractedData.merchant || "Unknown Merchant",
      amount: Number(extractedData.total) || 0,
      tax: Number(extractedData.tax) || 0,
      tip: Number(extractedData.tip) || 0,
      date: extractedData.date || new Date().toISOString().split("T")[0],
      category: (extractedData.category as NYCExpenseCategory) || "Other",
      subCategory: extractedData.subCategory || "General",
      borough: (extractedData.borough as NYCBorough) || "Manhattan",
      neighborhood: extractedData.neighborhood || "Midtown",
      note: noteText,
      receiptUrl: imagePreview || undefined,
      items: extractedData.items || (extractedData.productName ? [{ name: extractedData.productName, price: Number(extractedData.total) || 0, qty: 1 }] : []),
      nycTaxExempt: extractedData.category === "Shopping & Fashion" && Number(extractedData.tax) === 0,
      paymentMethod: "Credit Card",
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md md:max-w-4xl lg:max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] transition-all">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm sm:text-base">AI Smart Receipt Scanner</h3>
              <p className="text-[11px] sm:text-xs text-slate-400">NYC Tax (8.875%) & Clothing Tax Exemption AI Analysis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {!imagePreview ? (
            <div className="space-y-4 max-w-xl mx-auto">
              <div className="border-2 border-dashed border-slate-700 bg-slate-950/50 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-3">
                  <Camera className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <h4 className="text-base font-semibold text-slate-100 mb-1">Upload or Take Photo of Receipt</h4>
                <p className="text-xs text-slate-400 mb-5 max-w-md">
                  Supports high-resolution images. Gemini AI extracts merchant, line items, taxes, and subtotal automatically.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-sm">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isCompressing}
                    className="w-full sm:flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer min-h-[44px]"
                  >
                    {isCompressing ? (
                      <div className="w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                    ) : (
                      <>
                        <Camera className="w-4 h-4" />
                        <span>Take Photo</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={isCompressing}
                    className="w-full sm:flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer min-h-[44px]"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Select Photo</span>
                  </button>
                </div>
              </div>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <p className="text-xs font-semibold text-slate-300 mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Don't have a receipt? Try sample receipt presets:</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => loadSampleReceipt("tj")}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors text-left border border-slate-700/60 flex items-center gap-2"
                  >
                    <span className="text-base">🛒</span>
                    <div>
                      <div className="font-bold">Trader Joe's</div>
                      <div className="text-[10px] text-slate-400">Groceries ($58.75)</div>
                    </div>
                  </button>
                  <button
                    onClick={() => loadSampleReceipt("halal")}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors text-left border border-slate-700/60 flex items-center gap-2"
                  >
                    <span className="text-base">🥙</span>
                    <div>
                      <div className="font-bold">Halal Guys</div>
                      <div className="text-[10px] text-slate-400">Food Cart ($16.25)</div>
                    </div>
                  </button>
                  <button
                    onClick={() => loadSampleReceipt("uniqlo")}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors text-left border border-slate-700/60 flex items-center gap-2"
                  >
                    <span className="text-base">👕</span>
                    <div>
                      <div className="font-bold">Uniqlo SoHo</div>
                      <div className="text-[10px] text-slate-400">Clothing Tax-Free ($79.80)</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md pb-2 pt-1 transition-all md:col-span-5 lg:col-span-4 space-y-3">
                <div
                  className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center cursor-pointer group max-h-48 sm:max-h-56 md:max-h-80 shadow-inner"
                  onClick={() => setIsLightboxOpen(true)}
                >
                  <img
                    src={imagePreview}
                    alt="Receipt Preview"
                    className="object-contain max-h-48 sm:max-h-56 md:max-h-80 w-full group-hover:opacity-90 transition-opacity"
                  />
                  <div className="absolute bottom-2 left-2 bg-slate-900/90 text-amber-400 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 sm:py-1 rounded-xl border border-slate-700/80 flex items-center gap-1.5 shadow">
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>View Full Receipt</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setImagePreview(null);
                      setExtractedData(null);
                    }}
                    className="absolute top-2 right-2 bg-slate-900/90 text-slate-300 p-1.5 sm:p-2 rounded-xl hover:bg-slate-800 border border-slate-700 z-10 transition-colors"
                    title="Select Different Photo"
                  >
                    <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>

                {!extractedData && !isAnalyzing && (
                  <button
                    onClick={handleAnalyzeReceipt}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-300 transition-all active:scale-98 min-h-[44px]"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>Scan Receipt with Gemini AI</span>
                  </button>
                )}

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <p className="text-[11px] font-semibold text-slate-400 mb-2">Switch Preset Sample:</p>
                  <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                    <button
                      onClick={() => loadSampleReceipt("tj")}
                      className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-center truncate border border-slate-700/50"
                    >
                      🛒 Trader Joe's
                    </button>
                    <button
                      onClick={() => loadSampleReceipt("halal")}
                      className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-center truncate border border-slate-700/50"
                    >
                      🥙 Halal Guys
                    </button>
                    <button
                      onClick={() => loadSampleReceipt("uniqlo")}
                      className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-center truncate border border-slate-700/50"
                    >
                      👕 Uniqlo
                    </button>
                  </div>
                </div>
              </div>

              <div className="md:col-span-7 lg:col-span-8 space-y-4">
                {isAnalyzing && (
                  <div className="bg-slate-950 border border-amber-500/30 p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 my-4">
                    <div className="w-10 h-10 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-200">Gemini AI Analyzing Receipt...</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Extracting merchant name, total, 8.875% NYC sales tax, and itemized list...
                      </p>
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {extractedData && (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                        <Check className="w-4 h-4" />
                        <span>Scan Complete ({Math.round((extractedData.confidence || 0.95) * 100)}% Confidence)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400 font-medium">Main Category:</span>
                        <select
                          value={extractedData.category || "Shopping & Fashion"}
                          onChange={(e) => {
                            const newCat = e.target.value as NYCExpenseCategory;
                            const catObj = NYC_CATEGORIES.find((c) => c.category === newCat);
                            setExtractedData({
                              ...extractedData,
                              category: newCat,
                              subCategory: catObj?.subCategories?.[0] || "General",
                            });
                          }}
                          className="bg-slate-900 border border-amber-500/40 text-amber-300 font-bold px-2.5 py-1 rounded-lg text-xs outline-none cursor-pointer focus:border-amber-400"
                        >
                          {NYC_CATEGORIES.map((c) => (
                            <option key={c.category} value={c.category}>
                              {c.category}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">Merchant / Store Name</label>
                        <input
                          type="text"
                          value={extractedData.merchant || ""}
                          onChange={(e) =>
                            setExtractedData({ ...extractedData, merchant: e.target.value })
                          }
                          placeholder="e.g. Target, Trader Joe's"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-semibold text-xs sm:text-sm focus:border-amber-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">Product / Item Title</label>
                        <input
                          type="text"
                          value={extractedData.productName || ""}
                          onChange={(e) =>
                            setExtractedData({ ...extractedData, productName: e.target.value })
                          }
                          placeholder="e.g. Lodge 12' Cast Iron Skillet"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs sm:text-sm focus:border-amber-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">Total Amount ($ USD)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={extractedData.total || 0}
                          onChange={(e) =>
                            setExtractedData({ ...extractedData, total: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-bold text-xs sm:text-sm focus:border-amber-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">Main Category</label>
                        <select
                          value={extractedData.category || "Shopping & Fashion"}
                          onChange={(e) => {
                            const newCat = e.target.value as NYCExpenseCategory;
                            const catObj = NYC_CATEGORIES.find((c) => c.category === newCat);
                            setExtractedData({
                              ...extractedData,
                              category: newCat,
                              subCategory: catObj?.subCategories?.[0] || "General",
                            });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-200 font-medium text-xs sm:text-sm focus:border-amber-500 outline-none cursor-pointer"
                        >
                          {NYC_CATEGORIES.map((c) => (
                            <option key={c.category} value={c.category}>
                              {c.category}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">Sub-Category / Tag</label>
                        <select
                          value={extractedData.subCategory || ""}
                          onChange={(e) =>
                            setExtractedData({ ...extractedData, subCategory: e.target.value })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-200 text-xs sm:text-sm focus:border-amber-500 outline-none cursor-pointer"
                        >
                          {(
                            NYC_CATEGORIES.find((c) => c.category === extractedData.category)
                              ?.subCategories || ["General"]
                          ).map((sub) => (
                            <option key={sub} value={sub}>
                              {sub}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">Date</label>
                        <input
                          type="date"
                          value={extractedData.date || new Date().toISOString().split("T")[0]}
                          onChange={(e) =>
                            setExtractedData({ ...extractedData, date: e.target.value })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs sm:text-sm focus:border-amber-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">Sales Tax ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={extractedData.tax || 0}
                          onChange={(e) =>
                            setExtractedData({ ...extractedData, tax: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs sm:text-sm focus:border-amber-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">Tip ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={extractedData.tip || 0}
                          onChange={(e) =>
                            setExtractedData({ ...extractedData, tip: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs sm:text-sm focus:border-amber-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">NYC Borough</label>
                        <select
                          value={extractedData.borough || "Manhattan"}
                          onChange={(e) =>
                            setExtractedData({ ...extractedData, borough: e.target.value as NYCBorough })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-200 text-xs sm:text-sm focus:border-amber-500 outline-none cursor-pointer"
                        >
                          <option value="Manhattan">Manhattan</option>
                          <option value="Brooklyn">Brooklyn</option>
                          <option value="Queens">Queens</option>
                          <option value="The Bronx">The Bronx</option>
                          <option value="Staten Island">Staten Island</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1 flex items-center justify-between">
                        <span>Notes & NYC Tax Details (Editable)</span>
                        <span className="text-[10px] text-slate-500 font-normal">Add custom notes or tax exemption remarks</span>
                      </label>
                      <textarea
                        rows={2}
                        value={extractedData.note !== undefined ? extractedData.note : (extractedData.nycTaxNote || "")}
                        onChange={(e) =>
                          setExtractedData({
                            ...extractedData,
                            note: e.target.value,
                            nycTaxNote: e.target.value,
                          })
                        }
                        placeholder="Enter custom notes, tax exemptions, or details..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-amber-200 focus:border-amber-500 outline-none resize-none leading-relaxed"
                      />
                    </div>

                    <div className="pt-3 border-t border-slate-800 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                          <span>🛒 Itemized Purchased Items</span>
                          <span className="text-[10px] text-slate-500 font-normal">(Editable names & prices)</span>
                        </p>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const items = extractedData.items || [];
                              const sum = items.reduce(
                                (acc: number, it: any) => acc + (parseFloat(it.price) || 0),
                                0
                              );
                              if (sum > 0) {
                                setExtractedData({
                                  ...extractedData,
                                  total: Number(sum.toFixed(2))
                                });
                              }
                            }}
                            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-medium rounded-lg border border-slate-700/80 flex items-center gap-1 transition-colors"
                          >
                            <Calculator className="w-3 h-3 text-amber-400" />
                            <span>Sum Items to Total</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const items = [...(extractedData.items || []), { name: "", price: 0, qty: 1 }];
                              setExtractedData({ ...extractedData, items });
                            }}
                            className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[11px] font-medium rounded-lg border border-amber-500/30 flex items-center gap-1 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Item</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {(extractedData.items || []).map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800/80">
                            <input
                              type="text"
                              value={item.name || ""}
                              onChange={(e) => {
                                const items = [...(extractedData.items || [])];
                                items[idx] = { ...items[idx], name: e.target.value };
                                setExtractedData({ ...extractedData, items });
                              }}
                              placeholder="Item description"
                              className="flex-1 bg-transparent border-none text-slate-200 text-xs px-1 outline-none"
                            />
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-slate-500 text-xs">$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={item.price || 0}
                                onChange={(e) => {
                                  const items = [...(extractedData.items || [])];
                                  items[idx] = { ...items[idx], price: parseFloat(e.target.value) || 0 };
                                  setExtractedData({ ...extractedData, items });
                                }}
                                className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-amber-400 text-xs font-semibold outline-none text-right"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const items = (extractedData.items || []).filter((_: any, i: number) => i !== idx);
                                  setExtractedData({ ...extractedData, items });
                                }}
                                className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleConfirmSave}
                        className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer min-h-[44px]"
                      >
                        <Check className="w-5 h-5" />
                        <span>Confirm & Save Transaction to NYC Ledger</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {imagePreview && (
        <ImageLightboxModal
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          imageUrl={imagePreview}
        />
      )}
    </div>
  );
};

export default ReceiptScannerModal;
