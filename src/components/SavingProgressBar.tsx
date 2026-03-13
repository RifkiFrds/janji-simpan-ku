import { formatRupiah } from '@/lib/format';
import { Progress } from '@/components/ui/progress';
import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SavingProgressBarProps {
  currentSaving: number;
  target: number;
}

export default function SavingProgressBar({ currentSaving, target }: SavingProgressBarProps) {
  const percentage = target > 0 ? Math.min((currentSaving / target) * 100, 100) : 0;
  const status = percentage >= 100 ? 'success' : percentage >= 50 ? 'warning' : 'danger';

  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Target className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Target Tabungan Semester</span>
      </div>
      <div className="flex items-end justify-between mb-2">
        <span className="text-2xl font-bold balance-number text-foreground">{formatRupiah(target)}</span>
        <span className={cn(
          'text-xs font-semibold px-2 py-0.5 rounded-full',
          status === 'success' && 'bg-success/10 text-success',
          status === 'warning' && 'bg-warning/10 text-warning',
          status === 'danger' && 'bg-expense/10 text-expense',
        )}>
          {percentage.toFixed(0)}%
        </span>
      </div>
      <Progress
        value={percentage}
        className={cn(
          'h-3 rounded-full',
          status === 'success' && '[&>div]:bg-success',
          status === 'warning' && '[&>div]:bg-warning',
          status === 'danger' && '[&>div]:bg-expense',
        )}
      />
      <p className="text-xs text-muted-foreground mt-2">
        Terkumpul: {formatRupiah(currentSaving)} dari {formatRupiah(target)}
      </p>
    </div>
  );
}
