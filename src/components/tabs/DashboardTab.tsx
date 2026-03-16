"use client";

import React, { useMemo } from "react";
import DashboardRings from "@/components/DashboardRings";
import CameraLog from "@/components/CameraLog";
import { Flame, Utensils, Clock, Zap } from "lucide-react";
import type { UserProfile, DailyRecord, MealLog } from "@/lib/storage";
import { sumRecord } from "@/lib/storage";

interface DashboardTabProps {
  profile: UserProfile;
  todayRecord: DailyRecord;
  isVisionLoading: boolean;
  onImageSubmit: (file: File, description?: string, thumbnailB64?: string) => void;
  onEditMeal: (id: number, cal: number, pro: number) => void;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function DashboardTab({
  profile,
  todayRecord,
  isVisionLoading,
  onImageSubmit,
  onEditMeal,
}: DashboardTabProps) {
  const { cal: currentCal, pro: currentPro } = useMemo(() => sumRecord(todayRecord), [todayRecord]);

  const calPct = Math.min(Math.round((currentCal / profile.targetCalories) * 100), 100);
  const proPct = Math.min(Math.round((currentPro / profile.targetProtein) * 100), 100);

  return (
    <div className="flex flex-col gap-6 w-full">

      {/* ── Goal Header Strip ── */}
      <div className="w-full bg-zinc-900/70 border border-white/5 backdrop-blur-md rounded-3xl px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Today&apos;s Targets</p>
          <p className="text-white font-bold text-lg">
            <span className="text-emerald-400">{profile.targetCalories.toLocaleString()} kcal</span>
            <span className="text-zinc-600 mx-2">·</span>
            <span className="text-blue-400">{profile.targetProtein}g protein</span>
          </p>
        </div>
        <div className="flex gap-6">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
              <Flame size={14} className="drop-shadow-[0_0_4px_rgba(16,185,129,0.8)]" />
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Eaten</span>
            </div>
            <span className="text-white font-bold text-base">{currentCal} <span className="text-zinc-500 text-xs">/ {profile.targetCalories}</span></span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-blue-400 mb-1">
              <Utensils size={14} className="drop-shadow-[0_0_4px_rgba(59,130,246,0.8)]" />
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Protein</span>
            </div>
            <span className="text-white font-bold text-base">{currentPro}g <span className="text-zinc-500 text-xs">/ {profile.targetProtein}g</span></span>
          </div>
        </div>
      </div>

      {/* ── Main Grid: Rings + Logging ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Rings */}
        <div className="lg:col-span-5 xl:col-span-4">
          <DashboardRings
            currentCalories={currentCal}
            targetCalories={profile.targetCalories}
            currentProtein={currentPro}
            targetProtein={profile.targetProtein}
            isLoading={isVisionLoading}
          />
        </div>

        {/* Right: Camera + Meal History */}
        <div className="flex flex-col gap-6 lg:col-span-7 xl:col-span-8">
          <CameraLog onImageSubmit={onImageSubmit} isLoading={isVisionLoading} />

          {/* ── Meal History List ── */}
          <div className="bg-zinc-900/60 border border-white/5 rounded-3xl p-6 backdrop-blur-md shadow-lg">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-emerald-400" />
                <h3 className="font-bold text-zinc-200">Today&apos;s Meals</h3>
              </div>
              <span className="text-xs text-zinc-600 font-medium bg-white/5 px-3 py-1 rounded-full border border-white/5">
                {todayRecord.meals.length} logged
              </span>
            </div>

            {todayRecord.meals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-50">
                <Utensils size={28} className="text-zinc-600 mb-3" />
                <p className="text-sm text-zinc-500 font-medium">No meals yet today</p>
                <p className="text-xs text-zinc-600 mt-1">Snap a photo above to log your first meal</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                {todayRecord.meals.map((meal) => (
                  <MealCard key={meal.id} meal={meal} onEdit={onEditMeal} />
                ))}
              </div>
            )}

            {/* Goal progress bars */}
            {todayRecord.meals.length > 0 && (
              <div className="mt-5 pt-5 border-t border-white/5 flex flex-col gap-3">
                <ProgressBar label="Energy" value={calPct} color="emerald" />
                <ProgressBar label="Protein" value={proPct} color="blue" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function MealCard({ meal, onEdit }: { meal: MealLog; onEdit: (id: number, cal: number, pro: number) => void }) {
  return (
    <div className="flex items-center gap-3 bg-black/30 border border-white/5 rounded-2xl p-3 hover:bg-white/5 transition-colors group">
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 shrink-0 border border-white/5">
        {meal.thumbnailB64 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={meal.thumbnailB64} alt={meal.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            <Utensils size={16} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm capitalize truncate">{meal.name}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <Clock size={10} className="text-zinc-600" />
          <span className="text-xs text-zinc-600">{formatTime(meal.timestamp)}</span>
        </div>
      </div>

      {/* Chips */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
          {meal.cal} kcal
        </span>
        <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">
          {meal.pro}g
        </span>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, color }: { label: string; value: number; color: "emerald" | "blue" }) {
  const barClass = color === "emerald"
    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
    : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]";
  const textClass = color === "emerald" ? "text-emerald-400" : "text-blue-400";

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-500 w-12 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barClass}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={`text-xs font-bold w-8 text-right ${textClass}`}>{value}%</span>
    </div>
  );
}
