import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatRupiah } from '@/lib/format';
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

  useEffect(() => {
    if (!user) return;
    supabase
      .from('semesters')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false })
      .then(({ data }) => {
        setSemesters(data || []);
        if (data?.length) setSelectedSemester(data[0].id);
      });
  }, [user]);

  useEffect(() => {
    if (!selectedSemester || !user) return;

    // Category breakdown
    supabase
      .from('transactions')
      .select('amount, type, categories(name)')
      .eq('semester_id', selectedSemester)
      .eq('type', 'expense')
      .then(({ data }) => {
        const map: Record<string, number> = {};
        (data || []).forEach((t: any) => {
          const cat = t.categories?.name || 'Lainnya';
          map[cat] = (map[cat] || 0) + Number(t.amount);
        });
        setCategoryData(Object.entries(map).map(([name, value]) => ({ name, value })));
      });

    // Income vs expense comparison
    supabase
      .from('transactions')
      .select('amount, type')
      .eq('semester_id', selectedSemester)
      .then(({ data }) => {
        const income = (data || []).filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
        const expense = (data || []).filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
        setComparisonData([
          { name: 'Pemasukan', value: income },
          { name: 'Pengeluaran', value: expense },
        ]);

        // Predicted balance
        supabase
          .from('planned_expenses')
          .select('amount')
          .eq('semester_id', selectedSemester)
          .then(({ data: planned }) => {
            const plannedTotal = (planned || []).reduce((s, p) => s + Number(p.amount), 0);
            setPredictedBalance(income - expense - plannedTotal);
            setPlannedExpenses(planned || []);
          });
      });

    // Savings timeline across all semesters
    supabase
      .from('semesters')
      .select('id, name')
      .eq('user_id', user.id)
      .order('start_date', { ascending: true })
      .then(async ({ data: sems }) => {
        const timeline = [];
        for (const sem of sems || []) {
          const { data: txns } = await supabase
            .from('transactions')
            .select('amount, type')
            .eq('semester_id', sem.id);
          const income = (txns || []).filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
          const expense = (txns || []).filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
          timeline.push({ name: sem.name, tabungan: income - expense });
        }
        setSavingsTimeline(timeline);
      });
  }, [selectedSemester, user]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-2 shadow-lg text-xs">
          <p className="font-semibold">{payload[0].name}</p>
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

      {/* Category Pie Chart */}
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
        <h2 className="text-sm font-bold text-foreground mb-4">Pengeluaran per Kategori</h2>
        {categoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
              />
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
              <Line
                type="monotone"
                dataKey="tabungan"
                stroke="hsl(217, 91%, 60%)"
                strokeWidth={2}
                dot={{ fill: 'hsl(217, 91%, 60%)', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Belum ada data</p>
        )}
      </div>

      {/* Predicted Balance */}
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
        <h2 className="text-sm font-bold text-foreground mb-2">Prediksi Saldo Akhir Semester</h2>
        <p className="text-2xl font-bold balance-number text-primary">{formatRupiah(predictedBalance)}</p>
        {plannedExpenses.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Termasuk {plannedExpenses.length} rencana pengeluaran
          </p>
        )}
      </div>
    </div>
  );
}
