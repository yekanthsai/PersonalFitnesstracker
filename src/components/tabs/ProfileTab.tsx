"use client";

import React from "react";
import { RotateCcw, User2, Ruler, Dumbbell, Target, Activity, AlertTriangle, Bell, BellOff } from "lucide-react";
import type { UserProfile } from "@/lib/storage";
import { subscribeToPush, unsubscribeFromPush, getPushSubscription } from "@/lib/push";
import { useState, useEffect } from "react";

interface ProfileTabProps {
  profile: UserProfile;
  deviceId?: string;
  onReset: () => void;
}

export default function ProfileTab({ profile, deviceId, onReset }: ProfileTabProps) {
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(true);

  useEffect(() => {
    getPushSubscription().then(sub => {
      setIsPushEnabled(!!sub);
      setIsPushLoading(false);
    });
  }, []);

  const handleTogglePush = async () => {
    if (!deviceId) return;
    setIsPushLoading(true);
    if (isPushEnabled) {
      const success = await unsubscribeFromPush(deviceId);
      if (success) setIsPushEnabled(false);
    } else {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const success = await subscribeToPush(deviceId);
        if (success) setIsPushEnabled(true);
      }
    }
    setIsPushLoading(false);
  };

  const handleReset = () => {
    if (confirm("Clear all data and restart onboarding? This cannot be undone.")) {
      onReset();
    }
  };

  const metrics = [
    { Icon: Ruler,    label: "Height",          value: `${profile.heightCm} cm`        },
    { Icon: Dumbbell, label: "Weight",           value: `${profile.weightKg.toFixed(1)} kg` },
    { Icon: Activity, label: "Activity Level",   value: profile.activity               },
    { Icon: Target,   label: "Daily Calories",   value: `${profile.targetCalories} kcal` },
    { Icon: Target,   label: "Daily Protein",    value: `${profile.targetProtein} g`    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Header ── */}
      <div className="flex items-center gap-4 bg-zinc-900/60 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-2xl font-black shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <User2 size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">My Profile</h2>
          {profile.strategy && (
            <span className="text-sm font-semibold text-emerald-400 bg-emerald-400/10 px-3 py-0.5 rounded-full mt-1 inline-block border border-emerald-400/20">
              {profile.strategy}
            </span>
          )}
        </div>
      </div>

      {/* ── Metrics Grid ── */}
      <div className="grid grid-cols-1 gap-3">
        {metrics.map(({ Icon, label, value }) => (
          <div
            key={label}
            className="flex items-center justify-between bg-zinc-900/60 border border-white/5 rounded-2xl px-5 py-4 backdrop-blur-md hover:bg-zinc-800/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400">
                <Icon size={16} />
              </div>
              <span className="text-zinc-400 text-sm font-medium">{label}</span>
            </div>
            <span className="text-white font-bold text-base">{value}</span>
          </div>
        ))}
      </div>

      {/* ── Goal Description ── */}
      {profile.goal && (
        <div className="bg-zinc-900/60 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Your Goal</h3>
          <p className="text-zinc-300 text-sm leading-relaxed italic">"{profile.goal}"</p>
        </div>
      )}

      {/* ── Daily Reminders ── */}
      <div className="flex items-center justify-between bg-zinc-900/60 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
        <div>
          <h3 className="text-sm font-bold text-white mb-1">Daily Reminders</h3>
          <p className="text-xs text-zinc-500">Get a 10 PM push notification summary of your day.</p>
        </div>
        <button
          disabled={isPushLoading || !deviceId}
          onClick={handleTogglePush}
          className={`
            relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none
            ${isPushEnabled ? 'bg-emerald-500' : 'bg-zinc-700'}
            ${isPushLoading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <span className="sr-only">Toggle Daily Reminders</span>
          <span
            className={`
              inline-block h-6 w-6 transform rounded-full bg-white transition-transform
              ${isPushEnabled ? 'translate-x-7' : 'translate-x-1'}
            `}
          />
        </button>
      </div>

      {/* ── Danger Zone ── */}
      <div className="bg-red-500/5 border border-red-500/15 rounded-3xl p-6 backdrop-blur-md mt-2">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={16} className="text-red-400" />
          <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider">Danger Zone</h3>
        </div>
        <p className="text-zinc-500 text-xs mb-4 leading-relaxed">
          This will permanently delete all your profile data, meal history, and streak progress.
          You will be taken back to the onboarding wizard.
        </p>
        <button
          onClick={handleReset}
          className="
            flex items-center gap-2 text-sm font-bold text-red-400
            bg-red-500/10 hover:bg-red-500/20
            border border-red-500/20 hover:border-red-500/40
            px-5 py-3 rounded-xl transition-all duration-200
            hover:shadow-[0_0_16px_rgba(239,68,68,0.2)]
            active:scale-95
          "
        >
          <RotateCcw size={15} />
          Clear Data &amp; Restart
        </button>
      </div>

    </div>
  );
}
