import { formatRupiah, formatDate } from '@/lib/format';
import { Calendar, Target } from 'lucide-react';

interface SemesterCardProps {
  name: string;
  startDate: string;
  endDate: string;
  incomeTotal: number;
  savingTarget: number;
  currentSaving?: number;
  isActive?: boolean;
  onClick?: () => void;
}

export default function SemesterCard({
  name, startDate, endDate, incomeTotal, savingTarget, currentSaving = 0, isActive, onClick
}: SemesterCardProps) {
  const progress = savingTarget > 0 ? Math.min((currentSaving / savingTarget) * 100, 100) : 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl p-5 shadow-sm border transition-all duration-200 ${
        isActive ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/30'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-foreground">{name}</h3>
        {isActive && (
          <span className="text-[10px] font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
            Aktif
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
        <Calendar className="h-3 w-3" />
        <span>{formatDate(startDate)} - {formatDate(endDate)}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] text-muted-foreground font-medium">Total Pemasukan</p>
          <p className="text-sm font-bold balance-number text-foreground">{formatRupiah(incomeTotal)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
            <Target className="h-3 w-3" /> Target Tabungan
          </p>
          <p className="text-sm font-bold balance-number text-foreground">{formatRupiah(savingTarget)}</p>
        </div>
      </div>
      {savingTarget > 0 && (
        <div className="mt-3">
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </button>
  );
}
