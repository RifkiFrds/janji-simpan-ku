import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface QuickAddTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  semesterId: string | null;
  onSuccess: () => void;
}

export default function QuickAddTransactionModal({
  open, onOpenChange, categories, semesterId, onSuccess
}: QuickAddTransactionModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title || !amount || !semesterId || !user) {
      toast.error('Lengkapi semua field');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      semester_id: semesterId,
      category_id: categoryId || null,
      title,
      amount: parseFloat(amount),
      type,
      date: new Date().toISOString().split('T')[0],
    });

    setLoading(false);
    if (error) {
      toast.error('Gagal menambahkan transaksi');
    } else {
      toast.success('Transaksi berhasil ditambahkan');
      setTitle('');
      setAmount('');
      setCategoryId('');
      onOpenChange(false);
      onSuccess();
    }
  };

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
              placeholder="Contoh: Biaya Makan"
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
            <Label className="text-xs font-semibold text-muted-foreground">Kategori</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="rounded-xl mt-1">
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !semesterId}
            className="w-full rounded-xl h-12 text-base font-semibold"
          >
            {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
          </Button>

          {!semesterId && (
            <p className="text-xs text-expense text-center">Buat semester terlebih dahulu</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
