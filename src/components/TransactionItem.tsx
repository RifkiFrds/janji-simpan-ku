import { formatRupiah, formatDateShort } from '@/lib/format';
import { cn } from '@/lib/utils';

interface TransactionItemProps {
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  categoryIcon?: string;
  date: string;
}

export default function TransactionItem({ title, amount, type, category, categoryIcon, date }: TransactionItemProps) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center text-lg shrink-0">
        {categoryIcon || (type === 'income' ? '💰' : '💸')}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{title}</p>
        <p className="text-xs text-muted-foreground">{category || 'Lainnya'} · {formatDateShort(date)}</p>
      </div>
      <p className={cn(
        'text-sm font-bold balance-number shrink-0',
        type === 'income' ? 'text-income' : 'text-expense'
      )}>
        {type === 'income' ? '+' : '-'}{formatRupiah(Math.abs(amount))}
      </p>
    </div>
  );
}
