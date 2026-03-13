import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import SemesterCard from '@/components/SemesterCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, TrendingUp } from 'lucide-react';
import { formatRupiah } from '@/lib/format';
import { toast } from 'sonner';

export default function Semester() {
  const { user } = useAuth();
  const [semesters, setSemesters] = useState<any[]>([]);
  const [semesterSavings, setSemesterSavings] = useState<Record<string, number>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '', start_date: '', end_date: '', income_total: '', saving_target: ''
  });
  const [loading, setLoading] = useState(false);

  const fetchSemesters = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('semesters')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false });
    setSemesters(data || []);

    // Calculate savings for each semester
    if (data?.length) {
      const savingsMap: Record<string, number> = {};
      for (const sem of data) {
        const { data: txns } = await supabase
          .from('transactions')
          .select('amount, type')
          .eq('semester_id', sem.id);

        const income = (txns || []).filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
        const expense = (txns || []).filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
        savingsMap[sem.id] = income - expense;
      }
      setSemesterSavings(savingsMap);
    }
  };

  const handleCreate = async () => {
    if (!user || !form.name || !form.start_date || !form.end_date) {
      toast.error('Lengkapi semua field');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('semesters').insert({
      user_id: user.id,
      name: form.name,
      start_date: form.start_date,
      end_date: form.end_date,
      income_total: parseFloat(form.income_total) || 0,
      saving_target: parseFloat(form.saving_target) || 0,
    });

    setLoading(false);
    if (error) {
      toast.error('Gagal membuat semester');
    } else {
      toast.success('Semester berhasil dibuat');
      setShowCreate(false);
      setForm({ name: '', start_date: '', end_date: '', income_total: '', saving_target: '' });
      fetchSemesters();
    }
  };

  useEffect(() => { fetchSemesters(); }, [user]);

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Semester</h1>
        <Button onClick={() => setShowCreate(true)} size="sm" className="rounded-xl gap-1">
          <Plus className="h-4 w-4" /> Buat Baru
        </Button>
      </div>

      {semesters.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Belum ada semester. Buat semester pertamamu!
        </div>
      ) : (
        <div className="space-y-3">
          {semesters.map((s) => (
            <SemesterCard
              key={s.id}
              name={s.name}
              startDate={s.start_date}
              endDate={s.end_date}
              incomeTotal={s.income_total}
              savingTarget={s.saving_target}
              currentSaving={semesterSavings[s.id] || 0}
              isActive={today >= s.start_date && today <= s.end_date}
            />
          ))}
        </div>
      )}

      {/* Financial Timeline */}
      {semesters.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Riwayat Tabungan
          </h2>
          <div className="relative pl-6 space-y-4">
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
            {semesters.map((s) => (
              <div key={s.id} className="relative">
                <div className="absolute -left-4 top-1 h-3 w-3 rounded-full bg-primary border-2 border-card" />
                <div className="bg-card rounded-xl p-3 border border-border shadow-sm">
                  <p className="text-sm font-semibold text-foreground">{s.name}</p>
                  <p className="text-lg font-bold balance-number text-primary">
                    {formatRupiah(semesterSavings[s.id] || 0)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Buat Semester Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">Nama Semester</Label>
              <Input
                placeholder="Contoh: Semester 1"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-xl mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground">Tanggal Mulai</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="rounded-xl mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-muted-foreground">Tanggal Selesai</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className="rounded-xl mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">Total Pemasukan (Rp)</Label>
              <Input
                type="number"
                placeholder="0"
                value={form.income_total}
                onChange={(e) => setForm({ ...form, income_total: e.target.value })}
                className="rounded-xl mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">Target Tabungan (Rp)</Label>
              <Input
                type="number"
                placeholder="0"
                value={form.saving_target}
                onChange={(e) => setForm({ ...form, saving_target: e.target.value })}
                className="rounded-xl mt-1"
              />
            </div>
            <Button onClick={handleCreate} disabled={loading} className="w-full rounded-xl h-12 font-semibold">
              {loading ? 'Menyimpan...' : 'Buat Semester'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
