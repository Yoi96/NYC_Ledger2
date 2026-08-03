import React, { useState } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, Download } from "lucide-react";

interface ImageLightboxModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  imageUrl,
  title = "Receipt Image Preview",
  onClose,
}) => {
  const [scale, setScale] = useState(1);

  if (!isOpen || !imageUrl) return null;

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.3, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.3, 0.5));
  const handleResetZoom = () => setScale(1);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `Receipt_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col justify-between p-4"
      onClick={onClose}
    >
      {/* Top Header Bar */}
      <div
        className="flex items-center justify-between z-10 bg-slate-900/80 border border-slate-800 p-3 rounded-2xl max-w-lg mx-auto w-full text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="font-bold text-xs sm:text-sm text-slate-100 truncate">{title}</span>

        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono w-10 text-center text-amber-400 font-bold">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors font-semibold"
            title="Download Image"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors ml-1"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Image Container */}
      <div
        className="flex-1 flex items-center justify-center overflow-auto p-4 my-2 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt="Receipt Large"
          style={{ transform: `scale(${scale})` }}
          className="max-h-[75vh] max-w-full object-contain transition-transform duration-200 rounded-xl shadow-2xl border border-slate-800 cursor-grab active:cursor-grabbing"
        />
      </div>

      {/* Footer hint */}
      <div className="text-center text-[11px] text-slate-400 z-10 bg-slate-900/60 py-1.5 px-3 rounded-full max-w-xs mx-auto border border-slate-800">
        💡Click the zoom button in the top-right corner, or click the empty space in the background to close.
      </div>
    </div>
  );
};
