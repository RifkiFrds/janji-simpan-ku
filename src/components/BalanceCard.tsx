import { formatRupiah } from '@/lib/format';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface BalanceCardProps {
  totalSavings: number;
  income: number;
  expense: number;
  currentBalance: number;
}

export default function BalanceCard({ totalSavings, income, expense, currentBalance }: BalanceCardProps) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-lg">
      <div className="flex items-center gap-2 mb-1">
        <Wallet className="h-4 w-4 opacity-80" />
        <span className="text-sm font-medium opacity-80">Total Tabungan</span>
      </div>
      <p className="text-3xl font-bold balance-number mb-6">
        {formatRupiah(totalSavings)}
      </p>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-primary-foreground/15 rounded-xl p-3">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="h-3 w-3" />
            <span className="text-[10px] font-medium opacity-80">Pemasukan</span>
          </div>
          <p className="text-sm font-bold balance-number">{formatRupiah(income)}</p>
        </div>
        <div className="bg-primary-foreground/15 rounded-xl p-3">
          <div className="flex items-center gap-1 mb-1">
            <TrendingDown className="h-3 w-3" />
            <span className="text-[10px] font-medium opacity-80">Pengeluaran</span>
          </div>
          <p className="text-sm font-bold balance-number">{formatRupiah(expense)}</p>
        </div>
        <div className="bg-primary-foreground/15 rounded-xl p-3">
          <div className="flex items-center gap-1 mb-1">
            <Wallet className="h-3 w-3" />
            <span className="text-[10px] font-medium opacity-80">Saldo</span>
          </div>
          <p className="text-sm font-bold balance-number">{formatRupiah(currentBalance)}</p>
        </div>
      </div>
    </div>
  );
}
