import { formatRupiah } from '@/lib/format';
import { getBurnRate, type BudgetMode } from '@/lib/budgetMode';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CashflowModeBannerProps {
  mode: BudgetMode;
  monthlyIncome: number;
  monthlyExpense: number;
  threshold: number;
}

export default function CashflowModeBanner({ mode, monthlyIncome, monthlyExpense, threshold }: CashflowModeBannerProps) {
  const { ratio, level } = getBurnRate(monthlyExpense, threshold);

  if (mode === 'survival') {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-destructive to-destructive/80 p-5 text-destructive-foreground shadow-lg relative overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-6 w-6 shrink-0 animate-pulse" />
          <span className="text-base font-extrabold">⚠️ Mode Survival Aktif</span>
        </div>
       <p className="text-[12px] text-left opacity-90 leading-relaxed">
          Pemasukan bulan ini {formatRupiah(monthlyIncome)} — di bawah Rp 2.000.000. Pengeluaran WAJIB di bawah{' '}
          {formatRupiah(threshold)} dan hanya untuk kebutuhan pokok.
        </p>
        <p className="text-lg font-extrabold balance-number mt-3">
          {formatRupiah(Math.max(threshold - monthlyExpense, 0))}{' '}
          <span className="text-xs font-medium opacity-80">sisa jatah bulan ini</span>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary to-accent/70 p-5 text-primary-foreground shadow-md">
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp className="h-5 w-5 opacity-80" />
        <span className="text-sm font-bold">Mode Surplus 🟢</span>
      </div>
      <p className="text-sm opacity-90 mb-3">Pemasukan bulan ini: {formatRupiah(monthlyIncome)}</p>

      <Progress
        value={ratio * 100}
        className={cn(
          'h-3 rounded-full bg-primary-foreground/20',
          level === 'danger' && '[&>div]:bg-expense',
          level === 'warning' && '[&>div]:bg-warning',
          level === 'safe' && '[&>div]:bg-income',
        )}
      />
      <p className="text-xs opacity-80 mt-2">
        Pengeluaran OPEX: {formatRupiah(monthlyExpense)} / {formatRupiah(threshold)}
      </p>
    </div>
  );
}
