import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAccountStore } from '@/stores/useAccountStore';
import { supabase } from '@/integrations/supabase/client';
import { formatRupiah } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AllocationSettings from '@/components/AllocationSettings';
import { Plus, Settings, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Rekening() {
  const { user } = useAuth();
  const { accounts, allocationRules, fetchAccounts, fetchAllocationRules, addAccount, updateAllocationRule, createDefaultAccounts } = useAccountStore();
  const [showAdd, setShowAdd] = useState(false);
  const [showAllocation, setShowAllocation] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('💳');
  const [accountBalances, setAccountBalances] = useState<Record<string, number>>({});

  const fetchData = async () => {
    if (!user) return;
    await fetchAccounts(user.id);
    await fetchAllocationRules(user.id);

    // Calculate balances per account
    const { data: txns } = await supabase
      .from('transactions')
      .select('amount, type, account_id')
      .eq('user_id', user.id);

    const balances: Record<string, number> = {};
    (txns || []).forEach(t => {
      const accId = t.account_id || 'unassigned';
      if (!balances[accId]) balances[accId] = 0;
      balances[accId] += t.type === 'income' ? Number(t.amount) : -Number(t.amount);
    });
    setAccountBalances(balances);
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (user && accounts.length === 0) {
      createDefaultAccounts(user.id).then(fetchData);
    }
  }, [user, accounts.length]);

  const handleAdd = async () => {
    if (!user || !newName) return;
    await addAccount(user.id, newName, newIcon);
    setNewName('');
    setNewIcon('💳');
    setShowAdd(false);
    toast.success('Rekening ditambahkan');
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) {
      toast.error('Gagal menghapus rekening');
    } else {
      toast.success('Rekening dihapus');
      fetchData();
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Rekening</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowAllocation(true)} className="rounded-xl gap-1">
            <Settings className="h-4 w-4" /> Alokasi
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)} className="rounded-xl gap-1">
            <Plus className="h-4 w-4" /> Tambah
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {accounts.map((acc) => {
          const balance = accountBalances[acc.id] || 0;
          const rule = allocationRules.find(r => r.account_id === acc.id);
          return (
            <div
              key={acc.id}
              className={cn(
                'rounded-2xl p-5 shadow-sm border transition-all',
                acc.is_master ? 'bg-primary/5 border-primary/20' : 'bg-card border-border'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{acc.icon}</span>
                  <div>
                    <p className="font-bold text-foreground">{acc.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {acc.is_master && (
                        <span className="text-[10px] font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                          Master
                        </span>
                      )}
                      {rule && (
                        <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded">
                          Alokasi: {rule.percentage}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right flex items-center gap-2">
                  <p className={cn(
                    'text-lg font-bold balance-number',
                    acc.is_master ? 'text-primary' : 'text-foreground'
                  )}>
                    {formatRupiah(balance)}
                  </p>
                  {!acc.is_master && (
                    <button onClick={() => handleDelete(acc.id)} className="text-muted-foreground hover:text-expense p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Account Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Tambah Rekening</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">Ikon</Label>
              <Input value={newIcon} onChange={(e) => setNewIcon(e.target.value)} className="rounded-xl mt-1 text-2xl text-center" maxLength={2} />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">Nama Rekening</Label>
              <Input placeholder="Contoh: Dana Darurat" value={newName} onChange={(e) => setNewName(e.target.value)} className="rounded-xl mt-1" />
            </div>
            <Button onClick={handleAdd} className="w-full rounded-xl h-12 font-semibold">Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Allocation Settings */}
      <AllocationSettings
        open={showAllocation}
        onOpenChange={setShowAllocation}
        accounts={accounts}
        rules={allocationRules}
        onSave={(accountId, percentage) => user ? updateAllocationRule(user.id, accountId, percentage) : Promise.resolve()}
      />
    </div>
  );
}
