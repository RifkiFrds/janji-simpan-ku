import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useAccountStore } from '@/stores/useAccountStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import GlobalBalanceCard from '@/components/GlobalBalanceCard';
import AccountBalanceCards, { type AccountBalanceFilter } from '@/components/AccountBalanceCards';
import ActiveSemesterCard from '@/components/ActiveSemesterCard';
import SavingTargetCard from '@/components/SavingTargetCard';
import TransactionItem from '@/components/TransactionItem';
import QuickAddTransactionModal from '@/components/QuickAddTransactionModal';
import CashflowModeBanner from '@/components/CashflowModeBanner';
import DailySafeToSpendCard from '@/components/DailySafeToSpendCard';
import PaylaterStreakCard from '@/components/PaylaterStreakCard';
import VaultLockModal from '@/components/VaultLockModal';
import { Plus } from 'lucide-react';
import { getMonthBounds, getBudgetMode, getPaylaterStreakDays } from '@/lib/budgetMode';

export default function Dashboard() {
  const { user } = useAuth();
  const { accounts, allocationRules, fetchAccounts, fetchAllocationRules, createDefaultAccounts } = useAccountStore();
  const { budgetSettings, fetchBudgetSettings } = useBudgetStore();
  const [activeSemester, setActiveSemester] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [semesterStats, setSemesterStats] = useState({ income: 0, expense: 0, saving: 0 });
  const [savingRule, setSavingRule] = useState({ min_saving_per_semester: 0, ideal_saving_ratio: 40 });
  const [monthStats, setMonthStats] = useState({ income: 0, expense: 0 });
  const [streakDays, setStreakDays] = useState(0);
  const [vaultLockTx, setVaultLockTx] = useState<{ id: string; amount: number } | null>(null);
  const [accountFilter, setAccountFilter] = useState<AccountBalanceFilter>('month');

  const fetchData = async () => {
    if (!user) return;

    // Fetch accounts, create defaults if none exist
    await fetchAccounts(user.id);
    await fetchAllocationRules(user.id);
    await fetchBudgetSettings(user.id);

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

    // Get ALL transactions for global balance (date ikut diambil untuk filter per-akun bulan ini/semua)
    const { data: allTxns } = await supabase
      .from('transactions')
      .select('amount, type, account_id, date')
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

    // ===== Bulan kalender (ADDITIVE, tidak menyentuh logic semester di atas) =====
    const { startISO, endISO } = getMonthBounds();
    const { data: monthTxns } = await supabase
      .from('transactions')
      .select('amount, type, categories(is_debt)')
      .eq('user_id', user.id)
      .gte('date', startISO)
      .lte('date', endISO);

    const monthlyIncome = (monthTxns || []).filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const monthlyExpense = (monthTxns || []).filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    setMonthStats({ income: monthlyIncome, expense: monthlyExpense });

    // Paylater streak: transaksi "buruk" terakhir, dideteksi dari 2 sumber:
    // 1) kategori yang ditandai is_debt = true (mis. kategori "Hutang")
    // 2) judul transaksi pengeluaran yang mengandung kata paylater/hutang/foya
    //    (buat jaga-jaga kalau user catat di kategori lain tapi kasih keterangan di judul)
    const [{ data: lastDebtTxn }, { data: lastKeywordTxn }] = await Promise.all([
      supabase
        .from('transactions')
        .select('date, categories!inner(is_debt)')
        .eq('user_id', user.id)
        .eq('categories.is_debt', true)
        .order('date', { ascending: false })
        .limit(1),
      supabase
        .from('transactions')
        .select('date')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .or('title.ilike.%paylater%,title.ilike.%hutang%,title.ilike.%foya%')
        .order('date', { ascending: false })
        .limit(1),
    ]);

    const { data: prof } = await supabase.from('profiles').select('created_at').eq('id', user.id).single();
    const candidateDates = [lastDebtTxn?.[0]?.date, lastKeywordTxn?.[0]?.date].filter(Boolean) as string[];
    const lastDebtDate = candidateDates.length ? candidateDates.sort().at(-1)! : null;
    setStreakDays(getPaylaterStreakDays(lastDebtDate, prof?.created_at ?? new Date().toISOString()));
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

  // Calculate per-account balances, bisa difilter "Bulan Ini" atau "Semua" (all-time)
  const { startISO: monthStartISO, endISO: monthEndISO } = getMonthBounds();
  const accountBalances = accounts.map(acc => {
    const rule = allocationRules.find(r => r.account_id === acc.id);
    // For master: income that hasn't been allocated (unallocated income)
    // For others: allocated income - expenses from that account
    const accTxns = allTransactions
      .filter(t => t.account_id === acc.id)
      .filter(t => accountFilter === 'all' || (t.date >= monthStartISO && t.date <= monthEndISO));
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

  const threshold = Number(budgetSettings?.monthly_threshold ?? 2000000);
  const mode = getBudgetMode(monthStats.income, threshold);

  const handleAddSuccess = (insertedTx?: { id: string; type: string; amount: number }) => {
    fetchData();
    if (insertedTx?.type === 'income' && insertedTx.amount > threshold) {
      setVaultLockTx({ id: insertedTx.id, amount: insertedTx.amount });
    }
  };

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

      {/* Cashflow Mode Banner - BARU, paling atas sebelum saldo global */}
      <CashflowModeBanner
        mode={mode}
        monthlyIncome={monthStats.income}
        monthlyExpense={monthStats.expense}
        threshold={threshold}
      />

      {/* Daily Safe-to-Spend - BARU */}
      <DailySafeToSpendCard monthlyExpense={monthStats.expense} threshold={threshold} />

      {/* Card 1 - Global Balance */}
      <GlobalBalanceCard totalBalance={globalBalance} />

      {/* Card 2 - Account Balances */}
      {accounts.length > 0 && (
        <AccountBalanceCards
          accounts={accountBalances}
          filter={accountFilter}
          onFilterChange={setAccountFilter}
        />
      )}

      {/* Zero Paylater Streak - BARU */}
      <PaylaterStreakCard streakDays={streakDays} />

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
        mode={mode}
        monthlyExpense={monthStats.expense}
        threshold={threshold}
        onSuccess={handleAddSuccess}
      />

      <VaultLockModal
        open={!!vaultLockTx}
        incomeAmount={vaultLockTx?.amount ?? 0}
        threshold={threshold}
        onConfirm={async () => {
          if (!vaultLockTx) return;
          await supabase.from('transactions').update({ vault_ack: true }).eq('id', vaultLockTx.id);
          setVaultLockTx(null);
          fetchData();
        }}
      />
    </div>
  );
}
