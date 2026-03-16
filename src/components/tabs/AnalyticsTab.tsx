"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import { Sparkles, Flame, TrendingUp, Loader2, BrainCircuit } from "lucide-react";
import type { DailyRecord, UserProfile } from "@/lib/storage";
import { getLastNDays, sumRecord } from "@/lib/storage";

interface AnalyticsTabProps {
  profile: UserProfile;
  records: DailyRecord[];
  streak: number;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface ChartDatum {
  day: string;
  calories: number;
  protein: number;
  goal: number;
  met: boolean;
}

// ── Custom Recharts Tooltip ──────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900/95 border border-white/10 rounded-xl px-4 py-3 shadow-2xl backdrop-blur-md text-sm">
      <p className="text-zinc-400 font-semibold mb-2">{label}</p>
      <p className="text-emerald-400 font-bold">{payload[0]?.value ?? 0} kcal</p>
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
export default function AnalyticsTab({ profile, records, streak }: AnalyticsTabProps) {
  const [coachInsight, setCoachInsight] = useState<string | null>(null);
  const [isCoachLoading, setIsCoachLoading] = useState(false);
  const [coachFetched, setCoachFetched] = useState(false);

  // Build Chart Data — last 7 days
  const chartData: ChartDatum[] = useMemo(() => {
    const last7 = getLastNDays(records, 7);
    return last7.map((record) => {
      const { cal, pro } = sumRecord(record);
      const date = new Date(record.date + "T00:00:00");
      const withinGoal = cal >= profile.targetCalories * 0.9 && cal <= profile.targetCalories * 1.1;
      return {
        day: DAY_LABELS[date.getDay()],
        calories: cal,
        protein: pro,
        goal: profile.targetCalories,
        met: withinGoal,
      };
    });
  }, [records, profile.targetCalories]);

  const totalDaysLogged = chartData.filter((d) => d.calories > 0).length;
  const avgCal = totalDaysLogged > 0
    ? Math.round(chartData.reduce((s, d) => s + d.calories, 0) / totalDaysLogged)
    : 0;

  // Fetch AI Coach insight on tab mount (only once per session)
  useEffect(() => {
    if (coachFetched || totalDaysLogged < 1) return;
    setCoachFetched(true);
    setIsCoachLoading(true);

    const last7 = getLastNDays(records, 7);
    const weekSummary = last7
      .map((r) => {
        const { cal, pro } = sumRecord(r);
        return `${r.date} | ${cal} kcal | ${pro}g protein`;
      })
      .join("\n");

    fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weekSummary,
        targetCalories: profile.targetCalories,
        targetProtein: profile.targetProtein,
        strategy: profile.strategy,
      }),
    })
      .then((r) => r.json())
      .then((data) => setCoachInsight(data.insight ?? null))
      .catch(() => setCoachInsight("Keep logging consistently — patterns emerge after a few days!"))
      .finally(() => setIsCoachLoading(false));
  }, [coachFetched, totalDaysLogged, records, profile]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Top Stats Row ── */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={<Flame size={18} className="text-emerald-400" />} label="Avg Daily" value={`${avgCal} kcal`} />
        <StatCard icon={<TrendingUp size={18} className="text-blue-400" />} label="Days Logged" value={`${totalDaysLogged} / 7`} />
        <StatCard
          icon={<span className="text-lg">🔥</span>}
          label="Day Streak"
          value={`${streak}`}
          highlight={streak >= 3}
        />
      </div>

      {/* ── Weekly Bar Chart ── */}
      <div className="bg-zinc-900/60 border border-white/5 rounded-3xl p-6 backdrop-blur-md shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-zinc-200 text-lg">Weekly Calories</h3>
            <p className="text-xs text-zinc-500 mt-0.5">vs. daily goal of {profile.targetCalories.toLocaleString()} kcal</p>
          </div>
          <span className="text-xs text-zinc-600 bg-white/5 border border-white/5 px-3 py-1.5 rounded-full">Last 7 days</span>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barSize={28} margin={{ top: 10, right: 4, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#71717a", fontSize: 12, fontWeight: 600 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#52525b", fontSize: 11 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(v >= 1000 ? 1 : 0)}${v >= 1000 ? "k" : ""}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)", radius: 8 }} />
            <ReferenceLine
              y={profile.targetCalories}
              stroke="rgba(16,185,129,0.4)"
              strokeDasharray="5 4"
              strokeWidth={1.5}
              label={{ value: "Goal", position: "right", fill: "#10b981", fontSize: 10 }}
            />
            <Bar dataKey="calories" radius={[6, 6, 2, 2]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.calories === 0
                    ? "rgba(255,255,255,0.04)"
                    : entry.met
                    ? "rgba(16,185,129,0.75)"
                    : "rgba(255,255,255,0.15)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-emerald-500/75" />
            <span className="text-xs text-zinc-500">Within goal (±10%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-white/15" />
            <span className="text-xs text-zinc-500">Outside goal</span>
          </div>
        </div>
      </div>

      {/* ── AI Coach Glassmorphism Card ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950/40 via-zinc-900/60 to-blue-950/30 border border-emerald-500/15 rounded-3xl p-6 backdrop-blur-xl shadow-lg">
        {/* Background glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-blue-500/8 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.3)]">
              <BrainCircuit size={18} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">AI Coach</h3>
              <p className="text-xs text-zinc-500">Powered by Gemini</p>
            </div>
            {!isCoachLoading && coachInsight && (
              <span className="ml-auto text-xs text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20 font-semibold">
                <Sparkles size={10} className="inline mr-1" />Live
              </span>
            )}
          </div>

          {isCoachLoading ? (
            <div className="flex items-center gap-3 py-4">
              <Loader2 size={18} className="text-emerald-400 animate-spin shrink-0" />
              <span className="text-zinc-400 text-sm">Analyzing your week...</span>
            </div>
          ) : coachInsight ? (
            <p className="text-zinc-300 text-sm leading-relaxed font-medium">{coachInsight}</p>
          ) : totalDaysLogged === 0 ? (
            <p className="text-zinc-500 text-sm leading-relaxed">
              Log your first meal today — the AI Coach will analyze your patterns after 1–2 days of data.
            </p>
          ) : null}
        </div>
      </div>

      {/* ── Protein Tracker ── */}
      <div className="bg-zinc-900/60 border border-white/5 rounded-3xl p-6 backdrop-blur-md shadow-lg">
        <h3 className="font-bold text-zinc-200 mb-5">Protein — Last 7 Days</h3>
        <div className="flex flex-col gap-3">
          {chartData.map((d, i) => {
            const pct = Math.min(Math.round((d.protein / profile.targetProtein) * 100), 100);
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-zinc-500 w-8 shrink-0">{d.day}</span>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-700 ease-out shadow-[0_0_6px_rgba(59,130,246,0.5)]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-blue-400 w-14 text-right">{d.protein}g</span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

// ── Shared sub-component ────────────────────────────────────────────────────
function StatCard({ icon, label, value, highlight = false }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 py-5 px-3 rounded-2xl border transition-all duration-200 ${
      highlight
        ? "bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
        : "bg-zinc-900/60 border-white/5"
    }`}>
      {icon}
      <span className="text-2xl font-black text-white">{value}</span>
      <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider text-center">{label}</span>
    </div>
  );
}
