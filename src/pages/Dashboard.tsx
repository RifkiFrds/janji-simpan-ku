import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useAccountStore } from '@/stores/useAccountStore';
import GlobalBalanceCard from '@/components/GlobalBalanceCard';
import AccountBalanceCards from '@/components/AccountBalanceCards';
import ActiveSemesterCard from '@/components/ActiveSemesterCard';
import SavingTargetCard from '@/components/SavingTargetCard';
import TransactionItem from '@/components/TransactionItem';
import QuickAddTransactionModal from '@/components/QuickAddTransactionModal';
import { Plus } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { accounts, allocationRules, fetchAccounts, fetchAllocationRules, createDefaultAccounts } = useAccountStore();
  const [activeSemester, setActiveSemester] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [semesterStats, setSemesterStats] = useState({ income: 0, expense: 0, saving: 0 });
  const [savingRule, setSavingRule] = useState({ min_saving_per_semester: 0, ideal_saving_ratio: 40 });

  const fetchData = async () => {
    if (!user) return;

    // Fetch accounts, create defaults if none exist
    await fetchAccounts(user.id);
    await fetchAllocationRules(user.id);

    // Get categories
    const { data: cats } = await supabase.from('categories').select('*');
    setCategories(cats || []);

    // Get saving rule
    const { data: sr } = await supabase.from('saving_rules').select('*').eq('user_id', user.id).maybeSingle();
    if (sr) setSavingRule(sr);

    // Get active semester
    const { data: semesters } = await supabase
      .from('semesters')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false })
      .limit(1);
    const sem = semesters?.[0] || null;
    setActiveSemester(sem);

    // Get ALL transactions for global balance
    const { data: allTxns } = await supabase
      .from('transactions')
      .select('amount, type, account_id')
      .eq('user_id', user.id);
    setAllTransactions(allTxns || []);

    if (sem) {
      // Recent transactions
      const { data: txns } = await supabase
        .from('transactions')
        .select('*, categories(name, icon)')
        .eq('semester_id', sem.id)
        .order('date', { ascending: false })
        .limit(5);
      setTransactions(txns || []);

      // Semester stats
      const { data: semTxns } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('semester_id', sem.id);
      const income = (semTxns || []).filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
      const expense = (semTxns || []).filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
      setSemesterStats({ income, expense, saving: income - expense });
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  // Create default accounts if none exist
  useEffect(() => {
    if (user && accounts.length === 0 && !useAccountStore.getState().loading) {
      createDefaultAccounts(user.id).then(() => fetchData());
    }
  }, [user, accounts.length]);

  // Global balance = SUM(all income) - SUM(all expense)
  const globalBalance = allTransactions.reduce((sum, t) => {
    return sum + (t.type === 'income' ? Number(t.amount) : -Number(t.amount));
  }, 0);

  // Calculate per-account balances
  const accountBalances = accounts.map(acc => {
    const rule = allocationRules.find(r => r.account_id === acc.id);
    // For master: income that hasn't been allocated (unallocated income)
    // For others: allocated income - expenses from that account
    const accTxns = allTransactions.filter(t => t.account_id === acc.id);
    const accIncome = accTxns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const accExpense = accTxns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    return {
      id: acc.id,
      name: acc.name,
      icon: acc.icon,
      balance: accIncome - accExpense,
      is_master: acc.is_master,
      percentage: rule?.percentage,
    };
  });

  const idealSaving = semesterStats.income * (savingRule.ideal_saving_ratio / 100);

  return (
    <div className="space-y-4 animate-fade-in pb-4">
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

      {/* Card 1 - Global Balance */}
      <GlobalBalanceCard totalBalance={globalBalance} />

      {/* Card 2 - Account Balances */}
      {accounts.length > 0 && <AccountBalanceCards accounts={accountBalances} />}

      {/* Card 3 - Active Semester */}
      {activeSemester && (
        <ActiveSemesterCard
          name={activeSemester.name}
          income={semesterStats.income}
          expense={semesterStats.expense}
          saving={semesterStats.saving}
        />
      )}

      {/* Card 4 - Saving Target */}
      {activeSemester && (
        <SavingTargetCard
          target={Number(activeSemester.saving_target)}
          actual={semesterStats.saving}
          idealSaving={idealSaving}
          idealRatio={savingRule.ideal_saving_ratio}
        />
      )}

      {/* Card 5 - Recent Transactions */}
      <div>
        <h2 className="text-sm font-bold text-foreground mb-2">Transaksi Terbaru</h2>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm bg-card rounded-2xl border border-border">
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
        accounts={accounts}
        semesterId={activeSemester?.id || null}
        onSuccess={fetchData}
      />
    </div>
  );
}
