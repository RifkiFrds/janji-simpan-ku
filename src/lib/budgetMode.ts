export type BudgetMode = 'surplus' | 'survival';
export type BurnRateLevel = 'safe' | 'warning' | 'danger';

// Format tanggal ke 'YYYY-MM-DD' berdasarkan kalender LOKAL (bukan UTC).
// Penting: jangan pakai date.toISOString() di sini — itu konversi ke UTC dulu,
// sehingga di timezone WIB (UTC+7) tanggal bisa "mundur" 1 hari untuk waktu
// dini hari (00:00–07:00 WIB), yang bikin query rentang bulan jadi salah geser.
export function toLocalDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getMonthBounds(date: Date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    startISO: toLocalDateISO(start),
    endISO: toLocalDateISO(end),
    daysInMonth: end.getDate(),
    dayOfMonth: date.getDate(),
  };
}

export function getBudgetMode(monthlyIncome: number, threshold: number): BudgetMode {
  return monthlyIncome > threshold ? 'surplus' : 'survival';
}

export function getBurnRate(monthlyExpense: number, threshold: number): { ratio: number; level: BurnRateLevel } {
  const ratio = threshold > 0 ? monthlyExpense / threshold : 0;
  const level: BurnRateLevel = ratio >= 0.9 ? 'danger' : ratio >= 0.75 ? 'warning' : 'safe';
  return { ratio: Math.min(ratio, 1), level };
}

export function getDailySafeToSpend(monthlyExpense: number, threshold: number, date: Date = new Date()): number {
  const { daysInMonth, dayOfMonth } = getMonthBounds(date);
  const daysRemaining = Math.max(daysInMonth - dayOfMonth + 1, 1); // termasuk hari ini
  const remainingBudget = threshold - monthlyExpense;
  return Math.max(Math.floor(remainingBudget / daysRemaining), 0);
}

export function getPaylaterStreakDays(lastDebtDateISO: string | null, fallbackDateISO: string): number {
  const base = lastDebtDateISO || fallbackDateISO;
  const diffMs = Date.now() - new Date(base).getTime();
  return Math.max(Math.floor(diffMs / (1000 * 60 * 60 * 24)), 0);
}

export function getFounderRunwayMonths(liquidBalance: number, monthlyOpex: number): number {
  if (monthlyOpex <= 0) return 0;
  return liquidBalance / monthlyOpex;
}
