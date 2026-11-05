import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineStore } from '@/stores/useOfflineStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatRupiah } from '@/lib/format';
import type { Account } from '@/stores/useAccountStore';
import { toLocalDateISO, type BudgetMode } from '@/lib/budgetMode';

interface Category {
  id: string;
  name: string;
  icon: string;
  is_essential?: boolean;
  is_debt?: boolean;
}

interface QuickAddTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  accounts: Account[];
  semesterId: string | null;
  mode: BudgetMode;
  monthlyExpense: number;
  threshold: number;
  onSuccess: (insertedTx?: { id: string; type: string; amount: number }) => void;
}

export default function QuickAddTransactionModal({
  open, onOpenChange, categories, accounts, semesterId, mode, monthlyExpense, threshold, onSuccess
}: QuickAddTransactionModalProps) {
  const { user } = useAuth();
  const { isOnline, addPending } = useOfflineStore();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title || !amount || !semesterId || !user) {
      toast.error('Lengkapi semua field');
      return;
    }

    if (type === 'expense' && mode === 'survival' && monthlyExpense + parseFloat(amount) > threshold) {
      toast.error(
        `Survival Mode: pengeluaran bulan ini sudah/akan melebihi ${formatRupiah(threshold)}. Transaksi dibatalkan.`
      );
      return;
    }

    const txData = {
      user_id: user.id,
      semester_id: semesterId,
      category_id: categoryId || null,
      account_id: accountId || null,
      title,
      amount: parseFloat(amount),
      type,
      date: toLocalDateISO(new Date()),
    };

    if (!isOnline) {
      addPending({ ...txData, id: crypto.randomUUID() });
      toast.success('Transaksi disimpan offline, akan disinkronkan saat online');
      resetForm();
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.from('transactions').insert(txData).select().single();
    setLoading(false);

    if (error) {
      toast.error('Gagal menambahkan transaksi');
    } else {
      toast.success('Transaksi berhasil ditambahkan');
      resetForm();
      onSuccess(data ? { id: data.id, type: data.type, amount: Number(data.amount) } : undefined);
    }
  };

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setCategoryId('');
    setAccountId('');
    onOpenChange(false);
  };

  // For income, only Master Income; for expense, non-master accounts
  const filteredAccounts = type === 'income'
    ? accounts.filter(a => a.is_master)
    : accounts.filter(a => !a.is_master);

  // Di Survival Mode, pengeluaran hanya boleh pakai kategori kebutuhan pokok
  const filteredCategories = type === 'expense' && mode === 'survival'
    ? categories.filter(c => c.is_essential)
    : categories;
  const noEssentialCategories = type === 'expense' && mode === 'survival' && filteredCategories.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Tambah Transaksi</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === 'expense' ? 'default' : 'outline'}
              className={cn('flex-1 rounded-xl', type === 'expense' && 'bg-expense hover:bg-expense/90')}
              onClick={() => setType('expense')}
            >
              Pengeluaran
            </Button>
            <Button
              type="button"
              variant={type === 'income' ? 'default' : 'outline'}
              className={cn('flex-1 rounded-xl', type === 'income' && 'bg-income hover:bg-income/90')}
              onClick={() => setType('income')}
            >
              Pemasukan
            </Button>
          </div>

          <div>
            <Label className="text-xs font-semibold text-muted-foreground">Judul</Label>
            <Input
              placeholder="Contoh: Dana KIP"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl mt-1"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-muted-foreground">Jumlah (Rp)</Label>
            <Input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-xl mt-1 text-lg font-bold"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-muted-foreground">Rekening</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="rounded-xl mt-1">
                <SelectValue placeholder="Pilih rekening" />
              </SelectTrigger>
              <SelectContent>
                {filteredAccounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.icon} {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold text-muted-foreground">Kategori</Label>
            <Select value={categoryId} onValueChange={setCategoryId} disabled={noEssentialCategories}>
              <SelectTrigger className="rounded-xl mt-1">
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {noEssentialCategories && (
              <p className="text-xs text-expense mt-1">
                Tidak ada kategori kebutuhan pokok. Atur dulu di Profil.
              </p>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !semesterId}
            className="w-full rounded-xl h-12 text-base font-semibold"
          >
            {loading ? 'Menyimpan...' : isOnline ? 'Simpan Transaksi' : '💾 Simpan Offline'}
          </Button>

          {!semesterId && (
            <p className="text-xs text-expense text-center">Buat semester terlebih dahulu</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
