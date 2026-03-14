import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatRupiah } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Lightbulb, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function Analitik() {
  const { user } = useAuth();
  const [semesters, setSemesters] = useState<any[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [savingsTimeline, setSavingsTimeline] = useState<any[]>([]);
  const [plannedExpenses, setPlannedExpenses] = useState<any[]>([]);
  const [predictedBalance, setPredictedBalance] = useState(0);
  const [insights, setInsights] = useState<string[]>([]);
  const [showAddPlanned, setShowAddPlanned] = useState(false);
  const [plannedTitle, setPlannedTitle] = useState('');
  const [plannedAmount, setPlannedAmount] = useState('');
  const [semesterIncome, setSemesterIncome] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from('semesters').select('*').eq('user_id', user.id).order('start_date', { ascending: false })
      .then(({ data }) => {
        setSemesters(data || []);
        if (data?.length) setSelectedSemester(data[0].id);
      });
  }, [user]);

  useEffect(() => {
    if (!selectedSemester || !user) return;

    // Category breakdown
    supabase.from('transactions').select('amount, type, categories(name)').eq('semester_id', selectedSemester).eq('type', 'expense')
      .then(({ data }) => {
        const map: Record<string, number> = {};
        (data || []).forEach((t: any) => {
          const cat = t.categories?.name || 'Lainnya';
          map[cat] = (map[cat] || 0) + Number(t.amount);
        });
        const catArr = Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
        setCategoryData(catArr);

        // Generate insights
        const newInsights: string[] = [];
        if (catArr.length > 0) {
          newInsights.push(`Pengeluaran terbesar: ${catArr[0].name} ${formatRupiah(catArr[0].value)}`);
        }
        setInsights(newInsights);
      });

    // Income vs expense
    supabase.from('transactions').select('amount, type').eq('semester_id', selectedSemester)
      .then(({ data }) => {
        const income = (data || []).filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
        const expense = (data || []).filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
        setComparisonData([
          { name: 'Pemasukan', value: income },
          { name: 'Pengeluaran', value: expense },
        ]);
        setSemesterIncome(income);

        // Planned expenses & prediction
        supabase.from('planned_expenses').select('*').eq('semester_id', selectedSemester)
          .then(({ data: planned }) => {
            setPlannedExpenses(planned || []);
            const plannedTotal = (planned || []).reduce((s: number, p: any) => s + Number(p.amount), 0);
            setPredictedBalance(income - expense - plannedTotal);
          });
      });

    // Savings timeline
    supabase.from('semesters').select('id, name').eq('user_id', user.id).order('start_date', { ascending: true })
      .then(async ({ data: sems }) => {
        const timeline = [];
        let cumulative = 0;
        for (const sem of sems || []) {
          const { data: txns } = await supabase.from('transactions').select('amount, type').eq('semester_id', sem.id);
          const inc = (txns || []).filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
          const exp = (txns || []).filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
          cumulative += (inc - exp);
          timeline.push({ name: sem.name, tabungan: inc - exp, kumulatif: cumulative });
        }
        setSavingsTimeline(timeline);
      });
  }, [selectedSemester, user]);

  const addPlannedExpense = async () => {
    if (!user || !plannedTitle || !plannedAmount || !selectedSemester) return;
    const { error } = await supabase.from('planned_expenses').insert({
      user_id: user.id,
      semester_id: selectedSemester,
      title: plannedTitle,
      amount: parseFloat(plannedAmount),
    });
    if (error) { toast.error('Gagal menambahkan'); return; }
    toast.success('Rencana pengeluaran ditambahkan');
    setPlannedTitle('');
    setPlannedAmount('');
    setShowAddPlanned(false);
    // Re-fetch
    const { data: planned } = await supabase.from('planned_expenses').select('*').eq('semester_id', selectedSemester);
    setPlannedExpenses(planned || []);
    const plannedTotal = (planned || []).reduce((s: number, p: any) => s + Number(p.amount), 0);
    const currentExpense = comparisonData.find(d => d.name === 'Pengeluaran')?.value || 0;
    setPredictedBalance(semesterIncome - currentExpense - plannedTotal);
  };

  const deletePlanned = async (id: string) => {
    await supabase.from('planned_expenses').delete().eq('id', id);
    const { data: planned } = await supabase.from('planned_expenses').select('*').eq('semester_id', selectedSemester);
    setPlannedExpenses(planned || []);
    const plannedTotal = (planned || []).reduce((s: number, p: any) => s + Number(p.amount), 0);
    const currentExpense = comparisonData.find(d => d.name === 'Pengeluaran')?.value || 0;
    setPredictedBalance(semesterIncome - currentExpense - plannedTotal);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-2 shadow-lg text-xs">
          <p className="font-semibold">{payload[0].name || payload[0].dataKey}</p>
          <p className="text-primary">{formatRupiah(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-xl font-bold text-foreground">Analitik</h1>

      <Select value={selectedSemester} onValueChange={setSelectedSemester}>
        <SelectTrigger className="rounded-xl">
          <SelectValue placeholder="Pilih Semester" />
        </SelectTrigger>
        <SelectContent>
          {semesters.map((s) => (
            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Financial Insights */}
      {insights.length > 0 && (
        <div className="bg-warning/5 border border-warning/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-warning" />
            <span className="text-sm font-bold text-foreground">Insight Keuangan</span>
          </div>
          {insights.map((insight, i) => (
            <p key={i} className="text-xs text-muted-foreground">{insight}</p>
          ))}
        </div>
      )}

      {/* Category Pie Chart */}
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
        <h2 className="text-sm font-bold text-foreground mb-4">Pengeluaran per Kategori</h2>
        {categoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                {categoryData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(value) => <span className="text-xs text-foreground">{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Belum ada data</p>
        )}
      </div>

      {/* Income vs Expense */}
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
        <h2 className="text-sm font-bold text-foreground mb-4">Pemasukan vs Pengeluaran</h2>
        {comparisonData.some(d => d.value > 0) ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                <Cell fill="hsl(152, 69%, 53%)" />
                <Cell fill="hsl(0, 84%, 60%)" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Belum ada data</p>
        )}
      </div>

      {/* Savings Growth */}
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
        <h2 className="text-sm font-bold text-foreground mb-4">Pertumbuhan Tabungan</h2>
        {savingsTimeline.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={savingsTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="kumulatif" name="Total Tabungan" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={{ fill: 'hsl(217, 91%, 60%)', r: 4 }} />
              <Line type="monotone" dataKey="tabungan" name="Per Semester" stroke="hsl(152, 69%, 53%)" strokeWidth={2} dot={{ fill: 'hsl(152, 69%, 53%)', r: 3 }} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Belum ada data</p>
        )}
      </div>

      {/* Planned Expenses & Prediction */}
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-foreground">Rencana Pengeluaran</h2>
          <Button size="sm" variant="outline" onClick={() => setShowAddPlanned(true)} className="rounded-xl gap-1">
            <Plus className="h-3 w-3" /> Tambah
          </Button>
        </div>
        {plannedExpenses.length > 0 ? (
          <div className="space-y-2 mb-4">
            {plannedExpenses.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-2">
                <span className="text-sm text-foreground">{p.title}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-expense balance-number">{formatRupiah(p.amount)}</span>
                  <button onClick={() => deletePlanned(p.id)} className="text-muted-foreground hover:text-expense">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mb-4">Belum ada rencana pengeluaran</p>
        )}
        <div className="bg-secondary/50 rounded-xl p-3">
          <p className="text-xs text-muted-foreground mb-1">Prediksi Saldo Akhir Semester</p>
          <p className="text-2xl font-bold balance-number text-primary">{formatRupiah(predictedBalance)}</p>
        </div>
      </div>

      {/* Financial Timeline */}
      {savingsTimeline.length > 0 && (
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
          <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Perjalanan Keuangan
          </h2>
          <div className="relative pl-6 space-y-3">
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
            {savingsTimeline.map((s, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-4 top-1 h-3 w-3 rounded-full bg-primary border-2 border-card" />
                <div className="bg-secondary/30 rounded-xl p-3">
                  <p className="text-xs font-semibold text-foreground">{s.name}</p>
                  <p className="text-sm font-bold balance-number text-primary">{formatRupiah(s.tabungan)}</p>
                </div>
              </div>
            ))}
            <div className="relative">
              <div className="absolute -left-4 top-1 h-3 w-3 rounded-full bg-accent border-2 border-card" />
              <div className="bg-accent/10 rounded-xl p-3">
                <p className="text-xs font-semibold text-foreground">Total Lifetime Savings</p>
                <p className="text-lg font-bold balance-number text-accent">
                  {formatRupiah(savingsTimeline[savingsTimeline.length - 1]?.kumulatif || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Planned Expense Dialog */}
      <Dialog open={showAddPlanned} onOpenChange={setShowAddPlanned}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Rencana Pengeluaran</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">Judul</Label>
              <Input placeholder="Contoh: Baju Lebaran" value={plannedTitle} onChange={(e) => setPlannedTitle(e.target.value)} className="rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">Jumlah (Rp)</Label>
              <Input type="number" placeholder="0" value={plannedAmount} onChange={(e) => setPlannedAmount(e.target.value)} className="rounded-xl mt-1" />
            </div>
            <Button onClick={addPlannedExpense} className="w-full rounded-xl h-12 font-semibold">Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
