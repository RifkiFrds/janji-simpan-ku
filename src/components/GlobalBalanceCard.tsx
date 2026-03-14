import { formatRupiah } from '@/lib/format';
import { Wallet } from 'lucide-react';

interface GlobalBalanceCardProps {
  totalBalance: number;
}

export default function GlobalBalanceCard({ totalBalance }: GlobalBalanceCardProps) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-accent/70 p-6 text-primary-foreground shadow-xl relative overflow-hidden">
      <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-primary-foreground/5" />
      <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-primary-foreground/5" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="h-5 w-5 opacity-80" />
          <span className="text-sm font-medium opacity-80">Total Saldo Saya</span>
        </div>
        <p className="text-4xl font-extrabold balance-number tracking-tight">
          {formatRupiah(totalBalance)}
        </p>
      </div>
    </div>
  );
}
