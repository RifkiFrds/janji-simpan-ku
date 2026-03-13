import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Plus, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';

export default function Profil() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📁');

  const fetchData = async () => {
    if (!user) return;
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(prof);

    const { data: cats } = await supabase.from('categories').select('*').order('is_default', { ascending: false });
    setCategories(cats || []);
  };

  useEffect(() => { fetchData(); }, [user]);

  const addCategory = async () => {
    if (!user || !newCatName) return;
    const { error } = await supabase.from('categories').insert({
      user_id: user.id,
      name: newCatName,
      icon: newCatIcon,
      is_default: false,
    });
    if (error) {
      toast.error('Gagal menambah kategori');
    } else {
      toast.success('Kategori ditambahkan');
      setNewCatName('');
      setNewCatIcon('📁');
      setShowAddCat(false);
      fetchData();
    }
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      toast.error('Gagal menghapus kategori');
    } else {
      toast.success('Kategori dihapus');
      fetchData();
    }
  };

  const initials = (profile?.full_name || user?.email || '?')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-xl font-bold text-foreground">Profil</h1>

      <div className="bg-card rounded-2xl p-6 shadow-sm border border-border flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-bold text-foreground text-lg">{profile?.full_name || 'Pengguna'}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
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
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{cat.icon}</span>
                <span className="text-sm font-medium text-foreground">{cat.name}</span>
                {cat.is_default && (
                  <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">Default</span>
                )}
              </div>
              {!cat.is_default && (
                <button onClick={() => deleteCategory(cat.id)} className="text-muted-foreground hover:text-expense">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <Button
        variant="outline"
        onClick={signOut}
        className="w-full rounded-xl h-12 font-semibold text-expense border-expense/20 hover:bg-expense/5"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Keluar
      </Button>

      <Dialog open={showAddCat} onOpenChange={setShowAddCat}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Tambah Kategori</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">Ikon</Label>
              <Input
                value={newCatIcon}
                onChange={(e) => setNewCatIcon(e.target.value)}
                className="rounded-xl mt-1 text-2xl text-center"
                maxLength={2}
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">Nama Kategori</Label>
              <Input
                placeholder="Contoh: Makanan"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="rounded-xl mt-1"
              />
            </div>
            <Button onClick={addCategory} className="w-full rounded-xl h-12 font-semibold">
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
