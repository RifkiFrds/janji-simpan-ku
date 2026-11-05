import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export interface BudgetSettings {
  id: string;
  user_id: string;
  monthly_threshold: number;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  icon: string;
  is_default: boolean;
  is_essential: boolean;
  is_debt: boolean;
}

interface BudgetState {
  budgetSettings: BudgetSettings | null;
  categories: Category[];
  loading: boolean;
  fetchBudgetSettings: (userId: string) => Promise<void>;
  updateThreshold: (userId: string, newThreshold: number) => Promise<void>;
  fetchCategoriesWithFlags: (userId: string) => Promise<void>;
  toggleCategoryFlag: (categoryId: string, field: 'is_essential' | 'is_debt', value: boolean) => Promise<void>;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgetSettings: null,
  categories: [],
  loading: false,

  fetchBudgetSettings: async (userId: string) => {
    set({ loading: true });
    const { data } = await supabase
      .from('budget_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      set({ budgetSettings: data as BudgetSettings, loading: false });
      return;
    }

    // Insert default kalau belum ada row
    const { data: created } = await supabase
      .from('budget_settings')
      .insert({ user_id: userId, monthly_threshold: 2000000 })
      .select()
      .single();

    set({ budgetSettings: (created as BudgetSettings) || null, loading: false });
  },

  updateThreshold: async (userId: string, newThreshold: number) => {
    await supabase
      .from('budget_settings')
      .upsert({ user_id: userId, monthly_threshold: newThreshold }, { onConflict: 'user_id' });
    await get().fetchBudgetSettings(userId);
  },

  fetchCategoriesWithFlags: async (_userId: string) => {
    const { data } = await supabase.from('categories').select('*').order('is_default', { ascending: false });
    set({ categories: (data as Category[]) || [] });
  },

  toggleCategoryFlag: async (categoryId: string, field: 'is_essential' | 'is_debt', value: boolean) => {
    await supabase
      .from('categories')
      .update({ [field]: value })
      .eq('id', categoryId);
    const { categories } = get();
    set({
      categories: categories.map((c) => (c.id === categoryId ? { ...c, [field]: value } : c)),
    });
  },
}));
