import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import TransactionItem from '@/components/TransactionItem';
import QuickAddTransactionModal from '@/components/QuickAddTransactionModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function Transaksi() {
  const { user } = useAuth();
  const [semesters, setSemesters] = useState<any[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    if (!user) return;

    const { data: sems } = await supabase
      .from('semesters')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false });

    setSemesters(sems || []);
    if (sems?.length && !selectedSemester) {
      setSelectedSemester(sems[0].id);
    }

    const { data: cats } = await supabase.from('categories').select('*');
    setCategories(cats || []);
  };

  const fetchTransactions = async () => {
    if (!selectedSemester) return;

    let query = supabase
      .from('transactions')
      .select('*, categories(name, icon)')
      .eq('semester_id', selectedSemester)
      .order('date', { ascending: false });

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data } = await query;
    setTransactions(data || []);
  };

  useEffect(() => { fetchData(); }, [user]);
  useEffect(() => { fetchTransactions(); }, [selectedSemester, search]);

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-xl font-bold text-foreground">Transaksi</h1>

      <div className="flex gap-2">
        <Select value={selectedSemester} onValueChange={setSelectedSemester}>
          <SelectTrigger className="rounded-xl flex-1">
            <SelectValue placeholder="Pilih Semester" />
          </SelectTrigger>
          <SelectContent>
            {semesters.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari transaksi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-xl"
        />
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Belum ada transaksi di semester ini
        </div>
      ) : (
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border divide-y divide-border">
          {transactions.map((t) => (
            <TransactionItem
              key={t.id}
              title={t.title}
              amount={t.amount}
              type={t.type}
              category={t.categories?.name}
              categoryIcon={t.categories?.icon}
              date={t.date}
            />
          ))}
        </div>
      )}

      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-20 right-5 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center z-40 hover:scale-105 active:scale-95 transition-transform"
      >
        <Plus className="h-6 w-6" />
      </button>

      <QuickAddTransactionModal
        open={showAdd}
        onOpenChange={setShowAdd}
        categories={categories}
        semesterId={selectedSemester || null}
        onSuccess={fetchTransactions}
      />
    </div>
  );
}
