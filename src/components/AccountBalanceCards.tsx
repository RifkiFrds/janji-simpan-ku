import { formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';

interface AccountBalance {
  id: string;
  name: string;
  icon: string;
  balance: number;
  is_master: boolean;
  percentage?: number;
}

interface AccountBalanceCardsProps {
  accounts: AccountBalance[];
}

export default function AccountBalanceCards({ accounts }: AccountBalanceCardsProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-bold text-foreground">Saldo per Rekening</h2>
      <div className="grid grid-cols-2 gap-2">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className={cn(
              'rounded-xl p-3 border shadow-sm',
              acc.is_master
                ? 'col-span-2 bg-primary/5 border-primary/20'
                : 'bg-card border-border'
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{acc.icon}</span>
              <span className="text-xs font-medium text-muted-foreground truncate">{acc.name}</span>
              {acc.percentage !== undefined && !acc.is_master && (
                <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded ml-auto shrink-0">
                  {acc.percentage}%
                </span>
              )}
            </div>
            <p className={cn(
              'text-sm font-bold balance-number',
              acc.is_master ? 'text-primary' : 'text-foreground'
            )}>
              {formatRupiah(acc.balance)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
