"use client";

import React, { useState } from "react";
import { ChevronRight, ArrowLeft, Target, User2, CheckCircle2 } from "lucide-react";

interface RawProfile {
  heightCm: number;
  weightKg: number;
  activity: string;
  goal: string;
}

interface IntakeSetupProps {
  onComplete: (calories: number, protein: number, strategy?: string, rawProfile?: RawProfile) => void;
}

export default function IntakeSetup({ onComplete }: IntakeSetupProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── Form State (metric) ──
  const [heightCm, setHeightCm] = useState(175); // cm, default 5'9"
  const [weightKg, setWeightKg] = useState(70.0); // kg, increments by 0.5
  const [activityMode, setActivityMode] = useState("Moderately Active");
  const [goalText, setGoalText] = useState("");

  const handleNext = () => { if (step < 3) setStep(step + 1); };
  const handleBack = () => { if (step > 1) setStep(step - 1); };

  const handleSubmit = async () => {
    if (!goalText.trim() || isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    // Debug helper — shows in browser DevTools if the key is absent
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      console.error("Gemini API Key is missing! Set NEXT_PUBLIC_GEMINI_API_KEY in your .env.local file.");
    }

    try {
      const payload = {
        physicals: {
          height: `${heightCm} cm`,
          weight: `${weightKg} kg`,
        },
        activity: activityMode,
        goal: goalText,
      };

      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data && data.daily_calories) {
        setIsSuccess(true);
        setTimeout(() => {
          onComplete(data.daily_calories, data.daily_protein, data.strategy_name, {
            heightCm: heightCm,
            weightKg: weightKg,
            activity: activityMode,
            goal: goalText,
          });
        }, 1800);
      } else {
        // Stay on Step 3 — do NOT navigate to dashboard
        setErrorMessage("AI is currently resting. Please check your connection or try again in a moment.");
      }
    } catch (error) {
      console.error("Intake API error:", error);
      setErrorMessage("AI is currently resting. Please check your connection or try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full min-h-[550px] flex flex-col bg-background-card backdrop-blur-xl rounded-3xl border border-border-card overflow-hidden shadow-2xl relative">

      {/* ── Progress Bar & Header ── */}
      <div className="p-6 pb-2 relative z-10 w-full">
        <div className="flex gap-2 w-full mb-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${step >= n ? "bg-primary" : "bg-white/10"}`} />
          ))}
        </div>

        {!isSuccess && (
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button onClick={handleBack} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                <ArrowLeft size={18} />
              </button>
            )}
            <h2 className="text-xl font-extrabold text-white">
              {step === 1 && "Body Metrics"}
              {step === 2 && "Activity Level"}
              {step === 3 && "Your Goal"}
            </h2>
          </div>
        )}
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col px-6 py-4 overflow-y-auto w-full max-w-sm mx-auto z-10">

        {/* Step 1: Height (cm) + Weight (kg) */}
        {step === 1 && !isSuccess && (
          <div className="flex flex-col gap-10 w-full animate-in fade-in slide-in-from-right-4 duration-500 my-auto">

            {/* Height */}
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center gap-2 mb-4 text-gray-400">
                <User2 size={16} />
                <span className="text-sm font-semibold uppercase tracking-wider">Height</span>
              </div>
              <div className="flex items-center justify-center gap-6 w-full px-4 py-8 bg-black/40 rounded-2xl border border-white/5">
                <button
                  onClick={() => setHeightCm(Math.max(120, heightCm - 1))}
                  className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all text-xl font-bold pb-1"
                >
                  -
                </button>
                <span className="text-4xl font-extrabold w-36 text-center text-white">
                  {heightCm} <span className="text-xl font-semibold text-gray-400">cm</span>
                </span>
                <button
                  onClick={() => setHeightCm(Math.min(220, heightCm + 1))}
                  className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all text-xl font-bold pb-1"
                >
                  +
                </button>
              </div>
            </div>

            {/* Weight */}
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center gap-2 mb-4 text-gray-400">
                <span className="text-sm font-semibold uppercase tracking-wider">Weight (kg)</span>
              </div>
              <div className="flex items-center justify-center gap-6 w-full px-4 py-8 bg-black/40 rounded-2xl border border-white/5">
                <button
                  onClick={() => setWeightKg(prev => Math.round(Math.max(30, prev - 0.5) * 10) / 10)}
                  className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all text-xl font-bold pb-1"
                >
                  -
                </button>
                <span className="text-4xl font-extrabold w-36 text-center text-white">
                  {weightKg.toFixed(1)} <span className="text-xl font-semibold text-gray-400">kg</span>
                </span>
                <button
                  onClick={() => setWeightKg(prev => Math.round(Math.min(200, prev + 0.5) * 10) / 10)}
                  className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all text-xl font-bold pb-1"
                >
                  +
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-3 font-medium">Increments of 0.5 kg</p>
            </div>
          </div>
        )}

        {/* Step 2: Activity Level */}
        {step === 2 && !isSuccess && (
          <div className="flex flex-col gap-3 w-full animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
            <p className="text-gray-400 text-sm mb-4 text-center px-4">How active are you on an average weekly basis?</p>
            {[
              { id: "Sedentary", desc: "Desk job, little to no exercise" },
              { id: "Lightly Active", desc: "Light exercise 1-3 days/week" },
              { id: "Moderately Active", desc: "Moderate exercise 3-5 days/week" },
              { id: "Very Active", desc: "Heavy exercise 6-7 days a week" },
            ].map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => setActivityMode(lvl.id)}
                className={`p-4 rounded-2xl border text-left flex flex-col gap-1 transition-all
                  ${activityMode === lvl.id
                    ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-primary"
                    : "border-white/5 bg-black/40 hover:bg-white/5"}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`font-bold ${activityMode === lvl.id ? "text-primary" : "text-gray-200"}`}>{lvl.id}</span>
                  {activityMode === lvl.id && <CheckCircle2 size={16} className="text-primary" />}
                </div>
                <span className="text-xs text-gray-500 font-medium">{lvl.desc}</span>
              </button>
            ))}
          </div>
        )}

        {/* Step 3: Goal text */}
        {step === 3 && !isSuccess && (
          <div className="flex flex-col gap-4 w-full h-full animate-in fade-in slide-in-from-right-4 duration-500 relative pb-10">
            <div className="flex items-center justify-center bg-secondary/10 w-16 h-16 rounded-full mx-auto mb-2 text-secondary">
              <Target size={28} />
            </div>
            <p className="text-center text-sm text-gray-400 font-medium px-4 mb-2">
              In your own words, describe your goal. The AI will parse this to set your calorie &amp; protein targets.
            </p>
            <textarea
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              placeholder="e.g. I want to lose 10 kg by summer while keeping my muscle. I lift 4x a week."
              className="w-full flex-1 min-h-[160px] bg-black/40 p-4 rounded-2xl resize-none text-white outline-none border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-gray-600 shadow-inner leading-relaxed"
            />
          </div>
        )}

        {/* Success / Loading overlay */}
        {(isLoading || isSuccess) && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background-card/90 backdrop-blur-md animate-in fade-in">
            {isLoading ? (
              <>
                <div className="w-16 h-16 rounded-full border-4 border-white/5 border-t-primary animate-spin mb-6" />
                <h3 className="text-xl font-bold text-white mb-2">Analyzing your profile</h3>
                <p className="text-sm text-gray-400">Gemini is configuring your strategy...</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-6 animate-pulse shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Targets Locked</h3>
                <p className="text-sm text-gray-400">Loading your dashboard...</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Next / Submit footer ── */}
      {!isLoading && !isSuccess && (
        <div className="p-6 pt-2 z-10 mt-auto">
          {/* Inline error banner — only shows on Step 3 after a failed API call */}
          {errorMessage && step === 3 && (
            <div className="mb-3 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-center animate-in fade-in duration-300">
              ⚠️ {errorMessage}
            </div>
          )}
          <button
            onClick={step < 3 ? handleNext : handleSubmit}
            disabled={step === 3 && !goalText.trim()}
            className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-black font-extrabold text-lg py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {step < 3 ? "Next Step" : "Generate Strategy"}
            {step < 3 && <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </div>
      )}

      {/* Background decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
    </div>
  );
}
