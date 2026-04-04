import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transaction, FilterState, Role } from '../types';
import { MOCK_TRANSACTIONS } from '../data/mockData';

interface AppState {
  transactions: Transaction[];
  role: Role;
  filters: FilterState;
  darkMode: boolean;
  activeTab: string;
  setRole: (role: Role) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  toggleDarkMode: () => void;
  setActiveTab: (tab: string) => void;
  resetFilters: () => void;
}

const defaultFilters: FilterState = {
  search: '',
  category: 'All',
  type: 'All',
  sortBy: 'date',
  sortOrder: 'desc',
  dateRange: { start: '', end: '' },
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      transactions: MOCK_TRANSACTIONS,
      role: 'viewer',
      filters: defaultFilters,
      darkMode: false,
      activeTab: 'dashboard',

      setRole: (role) => set({ role }),
      setFilters: (filters) => set((s) => ({ filters: { ...s.filters, ...filters } })),
      addTransaction: (tx) =>
        set((s) => ({
          transactions: [{ ...tx, id: Date.now().toString() }, ...s.transactions],
        })),
      updateTransaction: (id, tx) =>
        set((s) => ({
          transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...tx } : t)),
        })),
      deleteTransaction: (id) =>
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      setActiveTab: (tab) => set({ activeTab: tab }),
      resetFilters: () => set({ filters: defaultFilters }),
    }),
    {
      name: 'finance-dashboard-storage',
      partialize: (s) => ({ transactions: s.transactions, darkMode: s.darkMode, role: s.role }),
    }
  )
);
