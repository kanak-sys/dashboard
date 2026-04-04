import type { Transaction, FilterState, TransactionCategory } from '../types';
import { format, parseISO, isWithinInterval } from 'date-fns';

export const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  'Food & Dining': '#FF6B6B',
  'Shopping': '#4ECDC4',
  'Transport': '#45B7D1',
  'Entertainment': '#F7DC6F',
  'Utilities': '#82E0AA',
  'Healthcare': '#F0B27A',
  'Education': '#BB8FCE',
  'Salary': '#58D68D',
  'Freelance': '#5DADE2',
  'Investment': '#F4D03F',
  'Other': '#AEB6BF',
};

export const CATEGORY_ICONS: Record<TransactionCategory, string> = {
  'Food & Dining': '🍽️',
  'Shopping': '🛍️',
  'Transport': '🚗',
  'Entertainment': '🎬',
  'Utilities': '⚡',
  'Healthcare': '💊',
  'Education': '📚',
  'Salary': '💼',
  'Freelance': '💻',
  'Investment': '📈',
  'Other': '💰',
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'dd MMM yyyy');
}

export function formatShortDate(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM dd');
}

export function getFilteredTransactions(transactions: Transaction[], filters: FilterState): Transaction[] {
  let result = [...transactions];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (t) =>
        t.description.toLowerCase().includes(q) ||
        t.merchant?.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }

  if (filters.category !== 'All') {
    result = result.filter((t) => t.category === filters.category);
  }

  if (filters.type !== 'All') {
    result = result.filter((t) => t.type === filters.type);
  }

  if (filters.dateRange.start && filters.dateRange.end) {
    result = result.filter((t) =>
      isWithinInterval(parseISO(t.date), {
        start: parseISO(filters.dateRange.start),
        end: parseISO(filters.dateRange.end),
      })
    );
  }

  result.sort((a, b) => {
    let valA: string | number = a[filters.sortBy];
    let valB: string | number = b[filters.sortBy];
    if (filters.sortOrder === 'asc') return valA > valB ? 1 : -1;
    return valA < valB ? 1 : -1;
  });

  return result;
}

export function getMonthlyData(transactions: Transaction[]) {
  const months: Record<string, { income: number; expenses: number; balance: number }> = {};

  transactions.forEach((t) => {
    const month = format(parseISO(t.date), 'MMM yyyy');
    if (!months[month]) months[month] = { income: 0, expenses: 0, balance: 0 };
    if (t.type === 'income') months[month].income += t.amount;
    else months[month].expenses += t.amount;
    months[month].balance = months[month].income - months[month].expenses;
  });

  return Object.entries(months)
    .map(([name, data]) => ({ name, ...data }))
    .slice(-6);
}

export function getCategoryBreakdown(transactions: Transaction[]) {
  const expenses = transactions.filter((t) => t.type === 'expense');
  const totals: Record<string, number> = {};

  expenses.forEach((t) => {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  });

  return Object.entries(totals)
    .map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name as TransactionCategory] || '#AEB6BF',
    }))
    .sort((a, b) => b.value - a.value);
}

export function getSummaryStats(transactions: Transaction[]) {
  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  return {
    balance: income - expenses,
    income,
    expenses,
    savingsRate: income > 0 ? Math.round(((income - expenses) / income) * 100) : 0,
  };
}

export function getInsights(transactions: Transaction[]) {
  const categoryBreakdown = getCategoryBreakdown(transactions);
  const monthlyData = getMonthlyData(transactions);

  const highestCategory = categoryBreakdown[0];
  const totalExpenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const avgMonthlyExpense = monthlyData.length > 0
    ? monthlyData.reduce((s, m) => s + m.expenses, 0) / monthlyData.length
    : 0;

  const lastMonth = monthlyData[monthlyData.length - 1];
  const prevMonth = monthlyData[monthlyData.length - 2];
  const monthChange = lastMonth && prevMonth
    ? ((lastMonth.expenses - prevMonth.expenses) / prevMonth.expenses) * 100
    : 0;

  const topIncomeSource = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc: Record<string, number>, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});
  const topSource = Object.entries(topIncomeSource).sort((a, b) => b[1] - a[1])[0];

  return {
    highestCategory,
    totalExpenses,
    avgMonthlyExpense,
    monthChange,
    topIncomeSource: topSource,
    categoryBreakdown: categoryBreakdown.slice(0, 5),
  };
}
