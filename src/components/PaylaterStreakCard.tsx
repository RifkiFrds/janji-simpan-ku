import { cn } from '@/lib/utils';

interface PaylaterStreakCardProps {
  streakDays: number;
}

export default function PaylaterStreakCard({ streakDays }: PaylaterStreakCardProps) {
  const isFresh = streakDays === 0;

  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm border border-border flex items-center gap-3">
      <span className="text-2xl shrink-0">🔥</span>
      <div>
        <p className={cn('text-lg font-extrabold', isFresh ? 'text-expense' : 'text-foreground')}>
          {streakDays} Hari Tanpa Paylater/Hutang
        </p>
        {isFresh && (
          <p className="text-xs text-expense">Streak baru dimulai hari ini — bangun lagi dari 0!</p>
        )}
      </div>
    </div>
  );
}
