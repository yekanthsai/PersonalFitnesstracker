"use client";

import React from "react";
import { LayoutDashboard, BarChart2, User2 } from "lucide-react";

export type TabId = "dashboard" | "analytics" | "profile";

interface NavItem {
  id: TabId;
  label: string;
  Icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "analytics", label: "Analytics", Icon: BarChart2 },
  { id: "profile", label: "Profile", Icon: User2 },
];

interface NavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <>
      {/* ── Desktop / Tablet Sidebar ─────────────────────────────────────── */}
      <aside className="
        hidden md:flex flex-col fixed left-0 top-0 h-full z-40
        w-16 hover:w-52 overflow-hidden
        bg-zinc-950/95 backdrop-blur-xl
        border-r border-white/5
        transition-all duration-300 ease-in-out
        group/sidebar
        shadow-[4px_0_24px_rgba(0,0,0,0.4)]
      ">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-6 border-b border-white/5 min-h-[72px]">
          <span className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <span className="text-emerald-400 font-black text-sm">F</span>
          </span>
          <span className="text-white font-bold text-base whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-100">
            FocusFit <span className="text-emerald-400 font-black italic text-sm">AI</span>
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-1 p-2 mt-2">
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={`
                  relative flex items-center gap-3 px-3 py-3 rounded-xl
                  transition-all duration-200 group/item
                  ${isActive
                    ? "bg-emerald-500/15 text-emerald-400 shadow-[inset_0_0_12px_rgba(16,185,129,0.1)]"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
                  }
                `}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-emerald-400 rounded-r-full" />
                )}
                <Icon
                  size={20}
                  className={`shrink-0 transition-transform duration-200 ${isActive ? "drop-shadow-[0_0_6px_rgba(16,185,129,0.8)]" : "group-hover/item:scale-110"}`}
                />
                <span className="whitespace-nowrap text-sm font-semibold opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75">
                  {label}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── Mobile Bottom Navigation Bar ─────────────────────────────────── */}
      <nav className="
        md:hidden fixed bottom-0 left-0 right-0 z-40
        bg-zinc-950/95 backdrop-blur-xl
        border-t border-white/5
        flex items-center justify-around
        px-2 py-2
        safe-area-inset-bottom
        shadow-[0_-4px_24px_rgba(0,0,0,0.4)]
      ">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`
                flex flex-col items-center justify-center gap-1
                px-6 py-2 rounded-2xl
                transition-all duration-200
                ${isActive
                  ? "text-emerald-400"
                  : "text-zinc-600 hover:text-zinc-400"
                }
              `}
            >
              {/* Active glow pill */}
              {isActive && (
                <span className="absolute w-10 h-10 rounded-full bg-emerald-500/10 animate-pulse pointer-events-none" />
              )}
              <Icon
                size={22}
                className={`transition-all duration-200 ${isActive ? "drop-shadow-[0_0_8px_rgba(16,185,129,0.8)] scale-110" : ""}`}
              />
              <span className={`text-[10px] font-bold tracking-wider transition-colors duration-200 ${isActive ? "text-emerald-400" : "text-zinc-600"}`}>
                {label.toUpperCase()}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
