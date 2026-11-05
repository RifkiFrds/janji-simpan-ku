import { formatRupiah } from '@/lib/format';
import { getFounderRunwayMonths } from '@/lib/budgetMode';

interface FounderRunwayWidgetProps {
  liquidBalance: number;
  monthlyOpex: number;
}

export default function FounderRunwayWidget({ liquidBalance, monthlyOpex }: FounderRunwayWidgetProps) {
  const runwayMonths = getFounderRunwayMonths(liquidBalance, monthlyOpex);

  return (
    <div className="bg-secondary/50 rounded-xl p-3">
      <p className="text-[10px] text-muted-foreground">Runway Godinov</p>
      <p className="text-lg font-bold balance-number text-foreground">{runwayMonths.toFixed(1)} Bulan</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">
        aman tanpa pemasukan baru, berdasarkan saldo likuid & rata-rata OPEX {formatRupiah(monthlyOpex)}
      </p>
    </div>
  );
}
