import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

interface PendingTransaction {
  id: string;
  user_id: string;
  semester_id: string;
  account_id: string | null;
  category_id: string | null;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  notes?: string;
}

interface OfflineState {
  pendingTransactions: PendingTransaction[];
  addPending: (tx: PendingTransaction) => void;
  syncPending: () => Promise<void>;
  isOnline: boolean;
  setOnline: (online: boolean) => void;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      pendingTransactions: [],
      isOnline: navigator.onLine,

      setOnline: (online: boolean) => set({ isOnline: online }),

      addPending: (tx: PendingTransaction) => {
        set(state => ({ pendingTransactions: [...state.pendingTransactions, tx] }));
      },

      syncPending: async () => {
        const { pendingTransactions } = get();
        if (!pendingTransactions.length) return;

        const successful: string[] = [];
        for (const tx of pendingTransactions) {
          const { id, ...data } = tx;
          const { error } = await supabase.from('transactions').insert(data);
          if (!error) successful.push(id);
        }

        set(state => ({
          pendingTransactions: state.pendingTransactions.filter(tx => !successful.includes(tx.id)),
        }));
      },
    }),
    { name: 'janjikumoney-offline' }
  )
);

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useOfflineStore.getState().setOnline(true);
    useOfflineStore.getState().syncPending();
  });
  window.addEventListener('offline', () => {
    useOfflineStore.getState().setOnline(false);
  });
}
