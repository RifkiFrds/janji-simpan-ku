import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  is_master: boolean;
  created_at: string;
  updated_at: string;
}

export interface AllocationRule {
  id: string;
  user_id: string;
  account_id: string;
  percentage: number;
}

interface AccountState {
  accounts: Account[];
  allocationRules: AllocationRule[];
  loading: boolean;
  fetchAccounts: (userId: string) => Promise<void>;
  fetchAllocationRules: (userId: string) => Promise<void>;
  createDefaultAccounts: (userId: string) => Promise<void>;
  updateAllocationRule: (userId: string, accountId: string, percentage: number) => Promise<void>;
  addAccount: (userId: string, name: string, icon: string) => Promise<void>;
  getAccountBalance: (accountId: string, transactions: any[]) => number;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  allocationRules: [],
  loading: false,

  fetchAccounts: async (userId: string) => {
    set({ loading: true });
    const { data } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('is_master', { ascending: false });
    set({ accounts: (data as Account[]) || [], loading: false });
  },

  fetchAllocationRules: async (userId: string) => {
    const { data } = await supabase
      .from('allocation_rules')
      .select('*')
      .eq('user_id', userId);
    set({ allocationRules: (data as AllocationRule[]) || [] });
  },

  createDefaultAccounts: async (userId: string) => {
    const defaults = [
      { name: 'Master Income', icon: '👑', is_master: true },
      { name: 'Kebutuhan Pokok', icon: '🏠', is_master: false },
      { name: 'Tabungan Masa Depan', icon: '🏦', is_master: false },
      { name: 'Lifestyle / Hiburan', icon: '🎮', is_master: false },
    ];

    const { data: accounts } = await supabase
      .from('accounts')
      .insert(defaults.map(d => ({ ...d, user_id: userId })))
      .select();

    if (accounts) {
      // Create default allocation rules (skip master)
      const nonMaster = accounts.filter(a => !a.is_master);
      const defaultPercentages = [40, 40, 20];
      await supabase.from('allocation_rules').insert(
        nonMaster.map((acc, i) => ({
          user_id: userId,
          account_id: acc.id,
          percentage: defaultPercentages[i] || 0,
        }))
      );
      set({ accounts: accounts as Account[] });
      await get().fetchAllocationRules(userId);
    }
  },

  updateAllocationRule: async (userId: string, accountId: string, percentage: number) => {
    await supabase
      .from('allocation_rules')
      .upsert({ user_id: userId, account_id: accountId, percentage }, { onConflict: 'user_id,account_id' });
    await get().fetchAllocationRules(userId);
  },

  addAccount: async (userId: string, name: string, icon: string) => {
    await supabase.from('accounts').insert({ user_id: userId, name, icon, is_master: false });
    await get().fetchAccounts(userId);
  },

  getAccountBalance: (_accountId: string, _transactions: any[]) => {
    // Calculate balance for a specific account from transactions
    return 0; // Implemented in component level
  },
}));
