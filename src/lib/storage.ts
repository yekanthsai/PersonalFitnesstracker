import { supabase } from './supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MealLog {
  id: number;
  timestamp: string;      // ISO 8601
  name: string;
  cal: number;
  pro: number;
  thumbnailB64?: string;  // canvas-resized base64 preview
}

export interface DailyRecord {
  date: string;           // "YYYY-MM-DD"
  meals: MealLog[];
}

export interface UserProfile {
  heightCm: number;
  weightKg: number;
  activity: string;
  goal: string;
  targetCalories: number;
  targetProtein: number;
  strategy: string | null;
}

export interface AppData {
  profile: UserProfile;
  records: DailyRecord[]; // newest-first, capped at 30 days
  streak: number;
  lastLogDate: string | null;
  deviceId?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const STORAGE_KEY = "focusfit_pro_data";
const MAX_RECORDS = 30;

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getToday(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

export function loadData(): AppData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as AppData;
    if (!data.deviceId) {
      data.deviceId = crypto.randomUUID();
      saveData(data);
    }
    return data;
  } catch {
    return null;
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* quota error — ignore */
  }
}

/** Returns (or creates) the DailyRecord for today inside the given records array. */
export function getTodayRecord(records: DailyRecord[]): DailyRecord {
  const today = getToday();
  return records.find((r) => r.date === today) ?? { date: today, meals: [] };
}

/** Adds a meal to today's record and returns the updated records array. */
export function addMealToToday(records: DailyRecord[], meal: MealLog, deviceId?: string): DailyRecord[] {
  if (deviceId && supabase) {
    supabase.from('food_logs').insert({
      user_id: deviceId,
      name: meal.name,
      cal: meal.cal,
      pro: meal.pro,
      created_at: meal.timestamp || new Date().toISOString()
    }).then(({ error }) => {
      if (error) console.error("Supabase sync error:", error);
    });
  }

  const today = getToday();
  const existing = records.find((r) => r.date === today);
  if (existing) {
    return records.map((r) =>
      r.date === today ? { ...r, meals: [meal, ...r.meals] } : r
    );
  }
  // Cap to MAX_RECORDS, newest first
  return [{ date: today, meals: [meal] }, ...records].slice(0, MAX_RECORDS);
}

/**
 * Recalculates streak.
 * - If lastLogDate was yesterday → increment
 * - If lastLogDate is today → keep
 * - Otherwise → reset to 1
 */
export function updateStreak(streak: number, lastLogDate: string | null): { streak: number; lastLogDate: string } {
  const today = getToday();
  if (lastLogDate === today) return { streak, lastLogDate: today };

  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const newStreak = lastLogDate === yesterday ? streak + 1 : 1;
  return { streak: newStreak, lastLogDate: today };
}

/** Returns the last N daily records as a sorted (oldest first) array for charts. */
export function getLastNDays(records: DailyRecord[], n: number): DailyRecord[] {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  // Ensure all N days are present (fill gaps with empty records)
  const result: DailyRecord[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    const existing = sorted.find((r) => r.date === date);
    result.push(existing ?? { date, meals: [] });
  }
  return result;
}

/** Sums calories and protein for a single DailyRecord. */
export function sumRecord(record: DailyRecord): { cal: number; pro: number } {
  return record.meals.reduce(
    (acc, m) => ({ cal: acc.cal + m.cal, pro: acc.pro + m.pro }),
    { cal: 0, pro: 0 }
  );
}
