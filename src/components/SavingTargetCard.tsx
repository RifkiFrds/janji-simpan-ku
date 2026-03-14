import { formatRupiah } from '@/lib/format';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SavingTargetCardProps {
  target: number;
  actual: number;
  idealSaving: number;
  idealRatio: number;
}

export default function SavingTargetCard({ target, actual, idealSaving, idealRatio }: SavingTargetCardProps) {
  const percentage = target > 0 ? Math.min((actual / target) * 100, 100) : 0;
  const status = percentage >= 100 ? 'success' : percentage >= 50 ? 'warning' : 'danger';
  const statusText = percentage >= 100 ? 'Target Tercapai 🎉' : percentage >= 50 ? 'Dalam Progres' : 'Belum Tercapai';

  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Target className="h-4 w-4 text-primary" />
        <span className="text-sm font-bold text-foreground">Target Tabungan</span>
      </div>

      <div className="flex items-end justify-between mb-2">
        <p className="text-2xl font-bold balance-number text-foreground">{formatRupiah(target)}</p>
        <span className={cn(
          'text-xs font-semibold px-2 py-0.5 rounded-full',
          status === 'success' && 'bg-success/10 text-success',
          status === 'warning' && 'bg-warning/10 text-warning',
          status === 'danger' && 'bg-expense/10 text-expense',
        )}>
          {statusText}
        </span>
      </div>

      <Progress
        value={percentage}
        className={cn(
          'h-3 rounded-full mb-3',
          status === 'success' && '[&>div]:bg-success',
          status === 'warning' && '[&>div]:bg-warning',
          status === 'danger' && '[&>div]:bg-expense',
        )}
      />

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-secondary/50 rounded-lg p-2">
          <div className="flex items-center gap-1 mb-0.5">
            <TrendingUp className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">Tabungan Ideal</span>
          </div>
          <p className="font-bold balance-number text-foreground">{formatRupiah(idealSaving)}</p>
          <p className="text-muted-foreground text-[10px]">Rasio {idealRatio}%</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-2">
          <div className="flex items-center gap-1 mb-0.5">
            <Target className="h-3 w-3 text-accent" />
            <span className="text-muted-foreground">Tabungan Aktual</span>
          </div>
          <p className="font-bold balance-number text-foreground">{formatRupiah(actual)}</p>
          <p className="text-muted-foreground text-[10px]">{percentage.toFixed(0)}% dari target</p>
        </div>
      </div>
    </div>
  );
}
