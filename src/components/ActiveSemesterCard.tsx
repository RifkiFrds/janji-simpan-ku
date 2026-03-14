import { formatRupiah } from '@/lib/format';
import { GraduationCap, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';

interface ActiveSemesterCardProps {
  name: string;
  income: number;
  expense: number;
  saving: number;
}

export default function ActiveSemesterCard({ name, income, expense, saving }: ActiveSemesterCardProps) {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
      <div className="flex items-center gap-2 mb-3">
        <GraduationCap className="h-4 w-4 text-primary" />
        <span className="text-sm font-bold text-foreground">{name}</span>
        <span className="text-[10px] font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-full ml-auto">
          Aktif
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="flex items-center gap-1 mb-0.5">
            <TrendingUp className="h-3 w-3 text-income" />
            <span className="text-[10px] text-muted-foreground">Pemasukan</span>
          </div>
          <p className="text-sm font-bold balance-number text-foreground">{formatRupiah(income)}</p>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-0.5">
            <TrendingDown className="h-3 w-3 text-expense" />
            <span className="text-[10px] text-muted-foreground">Pengeluaran</span>
          </div>
          <p className="text-sm font-bold balance-number text-foreground">{formatRupiah(expense)}</p>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-0.5">
            <PiggyBank className="h-3 w-3 text-primary" />
            <span className="text-[10px] text-muted-foreground">Tabungan</span>
          </div>
          <p className="text-sm font-bold balance-number text-primary">{formatRupiah(saving)}</p>
        </div>
      </div>
    </div>
  );
}
