import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Account, AllocationRule } from '@/stores/useAccountStore';

interface AllocationSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  rules: AllocationRule[];
  onSave: (accountId: string, percentage: number) => Promise<void>;
}

export default function AllocationSettings({ open, onOpenChange, accounts, rules, onSave }: AllocationSettingsProps) {
  const nonMaster = accounts.filter(a => !a.is_master);
  const [localRules, setLocalRules] = useState<Record<string, number>>({});

  useEffect(() => {
    const map: Record<string, number> = {};
    nonMaster.forEach(acc => {
      const rule = rules.find(r => r.account_id === acc.id);
      map[acc.id] = rule?.percentage ?? 0;
    });
    setLocalRules(map);
  }, [accounts, rules]);

  const total = Object.values(localRules).reduce((sum, v) => sum + v, 0);
  const isValid = total === 100;

  const handleSave = async () => {
    if (!isValid) {
      toast.error('Total alokasi harus 100%');
      return;
    }
    for (const [accountId, percentage] of Object.entries(localRules)) {
      await onSave(accountId, percentage);
    }
    toast.success('Alokasi berhasil disimpan');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Atur Pembagian Uang</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {nonMaster.map((acc) => (
            <div key={acc.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{acc.icon}</span>
                  <span className="text-sm font-medium text-foreground">{acc.name}</span>
                </div>
                <span className="text-sm font-bold text-primary balance-number">
                  {localRules[acc.id] ?? 0}%
                </span>
              </div>
              <Slider
                value={[localRules[acc.id] ?? 0]}
                onValueChange={([val]) => setLocalRules(prev => ({ ...prev, [acc.id]: val }))}
                max={100}
                step={5}
                className="[&>span:first-child]:h-2 [&>span:first-child>span]:bg-primary"
              />
            </div>
          ))}

          <div className={cn(
            'flex items-center justify-between p-3 rounded-xl text-sm font-bold',
            isValid ? 'bg-success/10 text-success' : 'bg-expense/10 text-expense'
          )}>
            <span>Total</span>
            <span>{total}%</span>
          </div>

          {!isValid && (
            <p className="text-xs text-expense text-center">
              Total alokasi harus tepat 100%. Saat ini: {total}%
            </p>
          )}

          <Button onClick={handleSave} disabled={!isValid} className="w-full rounded-xl h-12 font-semibold">
            Simpan Alokasi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
