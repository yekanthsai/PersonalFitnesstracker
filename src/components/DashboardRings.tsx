"use client";

import React, { useEffect, useState } from "react";
import { Activity, Flame, Utensils } from "lucide-react";

interface DashboardRingsProps {
  currentCalories: number;
  targetCalories: number;
  currentProtein: number;
  targetProtein: number;
  isLoading?: boolean;
}

export default function DashboardRings({
  currentCalories,
  targetCalories,
  currentProtein,
  targetProtein,
  isLoading = false,
}: DashboardRingsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const calPercent = Math.min((currentCalories / targetCalories) * 100, 100) || 0;
  const proPercent = Math.min((currentProtein / targetProtein) * 100, 100) || 0;

  const radiusOuter = 100;
  const radiusInner = 75;
  const strokeWidth = 18;
  const center = 130;

  const circumferenceOuter = 2 * Math.PI * radiusOuter;
  const circumferenceInner = 2 * Math.PI * radiusInner;

  const strokeDashoffsetOuter = mounted
    ? circumferenceOuter - (calPercent / 100) * circumferenceOuter
    : circumferenceOuter;
  
  const strokeDashoffsetInner = mounted
    ? circumferenceInner - (proPercent / 100) * circumferenceInner
    : circumferenceInner;

  return (
    <div className="flex flex-col items-center justify-center w-full px-4 py-8 bg-background-card backdrop-blur-xl rounded-3xl border border-border-card shadow-lg relative overflow-hidden">
      {/* Background glow logic could go here */}
      
      <div className="flex items-center justify-between w-full mb-6 px-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Today</h2>
          <p className="text-sm text-gray-400 font-medium tracking-wide">Staying on track</p>
        </div>
        <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center text-primary">
          <Activity size={20} className="drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
        </div>
      </div>

      <div className="relative flex items-center justify-center w-[260px] h-[260px]">
        {/* Loading Pulse */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full absolute bg-primary/20 animate-ping"></div>
            <div className="w-24 h-24 rounded-full absolute bg-secondary/20 animate-ping" style={{ animationDelay: "200ms" }}></div>
            <div className="z-10 bg-black/50 px-4 py-2 rounded-full backdrop-blur-md text-sm font-semibold border border-white/10 animate-pulse flex items-center gap-2">
                <Activity size={16} className="text-primary"/> Parsing...
            </div>
          </div>
        )}

        <svg width="260" height="260" viewBox="0 0 260 260" className="rotate-[-90deg] drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          {/* Outer Ring Background */}
          <circle
            cx={center}
            cy={center}
            r={radiusOuter}
            className="stroke-primary/20 fill-none"
            strokeWidth={strokeWidth}
          />
          {/* Outer Ring Progress */}
          <circle
            cx={center}
            cy={center}
            r={radiusOuter}
            className="stroke-primary fill-none transition-all duration-1000 ease-in-out origin-center drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
            strokeWidth={strokeWidth}
            strokeDasharray={circumferenceOuter}
            strokeDashoffset={strokeDashoffsetOuter}
            strokeLinecap="round"
          />

          {/* Inner Ring Background */}
          <circle
            cx={center}
            cy={center}
            r={radiusInner}
            className="stroke-secondary/20 fill-none"
            strokeWidth={strokeWidth}
          />
          {/* Inner Ring Progress */}
          <circle
            cx={center}
            cy={center}
            r={radiusInner}
            className="stroke-secondary fill-none transition-all duration-1000 ease-in-out origin-center delay-150 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]"
            strokeWidth={strokeWidth}
            strokeDasharray={circumferenceInner}
            strokeDashoffset={strokeDashoffsetInner}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Text when not loading */}
        {!isLoading && (
           <div className="absolute flex flex-col items-center justify-center pointer-events-none">
             <span className="text-3xl font-extrabold shadow-black drop-shadow-md">
               {Math.round(calPercent)}%
             </span>
             <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
               Energy
             </span>
           </div>
        )}
      </div>

      {/* Legends */}
      <div className="grid grid-cols-2 gap-4 w-full mt-6">
        <div className="flex flex-col bg-white/5 p-4 rounded-xl border border-white/10 relative overflow-hidden group hover:bg-white/10 transition-colors backdrop-blur-sm">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-all"></div>
          <div className="flex items-center gap-2 mb-2 z-10">
            <Flame size={16} className="text-primary" />
            <span className="text-sm font-semibold text-gray-300">Calories</span>
          </div>
          <div className="flex items-baseline gap-1 z-10">
            <span className="text-2xl font-bold">{currentCalories}</span>
            <span className="text-xs text-gray-500 font-medium">/ {targetCalories}</span>
          </div>
        </div>

        <div className="flex flex-col bg-white/5 p-4 rounded-xl border border-white/10 relative overflow-hidden group hover:bg-white/10 transition-colors backdrop-blur-sm">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-secondary/10 rounded-full blur-xl group-hover:bg-secondary/20 transition-all"></div>
          <div className="flex items-center gap-2 mb-2 z-10">
            <Utensils size={16} className="text-secondary" />
            <span className="text-sm font-semibold text-gray-300">Protein</span>
          </div>
          <div className="flex items-baseline gap-1 z-10">
            <span className="text-2xl font-bold">{currentProtein}g</span>
            <span className="text-xs text-gray-500 font-medium">/ {targetProtein}g</span>
          </div>
        </div>
      </div>
    </div>
  );
}
