import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { formatRupiah } from '@/lib/format';

interface VaultLockModalProps {
  open: boolean;
  onConfirm: () => void;
  incomeAmount: number;
  threshold: number;
}

export default function VaultLockModal({ open, onConfirm, incomeAmount, threshold }: VaultLockModalProps) {
  const [checked, setChecked] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    setChecked(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-sm rounded-2xl [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-7 w-7 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-lg font-bold">Surplus Terdeteksi!</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-center text-muted-foreground leading-relaxed">
            {formatRupiah(Math.max(incomeAmount - threshold, 0))} di atas batas aman bulanan kamu. Segera transfer
            uang ini ke Rekening Master/Emas sekarang juga.
          </p>

          <label className="flex items-start gap-2 bg-secondary/50 rounded-xl p-3 cursor-pointer">
            <Checkbox checked={checked} onCheckedChange={(v) => setChecked(v === true)} className="mt-0.5" />
            <span className="text-sm font-medium text-foreground">
              Saya berjanji sudah memindahkan uang ini.
            </span>
          </label>

          <Button
            onClick={handleConfirm}
            disabled={!checked}
            className="w-full rounded-xl h-12 font-semibold"
          >
            Lanjutkan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
