"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navigation, { type TabId } from "@/components/Navigation";
import IntakeSetup from "@/components/IntakeSetup";
import DashboardTab from "@/components/tabs/DashboardTab";
import AnalyticsTab from "@/components/tabs/AnalyticsTab";
import ProfileTab from "@/components/tabs/ProfileTab";
import {
  loadData, saveData, getToday, addMealToToday, updateStreak,
  getTodayRecord, STORAGE_KEY,
  type AppData, type MealLog, type UserProfile,
} from "@/lib/storage";

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [appData, setAppData] = useState<AppData | null>(null);
  const [isOnboarding, setIsOnboarding] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [isVisionLoading, setIsVisionLoading] = useState(false);

  // ── Hydrate from localStorage ─────────────────────────────────────────────
  useEffect(() => {
    const saved = loadData();
    if (saved?.profile) {
      setAppData(saved);
      setIsOnboarding(false);
    }
    setIsClient(true);
  }, []);

  // ── Persist to localStorage whenever appData changes ─────────────────────
  useEffect(() => {
    if (appData) saveData(appData);
  }, [appData]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleIntakeComplete = useCallback(
    (calories: number, protein: number, strategy?: string, rawProfile?: Partial<UserProfile>) => {
      const profile: UserProfile = {
        heightCm: rawProfile?.heightCm ?? 175,
        weightKg: rawProfile?.weightKg ?? 70,
        activity: rawProfile?.activity ?? "Moderately Active",
        goal: rawProfile?.goal ?? "",
        targetCalories: calories,
        targetProtein: protein,
        strategy: strategy ?? null,
      };
      const newData: AppData = {
        profile,
        records: [],
        streak: 0,
        lastLogDate: null,
      };
      setAppData(newData);
      setIsOnboarding(false);
    },
    []
  );

  const handleImageSubmit = useCallback(
    async (file: File, description?: string, thumbnailB64?: string) => {
      if (!appData) return;
      setIsVisionLoading(true);
      try {
        const formData = new FormData();
        formData.append("image", file);
        if (description) formData.append("description", description);
        if (appData.profile.goal) formData.append("goal", appData.profile.goal);

        const res = await fetch("/api/vision", { method: "POST", body: formData });
        const data = await res.json();

        if (data && (data.calories || data.food_item)) {
          const meal: MealLog = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            name: data.food_item || data.food_name || "Unknown Food",
            cal: Number(data.calories) || 0,
            pro: Number(data.protein_grams) || 0,
            thumbnailB64: thumbnailB64 || undefined,
          };

          setAppData((prev) => {
            if (!prev) return prev;
            const updatedRecords = addMealToToday(prev.records, meal);
            const { streak, lastLogDate } = updateStreak(prev.streak, prev.lastLogDate);
            return { ...prev, records: updatedRecords, streak, lastLogDate };
          });
        }
      } catch (err) {
        console.error("Vision error:", err);
        alert("Failed to analyze image. Please try again.");
      } finally {
        setIsVisionLoading(false);
      }
    },
    [appData]
  );

  const handleEditMeal = useCallback((id: number, cal: number, pro: number) => {
    const today = getToday();
    setAppData((prev) => {
      if (!prev) return prev;
      const updatedRecords = prev.records.map((record) => {
        if (record.date !== today) return record;
        return {
          ...record,
          meals: record.meals.map((m) =>
            m.id === id ? { ...m, cal, pro } : m
          ),
        };
      });
      return { ...prev, records: updatedRecords };
    });
  }, []);

  const handleReset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }, []);

  // ── Guard: wait for client hydration ─────────────────────────────────────
  if (!isClient) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-emerald-500 animate-spin" />
      </div>
    );
  }

  // ── Onboarding ────────────────────────────────────────────────────────────
  if (isOnboarding || !appData) {
    return (
      <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-white tracking-tight">
              FocusFit <span className="text-emerald-400 italic">AI</span>
            </h1>
            <p className="text-zinc-500 text-sm mt-2">Let&apos;s set up your personal targets</p>
          </div>
          <IntakeSetup onComplete={(cal, pro, strategy, rawProfile) => handleIntakeComplete(cal, pro, strategy, rawProfile)} />
        </div>
      </main>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  const todayRecord = getTodayRecord(appData.records);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      {/* Navigation */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Page content — offset for sidebar on md+ */}
      <main className="
        min-h-screen
        md:ml-16
        pb-24 md:pb-8
        px-4 py-6
        md:px-6 md:py-8
        transition-all duration-300
      ">
        {/* Max-width container */}
        <div className="max-w-6xl mx-auto">

          {/* App header — only on Dashboard */}
          {activeTab === "dashboard" && (
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  FocusFit <span className="text-emerald-400 italic text-xl">AI</span>
                </h1>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </p>
              </div>
              {appData.streak >= 1 && (
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl">
                  <span>🔥</span>
                  <span className="text-emerald-400 font-black text-lg">{appData.streak}</span>
                  <span className="text-zinc-500 text-xs font-semibold">day streak</span>
                </div>
              )}
            </div>
          )}

          {/* Tab routing */}
          {activeTab === "dashboard" && (
            <DashboardTab
              profile={appData.profile}
              todayRecord={todayRecord}
              isVisionLoading={isVisionLoading}
              onImageSubmit={handleImageSubmit}
              onEditMeal={handleEditMeal}
            />
          )}

          {activeTab === "analytics" && (
            <AnalyticsTab
              profile={appData.profile}
              records={appData.records}
              streak={appData.streak}
            />
          )}

          {activeTab === "profile" && (
            <ProfileTab
              profile={appData.profile}
              onReset={handleReset}
            />
          )}
        </div>
      </main>
    </div>
  );
}
