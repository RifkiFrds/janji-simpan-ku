import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import BalanceCard from '@/components/BalanceCard';
import SavingProgressBar from '@/components/SavingProgressBar';
import TransactionItem from '@/components/TransactionItem';
import QuickAddTransactionModal from '@/components/QuickAddTransactionModal';
import { Plus } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [activeSemester, setActiveSemester] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [stats, setStats] = useState({ income: 0, expense: 0, saving: 0 });

  const fetchData = async () => {
    if (!user) return;

    // Get active semester (most recent)
    const { data: semesters } = await supabase
      .from('semesters')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false })
      .limit(1);

    const sem = semesters?.[0] || null;
    setActiveSemester(sem);

    // Get categories
    const { data: cats } = await supabase.from('categories').select('*');
    setCategories(cats || []);

    if (sem) {
      // Get transactions for active semester
      const { data: txns } = await supabase
        .from('transactions')
        .select('*, categories(name, icon)')
        .eq('semester_id', sem.id)
        .order('date', { ascending: false })
        .limit(5);

      setTransactions(txns || []);

      // Calculate stats
      const { data: allTxns } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('semester_id', sem.id);

      const income = (allTxns || [])
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const expense = (allTxns || [])
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      setStats({ income, expense, saving: income - expense });
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Selamat datang 👋</p>
          <h1 className="text-xl font-bold text-foreground">
            {user?.user_metadata?.full_name || 'Pengguna'}
          </h1>
        </div>
        {activeSemester && (
          <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold">
            {activeSemester.name}
          </span>
        )}
      </div>

      <BalanceCard
        totalSavings={stats.saving}
        income={stats.income}
        expense={stats.expense}
        currentBalance={stats.income - stats.expense}
      />

      {activeSemester && (
        <SavingProgressBar
          currentSaving={stats.saving}
          target={Number(activeSemester.saving_target)}
        />
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-foreground">Transaksi Terbaru</h2>
        </div>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Belum ada transaksi
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
      </div>

      {/* FAB */}
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
        semesterId={activeSemester?.id || null}
        onSuccess={fetchData}
      />
    </div>
  );
}
