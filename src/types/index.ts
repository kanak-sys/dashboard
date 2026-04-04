export type TransactionCategory =
  | 'Food & Dining'
  | 'Shopping'
  | 'Transport'
  | 'Entertainment'
  | 'Utilities'
  | 'Healthcare'
  | 'Education'
  | 'Salary'
  | 'Freelance'
  | 'Investment'
  | 'Other';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  category: TransactionCategory;
  type: TransactionType;
  description: string;
  merchant?: string;
}

export type Role = 'viewer' | 'admin';

export interface FilterState {
  search: string;
  category: TransactionCategory | 'All';
  type: TransactionType | 'All';
  sortBy: 'date' | 'amount' | 'category';
  sortOrder: 'asc' | 'desc';
  dateRange: { start: string; end: string };
}
