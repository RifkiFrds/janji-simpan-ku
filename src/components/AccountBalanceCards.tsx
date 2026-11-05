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

export type AccountBalanceFilter = 'month' | 'all';

interface AccountBalanceCardsProps {
  accounts: AccountBalance[];
  filter: AccountBalanceFilter;
  onFilterChange: (filter: AccountBalanceFilter) => void;
}

export default function AccountBalanceCards({ accounts, filter, onFilterChange }: AccountBalanceCardsProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground">Saldo per Rekening</h2>
        <div className="flex gap-0.5 bg-secondary rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => onFilterChange('month')}
            className={cn(
              'text-[10px] font-semibold px-2.5 py-1 rounded-md transition-colors',
              filter === 'month' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            )}
          >
            Bulan Ini
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            className={cn(
              'text-[10px] font-semibold px-2.5 py-1 rounded-md transition-colors',
              filter === 'all' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            )}
          >
            Semua
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {accounts.map((acc) => {
          // Rekening non-master terakhir yang "sendirian" (jumlahnya ganjil)
          // dilebarkan full width biar nggak nyisa 1 slot kosong yang janggal.
          const nonMaster = accounts.filter((a) => !a.is_master);
          const isLoneLast =
            !acc.is_master &&
            nonMaster.length % 2 !== 0 &&
            nonMaster[nonMaster.length - 1]?.id === acc.id;

          return (
            <div
              key={acc.id}
              className={cn(
                'rounded-xl p-3 border shadow-sm',
                acc.is_master
                  ? 'col-span-2 bg-primary/5 border-primary/20'
                  : isLoneLast
                  ? 'col-span-2 bg-card border-border'
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
          );
        })}
      </div>
    </div>
  );
}
