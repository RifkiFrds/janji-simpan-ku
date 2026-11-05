import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Plus, Trash2, Tag, Shield, Settings, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { formatRupiah } from '@/lib/format';
import FounderRunwayWidget from '@/components/FounderRunwayWidget';

export default function Profil() {
  const { user, signOut } = useAuth();
  const { budgetSettings, categories, fetchBudgetSettings, updateThreshold, fetchCategoriesWithFlags, toggleCategoryFlag } = useBudgetStore();
  const [profile, setProfile] = useState<any>(null);
  const [showAddCat, setShowAddCat] = useState(false);
  const [showSavingRule, setShowSavingRule] = useState(false);
  const [showThreshold, setShowThreshold] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📁');
  const [savingRule, setSavingRule] = useState({ min_saving_per_semester: 0, ideal_saving_ratio: 40 });
  const [thresholdInput, setThresholdInput] = useState(2000000);
  const [globalBalance, setGlobalBalance] = useState(0);

  const fetchData = async () => {
    if (!user) return;
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(prof);

    await fetchCategoriesWithFlags(user.id);
    await fetchBudgetSettings(user.id);

    const { data: sr } = await supabase.from('saving_rules').select('*').eq('user_id', user.id).maybeSingle();
    if (sr) setSavingRule(sr);

    const { data: allTxns } = await supabase.from('transactions').select('amount, type').eq('user_id', user.id);
    const balance = (allTxns || []).reduce((sum, t) => sum + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0);
    setGlobalBalance(balance);
  };

  useEffect(() => { fetchData(); }, [user]);

  useEffect(() => {
    if (budgetSettings) setThresholdInput(Number(budgetSettings.monthly_threshold));
  }, [budgetSettings]);

  const addCategory = async () => {
    if (!user || !newCatName) return;
    const { error } = await supabase.from('categories').insert({ user_id: user.id, name: newCatName, icon: newCatIcon, is_default: false });
    if (error) { toast.error('Gagal menambah kategori'); return; }
    toast.success('Kategori ditambahkan');
    setNewCatName(''); setNewCatIcon('📁'); setShowAddCat(false);
    fetchData();
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) { toast.error('Gagal menghapus kategori'); } else { toast.success('Kategori dihapus'); fetchData(); }
  };

  const saveSavingRule = async () => {
    if (!user) return;
    const { error } = await supabase.from('saving_rules').upsert({
      user_id: user.id,
      min_saving_per_semester: savingRule.min_saving_per_semester,
      ideal_saving_ratio: savingRule.ideal_saving_ratio,
    }, { onConflict: 'user_id' });
    if (error) { toast.error('Gagal menyimpan'); return; }
    toast.success('Aturan tabungan disimpan');
    setShowSavingRule(false);
  };

  const saveThreshold = async () => {
    if (!user) return;
    await updateThreshold(user.id, thresholdInput);
    toast.success('Ambang batas bulanan disimpan');
    setShowThreshold(false);
  };

  const initials = (profile?.full_name || user?.email || '?')
    .split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-xl font-bold text-foreground">Profil</h1>

      <div className="bg-card rounded-2xl p-6 shadow-sm border border-border flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-bold text-foreground text-lg">{profile?.full_name || 'Pengguna'}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      {/* Saving Discipline Rules */}
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Aturan Tabungan
          </h2>
          <Button size="sm" variant="outline" onClick={() => setShowSavingRule(true)} className="rounded-xl gap-1">
            <Settings className="h-3 w-3" /> Atur
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/50 rounded-xl p-3">
            <p className="text-[10px] text-muted-foreground">Min. Tabungan/Semester</p>
            <p className="text-sm font-bold balance-number text-foreground">{formatRupiah(savingRule.min_saving_per_semester)}</p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-3">
            <p className="text-[10px] text-muted-foreground">Rasio Tabungan Ideal</p>
            <p className="text-sm font-bold text-foreground">{savingRule.ideal_saving_ratio}%</p>
          </div>
        </div>
      </div>

      {/* Ambang Batas Bulanan */}
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            Ambang Batas Bulanan
          </h2>
          <Button size="sm" variant="outline" onClick={() => setShowThreshold(true)} className="rounded-xl gap-1">
            <Settings className="h-3 w-3" /> Atur
          </Button>
        </div>
        <div className="bg-secondary/50 rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground">Batas Mode Survival/Surplus</p>
          <p className="text-sm font-bold balance-number text-foreground">
            {formatRupiah(Number(budgetSettings?.monthly_threshold ?? 2000000))}
          </p>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            Kategori
          </h2>
          <Button size="sm" variant="outline" onClick={() => setShowAddCat(true)} className="rounded-xl gap-1">
            <Plus className="h-3 w-3" /> Tambah
          </Button>
        </div>
        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between py-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{cat.icon}</span>
                <span className="text-sm font-medium text-foreground">{cat.name}</span>
                {cat.is_default && <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">Default</span>}
              </div>
              <div className="flex items-center gap-4 ml-auto">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">Pokok</span>
                  <Switch
                    checked={cat.is_essential}
                    onCheckedChange={(v) => toggleCategoryFlag(cat.id, 'is_essential', v)}
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">Hutang</span>
                  <Switch
                    checked={cat.is_debt}
                    onCheckedChange={(v) => toggleCategoryFlag(cat.id, 'is_debt', v)}
                  />
                </div>
                {!cat.is_default && (
                  <button onClick={() => deleteCategory(cat.id)} className="text-muted-foreground hover:text-expense">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Founder Runway */}
      <FounderRunwayWidget liquidBalance={globalBalance} monthlyOpex={Number(budgetSettings?.monthly_threshold ?? 2000000)} />

      <Button variant="outline" onClick={signOut} className="w-full rounded-xl h-12 font-semibold text-expense border-expense/20 hover:bg-expense/5">
        <LogOut className="h-4 w-4 mr-2" /> Keluar
      </Button>

      {/* Add Category Dialog */}
      <Dialog open={showAddCat} onOpenChange={setShowAddCat}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle>Tambah Kategori</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">Ikon</Label>
              <Input value={newCatIcon} onChange={(e) => setNewCatIcon(e.target.value)} className="rounded-xl mt-1 text-2xl text-center" maxLength={2} />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">Nama Kategori</Label>
              <Input placeholder="Contoh: Makanan" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="rounded-xl mt-1" />
            </div>
            <Button onClick={addCategory} className="w-full rounded-xl h-12 font-semibold">Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Saving Rule Dialog */}
      <Dialog open={showSavingRule} onOpenChange={setShowSavingRule}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle>Aturan Tabungan</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">Minimal Tabungan per Semester (Rp)</Label>
              <Input type="number" value={savingRule.min_saving_per_semester} onChange={(e) => setSavingRule({ ...savingRule, min_saving_per_semester: parseFloat(e.target.value) || 0 })} className="rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">Rasio Tabungan Ideal (%)</Label>
              <Input type="number" value={savingRule.ideal_saving_ratio} onChange={(e) => setSavingRule({ ...savingRule, ideal_saving_ratio: parseFloat(e.target.value) || 0 })} className="rounded-xl mt-1" />
            </div>
            <Button onClick={saveSavingRule} className="w-full rounded-xl h-12 font-semibold">Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Monthly Threshold Dialog */}
      <Dialog open={showThreshold} onOpenChange={setShowThreshold}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle>Ambang Batas Bulanan</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">Batas Pengeluaran/Pemasukan (Rp)</Label>
              <Input type="number" value={thresholdInput} onChange={(e) => setThresholdInput(parseFloat(e.target.value) || 0)} className="rounded-xl mt-1" />
            </div>
            <Button onClick={saveThreshold} className="w-full rounded-xl h-12 font-semibold">Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
