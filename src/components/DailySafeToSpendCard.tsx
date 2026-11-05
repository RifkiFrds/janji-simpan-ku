import { formatRupiah } from '@/lib/format';
import { getDailySafeToSpend } from '@/lib/budgetMode';

interface DailySafeToSpendCardProps {
  monthlyExpense: number;
  threshold: number;
}

export default function DailySafeToSpendCard({ monthlyExpense, threshold }: DailySafeToSpendCardProps) {
  const safeAmount = getDailySafeToSpend(monthlyExpense, threshold);
  const isOverbudget = safeAmount === 0;

  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
      <p className="text-xs font-medium text-muted-foreground mb-1">Batas Uang Keluar Hari Ini</p>
      <p className="text-3xl font-extrabold balance-number text-foreground tracking-tight">
        {formatRupiah(safeAmount)}
      </p>
      {isOverbudget && (
        <p className="text-xs font-semibold text-expense mt-1">
          Kamu sudah melebihi jatah harian. Tahan pengeluaran hari ini.
        </p>
      )}
    </div>
  );
}
