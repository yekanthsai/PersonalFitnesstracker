"use client";

import React, { useRef, useState } from "react";
import { Camera, Image as ImageIcon, X, Sparkles, Loader2 } from "lucide-react";

interface CameraLogProps {
  onImageSubmit: (file: File, description?: string, thumbnailB64?: string) => void;
  isLoading: boolean;
}

/** Resizes an image file to a small base64 thumbnail via canvas */
async function generateThumbnail(file: File, size = 80): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(""); URL.revokeObjectURL(url); return; }
      // Cover-crop to square
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { resolve(""); URL.revokeObjectURL(url); };
    img.src = url;
  });
}

export default function CameraLog({ onImageSubmit, isLoading }: CameraLogProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [mealDescription, setMealDescription] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMealDescription("");
    e.target.value = "";
  };

  const handleClear = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPendingFile(null);
    setMealDescription("");
  };

  const handleConfirmAnalyze = async () => {
    if (!pendingFile || isLoading) return;
    const thumbnailB64 = await generateThumbnail(pendingFile);
    onImageSubmit(pendingFile, mealDescription.trim(), thumbnailB64);
    // Clear preview after submitting
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPendingFile(null);
    setMealDescription("");
  };

  return (
    <div className="w-full bg-zinc-900/60 backdrop-blur-xl p-6 rounded-3xl border border-white/5 shadow-lg">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-lg text-white">Log Meal</h3>
        <span className="text-xs text-zinc-500 font-semibold bg-black/30 px-3 py-1 rounded-full border border-white/5">
          Vision AI
        </span>
      </div>

      {!previewUrl ? (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="w-full h-24 border border-emerald-500/20 bg-emerald-500/8 hover:bg-emerald-500/15 transition-all rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer group shadow-inner"
          >
            <Camera className="text-emerald-400 group-hover:scale-110 transition-transform drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]" size={26} />
            <span className="text-emerald-400 font-bold tracking-wide text-sm">Take Photo</span>
          </button>

          <button
            onClick={() => galleryInputRef.current?.click()}
            className="w-full h-14 border border-white/5 bg-white/3 hover:bg-white/8 transition-all rounded-xl flex items-center justify-center gap-2 cursor-pointer group"
          >
            <ImageIcon className="text-zinc-400 group-hover:text-zinc-200 transition-colors" size={18} />
            <span className="text-zinc-400 group-hover:text-zinc-200 font-medium text-sm transition-colors">Choose from Gallery</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Preview */}
          <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-black/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Meal preview"
              className={`w-full h-52 object-cover transition-opacity duration-300 ${isLoading ? "opacity-20" : "opacity-100"}`}
            />
            {!isLoading && (
              <button
                onClick={handleClear}
                className="absolute top-3 right-3 bg-black/60 backdrop-blur-md p-1.5 rounded-full hover:bg-black transition-colors border border-white/10"
              >
                <X size={15} className="text-white" />
              </button>
            )}
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 backdrop-blur-sm">
                <Loader2 className="text-emerald-400 animate-spin drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" size={34} />
                <p className="text-sm font-bold text-white bg-black/60 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                  Calculating...
                </p>
              </div>
            )}
          </div>

          {/* Description + Confirm */}
          {!isLoading && (
            <>
              <input
                type="text"
                value={mealDescription}
                onChange={(e) => setMealDescription(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConfirmAnalyze()}
                placeholder="What are you eating? (Optional — helps AI accuracy)"
                className="w-full bg-black/30 text-white text-sm rounded-xl px-4 py-3.5 outline-none focus:ring-1 focus:ring-emerald-500/50 border border-white/8 placeholder-zinc-600 transition-all shadow-inner"
              />
              <button
                onClick={handleConfirmAnalyze}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(16,185,129,0.3)] active:scale-95"
              >
                <Sparkles size={17} />
                Confirm &amp; Analyze
              </button>
            </>
          )}
        </div>
      )}

      <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleFileChange} />
      <input type="file" accept="image/*" className="hidden" ref={galleryInputRef} onChange={handleFileChange} />
    </div>
  );
}
